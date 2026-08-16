import type { TaskRecord } from "@/domain/tasks";
import { getTasks, setTaskCompleted } from "@/platform/api/tasks";
import { subscribeToActiveRefresh } from "@/platform/lifecycle/active-refresh";
import { TaskCollectionCoordinator } from "@/platform/task-collection-coordinator";
import type { CompletionTransaction, TaskInvalidationBus, TasksStore } from "@/shared-state/internal";

type TaskListApi = Readonly<{
  getTasks: typeof getTasks;
  setTaskCompleted: typeof setTaskCompleted;
}>;

export class TaskListController {
  readonly #coordinator: TaskCollectionCoordinator<CompletionTransaction>;

  constructor(
    store: TasksStore,
    invalidationBus: TaskInvalidationBus,
    api: TaskListApi = { getTasks, setTaskCompleted },
    subscribeToRefresh = subscribeToActiveRefresh,
  ) {
    this.#coordinator = new TaskCollectionCoordinator({
      api,
      messages: {
        load: "Tasks could not be loaded.",
        loadMore: "More tasks could not be loaded.",
        completion: "The task was not changed.",
      },
      port: {
        getCollection: () => store.getCollection("inbox"),
        begin: (status) => store.beginCollection("inbox", status),
        replace: (tasks, cursor) => store.replaceCollection("inbox", tasks, cursor),
        append: (tasks, cursor) => store.appendCollection("inbox", tasks, cursor),
        fail: (error, offline) => store.failCollection("inbox", error, offline),
        beginCompletion: (taskId, completed) =>
          store.beginCompletion(taskId, completed, "inbox"),
        confirmCompletion: (task) => store.confirmCompletion(task, "inbox"),
        rollbackCompletion: (transaction, error, offline) =>
          store.rollbackCompletion(transaction, error, offline),
      },
      subscribeToInvalidation: invalidationBus.subscribe,
      subscribeToRefresh,
      publishInvalidation: () => invalidationBus.publish(),
    });
  }

  connect(): () => void {
    return this.#coordinator.connect();
  }

  load(mode: "initial" | "refresh" = "refresh"): Promise<void> {
    return this.#coordinator.load(mode);
  }

  loadMore(): Promise<void> {
    return this.#coordinator.loadMore();
  }

  setCompleted(taskId: string, completed: boolean): Promise<TaskRecord> {
    return this.#coordinator.setCompleted(taskId, completed);
  }
}
