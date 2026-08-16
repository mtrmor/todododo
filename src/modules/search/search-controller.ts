import type { TaskRecord } from "@/domain/tasks";
import { getTasks, setTaskCompleted } from "@/platform/api/tasks";
import { subscribeToActiveRefresh } from "@/platform/lifecycle/active-refresh";
import { TaskCollectionCoordinator } from "@/platform/task-collection-coordinator";
import { normalizeSearchQuery } from "@/shared-state";
import type { CompletionTransaction, TaskInvalidationBus, TasksStore } from "@/shared-state/internal";

type SearchApi = Readonly<{
  getTasks: typeof getTasks;
  setTaskCompleted: typeof setTaskCompleted;
}>;

export class SearchController {
  readonly #coordinator: TaskCollectionCoordinator<CompletionTransaction>;

  constructor(
    store: TasksStore,
    invalidationBus: TaskInvalidationBus,
    api: SearchApi = { getTasks, setTaskCompleted },
    subscribeToRefresh = subscribeToActiveRefresh,
  ) {
    this.#coordinator = new TaskCollectionCoordinator({
      api,
      searchable: true,
      messages: {
        load: "Search could not be loaded.",
        loadMore: "More results could not be loaded.",
        completion: "The task was not changed.",
      },
      port: {
        getCollection: () => store.getCollection("search"),
        activateQuery: (query) => store.activateSearch(query),
        begin: (status) => store.beginCollection("search", status),
        replace: (tasks, cursor) => store.replaceCollection("search", tasks, cursor),
        append: (tasks, cursor) => store.appendCollection("search", tasks, cursor),
        fail: (error, offline) => store.failCollection("search", error, offline),
        beginCompletion: (taskId, completed) =>
          store.beginCompletion(taskId, completed, "search"),
        confirmCompletion: (task) => store.confirmCompletion(task, "search"),
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

  setQuery(query: string): void {
    this.#coordinator.setQuery(normalizeSearchQuery(query));
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
