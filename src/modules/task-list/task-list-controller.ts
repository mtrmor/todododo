import { getErrorMessage, isAbortError } from "@/core/api/api-error";
import { getTasks, setTaskCompleted } from "@/core/api/tasks";
import type { TaskPage, TaskRecord } from "@/domain/tasks";
import { subscribeToActiveRefresh } from "@/root/lifecycle/active-refresh";
import { INBOX_COLLECTION_KEY } from "@/shared-state";
import { taskInvalidationBus, tasksStore, type TasksStore } from "@/shared-state/internal";

const PAGE_SIZE = 50;

type TaskListApi = Readonly<{
  getTasks: typeof getTasks;
  setTaskCompleted: typeof setTaskCompleted;
}>;

function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export class TaskListController {
  #request: { controller: AbortController; promise: Promise<void> } | null = null;

  constructor(
    private readonly store: TasksStore,
    private readonly api: TaskListApi = { getTasks, setTaskCompleted },
    private readonly subscribeToRefresh = subscribeToActiveRefresh,
  ) {}

  connect(): () => void {
    void this.load("initial");
    const refresh = () => void this.load("refresh");
    const stopActive = this.subscribeToRefresh(refresh);
    const stopInvalidation = taskInvalidationBus.subscribe(refresh);
    return () => {
      stopActive();
      stopInvalidation();
      this.#request?.controller.abort();
      this.#request = null;
    };
  }

  load(mode: "initial" | "refresh" = "refresh"): Promise<void> {
    if (this.#request) return this.#request.promise;
    const current = this.store.getCollection(INBOX_COLLECTION_KEY);
    const controller = new AbortController();
    const token = this.store.captureReadToken();
    this.store.beginCollection(
      INBOX_COLLECTION_KEY,
      mode === "initial" && current.ids.length === 0 ? "loading" : "refreshing",
    );
    const promise = this.#fetchWindow(Math.max(PAGE_SIZE, current.ids.length), controller.signal)
      .then((page) => {
        if (!controller.signal.aborted && this.store.isReadTokenCurrent(token)) {
          this.store.replaceCollection(INBOX_COLLECTION_KEY, page.items, page.nextCursor);
        }
      })
      .catch((error: unknown) => {
        if (!isAbortError(error) && !controller.signal.aborted && this.store.isReadTokenCurrent(token)) {
          this.store.failCollection(
            INBOX_COLLECTION_KEY,
            getErrorMessage(error, "Tasks could not be loaded."),
            isOffline(),
          );
        }
      })
      .finally(() => {
        if (this.#request?.promise === promise) this.#request = null;
      });
    this.#request = { controller, promise };
    return promise;
  }

  loadMore(): Promise<void> {
    const current = this.store.getCollection(INBOX_COLLECTION_KEY);
    if (!current.nextCursor) return Promise.resolve();
    if (this.#request) return this.#request.promise;
    const controller = new AbortController();
    const token = this.store.captureReadToken();
    this.store.beginCollection(INBOX_COLLECTION_KEY, "loading-more");
    const promise = this.api.getTasks({
      cursor: current.nextCursor,
      limit: PAGE_SIZE,
      signal: controller.signal,
    }).then((page) => {
      if (!controller.signal.aborted && this.store.isReadTokenCurrent(token)) {
        this.store.appendCollection(INBOX_COLLECTION_KEY, page.items, page.nextCursor);
      }
    }).catch((error: unknown) => {
      if (!isAbortError(error) && !controller.signal.aborted && this.store.isReadTokenCurrent(token)) {
        this.store.failCollection(
          INBOX_COLLECTION_KEY,
          getErrorMessage(error, "More tasks could not be loaded."),
          isOffline(),
        );
      }
    }).finally(() => {
      if (this.#request?.promise === promise) this.#request = null;
    });
    this.#request = { controller, promise };
    return promise;
  }

  async setCompleted(taskId: string, completed: boolean): Promise<TaskRecord> {
    const generation = this.store.captureUserGeneration();
    const transaction = this.store.beginCompletion(taskId, completed, INBOX_COLLECTION_KEY);
    try {
      const task = await this.api.setTaskCompleted(taskId, completed);
      if (this.store.isUserGenerationCurrent(generation)) {
        this.store.confirmCompletion(task, INBOX_COLLECTION_KEY);
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

  async #fetchWindow(targetCount: number, signal: AbortSignal): Promise<TaskPage> {
    const items: TaskRecord[] = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    let nextCursor: string | null = null;
    do {
      const page = await this.api.getTasks({ cursor, limit: PAGE_SIZE, signal });
      items.push(...page.items);
      nextCursor = page.nextCursor;
      if (!nextCursor || items.length >= targetCount || seen.has(nextCursor)) break;
      seen.add(nextCursor);
      cursor = nextCursor;
    } while (items.length < targetCount);
    return { items, nextCursor };
  }
}

export const taskListController = new TaskListController(tasksStore);
