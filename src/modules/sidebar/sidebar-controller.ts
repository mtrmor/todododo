import { getErrorMessage, isAbortError } from "@/platform/api/api-error";
import { getTaskSummary } from "@/platform/api/tasks";
import { subscribeToActiveRefresh } from "@/platform/lifecycle/active-refresh";
import type { TaskInvalidationBus, TasksStore } from "@/shared-state/internal";

type SidebarApi = Readonly<{ getTaskSummary: typeof getTaskSummary }>;

function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export class SidebarController {
  #request: { controller: AbortController; promise: Promise<void> } | null = null;

  constructor(
    private readonly store: TasksStore,
    private readonly invalidationBus: TaskInvalidationBus,
    private readonly api: SidebarApi = { getTaskSummary },
    private readonly subscribeToRefresh = subscribeToActiveRefresh,
  ) {}

  connect(): () => void {
    void this.load("initial");
    const refresh = () => void this.load("refresh");
    const invalidate = () => {
      this.#request?.controller.abort();
      this.#request = null;
      void this.load("refresh");
    };
    const stopActive = this.subscribeToRefresh(refresh);
    const stopInvalidation = this.invalidationBus.subscribe(invalidate);
    return () => {
      stopActive();
      stopInvalidation();
      this.#request?.controller.abort();
      this.#request = null;
    };
  }

  load(mode: "initial" | "refresh" = "refresh"): Promise<void> {
    if (this.#request) {
      return this.#request.promise;
    }

    const controller = new AbortController();
    const status =
      mode === "initial" && this.store.getSummary().status === "idle" ? "loading" : "refreshing";
    this.store.beginSummary(status);
    const promise = this.api
      .getTaskSummary({ signal: controller.signal })
      .then((summary) => {
        if (!controller.signal.aborted) {
          const hasPendingCompletion = Object.values(this.store.getSnapshot().pendingById).includes(
            "complete",
          );

          if (hasPendingCompletion) {
            this.store.settleSummary();
          } else {
            this.store.setSummary(summary);
          }
        }
      })
      .catch((error: unknown) => {
        if (
          !isAbortError(error) &&
          !controller.signal.aborted
        ) {
          this.store.failSummary(
            getErrorMessage(error, "Task progress is unavailable."),
            isOffline(),
          );
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
}
