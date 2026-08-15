import { getErrorMessage, isAbortError } from "@/platform/api/api-error";
import { getTasks, setTaskCompleted } from "@/platform/api/tasks";
import type { TaskPage, TaskRecord } from "@/domain/tasks";
import { subscribeToActiveRefresh } from "@/platform/lifecycle/active-refresh";
import { normalizeSearchQuery, searchCollectionKey } from "@/shared-state";
import { taskInvalidationBus, tasksStore, type TasksStore } from "@/shared-state/internal";

const PAGE_SIZE = 50;

type SearchApi = Readonly<{
  getTasks: typeof getTasks;
  setTaskCompleted: typeof setTaskCompleted;
}>;

function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export class SearchController {
  #query = "";
  #request: { controller: AbortController; promise: Promise<void> } | null = null;

  constructor(
    private readonly store: TasksStore,
    private readonly api: SearchApi = { getTasks, setTaskCompleted },
    private readonly subscribeToRefresh = subscribeToActiveRefresh,
  ) {}

  connect(): () => void {
    const refresh = () => {
      if (this.#query) void this.load("refresh");
    };
    const stopActive = this.subscribeToRefresh(refresh);
    const stopInvalidation = taskInvalidationBus.subscribe(refresh);
    return () => {
      stopActive();
      stopInvalidation();
      this.#request?.controller.abort();
      this.#request = null;
      this.#query = "";
    };
  }

  setQuery(query: string): void {
    const normalized = normalizeSearchQuery(query);
    if (normalized === this.#query) return;
    this.#request?.controller.abort();
    this.#request = null;
    this.#query = normalized;
    this.store.activateSearch(searchCollectionKey(normalized));
    if (normalized) void this.load("initial");
  }

  load(mode: "initial" | "refresh" = "refresh"): Promise<void> {
    if (!this.#query) return Promise.resolve();
    if (this.#request) return this.#request.promise;
    const query = this.#query;
    const key = searchCollectionKey(query);
    const current = this.store.getCollection(key);
    const controller = new AbortController();
    const token = this.store.captureReadToken();
    this.store.beginCollection(
      key,
      mode === "initial" && current.ids.length === 0 ? "loading" : "refreshing",
    );
    const promise = this.#fetchWindow(query, Math.max(PAGE_SIZE, current.ids.length), controller.signal)
      .then((page) => {
        if (!controller.signal.aborted && query === this.#query && this.store.isReadTokenCurrent(token)) {
          this.store.replaceCollection(key, page.items, page.nextCursor);
        }
      })
      .catch((error: unknown) => {
        if (!isAbortError(error) && !controller.signal.aborted && query === this.#query &&
          this.store.isReadTokenCurrent(token)) {
          this.store.failCollection(key, getErrorMessage(error, "Search could not be loaded."), isOffline());
        }
      })
      .finally(() => {
        if (this.#request?.promise === promise) this.#request = null;
      });
    this.#request = { controller, promise };
    return promise;
  }

  loadMore(): Promise<void> {
    if (!this.#query) return Promise.resolve();
    const query = this.#query;
    const key = searchCollectionKey(query);
    const current = this.store.getCollection(key);
    if (!current.nextCursor) return Promise.resolve();
    if (this.#request) return this.#request.promise;
    const controller = new AbortController();
    const token = this.store.captureReadToken();
    this.store.beginCollection(key, "loading-more");
    const promise = this.api.getTasks({
      query,
      cursor: current.nextCursor,
      limit: PAGE_SIZE,
      signal: controller.signal,
    }).then((page) => {
      if (!controller.signal.aborted && query === this.#query && this.store.isReadTokenCurrent(token)) {
        this.store.appendCollection(key, page.items, page.nextCursor);
      }
    }).catch((error: unknown) => {
      if (!isAbortError(error) && !controller.signal.aborted && query === this.#query &&
        this.store.isReadTokenCurrent(token)) {
        this.store.failCollection(key, getErrorMessage(error, "More results could not be loaded."), isOffline());
      }
    }).finally(() => {
      if (this.#request?.promise === promise) this.#request = null;
    });
    this.#request = { controller, promise };
    return promise;
  }

  async setCompleted(taskId: string, completed: boolean): Promise<TaskRecord> {
    const key = searchCollectionKey(this.#query);
    const generation = this.store.captureUserGeneration();
    const transaction = this.store.beginCompletion(taskId, completed, key);
    try {
      const task = await this.api.setTaskCompleted(taskId, completed);
      if (this.store.isUserGenerationCurrent(generation)) {
        this.store.confirmCompletion(task, key);
        taskInvalidationBus.publish();
      }
      return task;
    } catch (error) {
      if (transaction && this.store.isUserGenerationCurrent(generation)) {
        this.store.rollbackCompletion(
          transaction,
          getErrorMessage(error, "The task was not changed."),
          isOffline(),
        );
      }
      throw error;
    }
  }

  async #fetchWindow(query: string, targetCount: number, signal: AbortSignal): Promise<TaskPage> {
    const items: TaskRecord[] = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    let nextCursor: string | null = null;
    do {
      const page = await this.api.getTasks({ query, cursor, limit: PAGE_SIZE, signal });
      items.push(...page.items);
      nextCursor = page.nextCursor;
      if (!nextCursor || items.length >= targetCount || seen.has(nextCursor)) break;
      seen.add(nextCursor);
      cursor = nextCursor;
    } while (items.length < targetCount);
    return { items, nextCursor };
  }
}

export const searchController = new SearchController(tasksStore);
