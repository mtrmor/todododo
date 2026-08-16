import type { GetTasksOptions, TaskPage, TaskRecord } from "@/domain/tasks";
import { getErrorMessage, isAbortError } from "@/platform/api/api-error";
import { subscribeToActiveRefresh } from "@/platform/lifecycle/active-refresh";

const PAGE_SIZE = 50;

type LoadMode = "initial" | "refresh";

type CollectionState = Readonly<{
  tasks: readonly TaskRecord[];
  nextCursor: string | null;
}>;

type CoordinatorApi = Readonly<{
  getTasks(options?: GetTasksOptions): Promise<TaskPage>;
  setTaskCompleted(taskId: string, completed: boolean): Promise<TaskRecord>;
}>;

export type TaskCollectionPort<TTransaction> = Readonly<{
  getCollection(): CollectionState;
  activateQuery?(query: string): void;
  begin(status: "loading" | "refreshing" | "loading-more"): void;
  replace(tasks: readonly TaskRecord[], nextCursor: string | null): void;
  append(tasks: readonly TaskRecord[], nextCursor: string | null): void;
  fail(error: string, offline: boolean): void;
  beginCompletion(taskId: string, completed: boolean): TTransaction | null;
  confirmCompletion(task: TaskRecord): void;
  rollbackCompletion(transaction: TTransaction, error: string, offline: boolean): void;
}>;

export type TaskCollectionMessages = Readonly<{
  load: string;
  loadMore: string;
  completion: string;
}>;

type TaskCollectionCoordinatorOptions<TTransaction> = Readonly<{
  api: CoordinatorApi;
  port: TaskCollectionPort<TTransaction>;
  messages: TaskCollectionMessages;
  searchable?: boolean;
  subscribeToInvalidation(listener: () => void): () => void;
  subscribeToRefresh?(listener: () => void): () => void;
  publishInvalidation(): void;
}>;

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export class TaskCollectionCoordinator<TTransaction> {
  readonly #api: CoordinatorApi;
  readonly #messages: TaskCollectionMessages;
  readonly #port: TaskCollectionPort<TTransaction>;
  readonly #publishInvalidation: () => void;
  readonly #searchable: boolean;
  readonly #subscribeToInvalidation: (listener: () => void) => () => void;
  readonly #subscribeToRefresh: (listener: () => void) => () => void;
  #query = "";
  #request: { controller: AbortController; promise: Promise<void> } | null = null;

  constructor(options: TaskCollectionCoordinatorOptions<TTransaction>) {
    this.#api = options.api;
    this.#messages = options.messages;
    this.#port = options.port;
    this.#publishInvalidation = options.publishInvalidation;
    this.#searchable = options.searchable ?? false;
    this.#subscribeToInvalidation = options.subscribeToInvalidation;
    this.#subscribeToRefresh = options.subscribeToRefresh ?? subscribeToActiveRefresh;
  }

  connect(): () => void {
    if (!this.#searchable) {
      void this.load("initial");
    }

    const refresh = () => {
      if (this.#isEnabled()) {
        void this.load("refresh");
      }
    };
    const invalidate = () => this.#restart();
    const stopActive = this.#subscribeToRefresh(refresh);
    const stopInvalidation = this.#subscribeToInvalidation(invalidate);

    return () => {
      stopActive();
      stopInvalidation();
      this.cancel();
      this.#query = "";
    };
  }

  setQuery(query: string): void {
    if (!this.#searchable || query === this.#query) {
      return;
    }

    this.cancel();
    this.#query = query;
    this.#port.activateQuery?.(query);

    if (query) {
      void this.load("initial");
    }
  }

  load(mode: LoadMode = "refresh"): Promise<void> {
    if (!this.#isEnabled()) {
      return Promise.resolve();
    }

    if (this.#request) {
      return this.#request.promise;
    }

    const current = this.#port.getCollection();
    const controller = new AbortController();
    const query = this.#query;
    this.#port.begin(
      mode === "initial" && current.tasks.length === 0 ? "loading" : "refreshing",
    );
    const promise = this.#fetchWindow(
      Math.max(PAGE_SIZE, current.tasks.length),
      controller.signal,
      query,
    )
      .then((page) => {
        if (!controller.signal.aborted && query === this.#query) {
          this.#port.replace(page.items, page.nextCursor);
        }
      })
      .catch((error: unknown) => {
        if (!isAbortError(error) && !controller.signal.aborted && query === this.#query) {
          this.#port.fail(getErrorMessage(error, this.#messages.load), isOffline());
        }
      })
      .finally(() => {
        if (this.#request?.promise === promise) {
          this.#request = null;
        }
      });
    this.#request = { controller, promise };
    return promise;
  }

  loadMore(): Promise<void> {
    if (!this.#isEnabled()) {
      return Promise.resolve();
    }

    const current = this.#port.getCollection();

    if (!current.nextCursor) {
      return Promise.resolve();
    }

    if (this.#request) {
      return this.#request.promise;
    }

    const controller = new AbortController();
    const query = this.#query;
    this.#port.begin("loading-more");
    const promise = this.#api
      .getTasks({
        ...(query ? { query } : {}),
        cursor: current.nextCursor,
        limit: PAGE_SIZE,
        signal: controller.signal,
      })
      .then((page) => {
        if (!controller.signal.aborted && query === this.#query) {
          this.#port.append(page.items, page.nextCursor);
        }
      })
      .catch((error: unknown) => {
        if (!isAbortError(error) && !controller.signal.aborted && query === this.#query) {
          this.#port.fail(getErrorMessage(error, this.#messages.loadMore), isOffline());
        }
      })
      .finally(() => {
        if (this.#request?.promise === promise) {
          this.#request = null;
        }
      });
    this.#request = { controller, promise };
    return promise;
  }

  async setCompleted(taskId: string, completed: boolean): Promise<TaskRecord> {
    const transaction = this.#port.beginCompletion(taskId, completed);

    try {
      const task = await this.#api.setTaskCompleted(taskId, completed);
      this.#port.confirmCompletion(task);
      this.#publishInvalidation();
      return task;
    } catch (error) {
      if (transaction) {
        this.#port.rollbackCompletion(
          transaction,
          getErrorMessage(error, this.#messages.completion),
          isOffline(),
        );
      }

      throw error;
    }
  }

  cancel(): void {
    this.#request?.controller.abort();
    this.#request = null;
  }

  #isEnabled(): boolean {
    return !this.#searchable || Boolean(this.#query);
  }

  #restart(): void {
    if (!this.#isEnabled()) {
      return;
    }

    this.cancel();
    void this.load("refresh");
  }

  async #fetchWindow(
    targetCount: number,
    signal: AbortSignal,
    query: string,
  ): Promise<TaskPage> {
    const items: TaskRecord[] = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    let nextCursor: string | null = null;

    do {
      const page = await this.#api.getTasks({
        ...(query ? { query } : {}),
        cursor,
        limit: PAGE_SIZE,
        signal,
      });
      items.push(...page.items);
      nextCursor = page.nextCursor;

      if (!nextCursor || items.length >= targetCount || seen.has(nextCursor)) {
        break;
      }

      seen.add(nextCursor);
      cursor = nextCursor;
    } while (items.length < targetCount);

    return { items, nextCursor };
  }
}
