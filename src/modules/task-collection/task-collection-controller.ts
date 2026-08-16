import type { TaskRecord } from "@/domain/tasks";
import { getTasks, setTaskCompleted } from "@/platform/api/tasks";
import { subscribeToActiveRefresh } from "@/platform/lifecycle/active-refresh";
import {
  TaskCollectionCoordinator,
  type TaskCollectionApi,
  type TaskCollectionMessages,
  type TaskCollectionPort,
} from "@/platform/task-collection-coordinator";
import { normalizeSearchQuery } from "@/shared-state";
import type { CompletionTransaction, TaskInvalidationBus, TasksStore } from "@/shared-state/internal";

type CollectionName = "inbox" | "search";

export type TaskCollectionConfig = Readonly<{
  collection: CollectionName;
  searchable?: boolean;
  messages: TaskCollectionMessages;
}>;

type CreateTaskCollectionCoordinatorOptions = TaskCollectionConfig &
  Readonly<{
    api: TaskCollectionApi;
    subscribeToRefresh?: (listener: () => void) => () => void;
  }>;

export function createTaskCollectionCoordinator(
  store: TasksStore,
  invalidationBus: TaskInvalidationBus,
  options: CreateTaskCollectionCoordinatorOptions,
): TaskCollectionCoordinator<CompletionTransaction> {
  const { collection, searchable = false } = options;
  const port: TaskCollectionPort<CompletionTransaction> = {
    getCollection: () => store.getCollection(collection),
    ...(searchable ? { activateQuery: (query: string) => store.activateSearch(query) } : {}),
    begin: (status) => store.beginCollection(collection, status),
    replace: (tasks, cursor) => store.replaceCollection(collection, tasks, cursor),
    append: (tasks, cursor) => store.appendCollection(collection, tasks, cursor),
    fail: (error, offline) => store.failCollection(collection, error, offline),
    beginCompletion: (taskId, completed) => store.beginCompletion(taskId, completed, collection),
    confirmCompletion: (task) => store.confirmCompletion(task, collection),
    rollbackCompletion: (transaction, error, offline) =>
      store.rollbackCompletion(transaction, error, offline),
  };

  return new TaskCollectionCoordinator({
    api: options.api,
    messages: options.messages,
    searchable,
    port,
    subscribeToInvalidation: invalidationBus.subscribe,
    subscribeToRefresh: options.subscribeToRefresh,
    publishInvalidation: () => invalidationBus.publish(),
  });
}

export class TaskCollectionController {
  readonly #coordinator: TaskCollectionCoordinator<CompletionTransaction>;

  constructor(
    store: TasksStore,
    invalidationBus: TaskInvalidationBus,
    config: TaskCollectionConfig,
    api: TaskCollectionApi = { getTasks, setTaskCompleted },
    subscribeToRefresh = subscribeToActiveRefresh,
  ) {
    this.#coordinator = createTaskCollectionCoordinator(store, invalidationBus, {
      ...config,
      api,
      subscribeToRefresh,
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
