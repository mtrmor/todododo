import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

import {
  INBOX_COLLECTION_KEY,
  searchCollectionKey,
  type TaskCollection,
  type TaskCollectionView,
  type TaskMutationKind,
  type TaskRecord,
  type TaskSummaryView,
  type TasksSnapshot,
} from "@/shared-state/model";
import { tasksStore } from "@/shared-state/tasks-store";
import { uiStore, type TaskDialog, type UiSnapshot } from "@/shared-state/ui-store";

const EMPTY_IDS: readonly string[] = Object.freeze([]);
const EMPTY_COLLECTION: TaskCollection = Object.freeze({
  ids: EMPTY_IDS,
  nextCursor: null,
  status: "idle",
  error: null,
  offline: false,
});

function selectCollection(snapshot: TasksSnapshot, key: string): TaskCollectionView {
  const collection = snapshot.collections[key] ?? EMPTY_COLLECTION;
  return {
    tasks: collection.ids.flatMap((id) => snapshot.byId[id] ? [snapshot.byId[id]] : []),
    nextCursor: collection.nextCursor,
    status: collection.status,
    error: collection.error,
    offline: collection.offline,
  };
}

function equalTaskCollectionView(
  left: TaskCollectionView,
  right: TaskCollectionView,
): boolean {
  return left.nextCursor === right.nextCursor &&
    left.status === right.status &&
    left.error === right.error &&
    left.offline === right.offline &&
    left.tasks.length === right.tasks.length &&
    left.tasks.every((task, index) => task === right.tasks[index]);
}

function useTasksSelector<T>(
  selector: (snapshot: TasksSnapshot) => T,
  isEqual: (left: T, right: T) => boolean = Object.is,
): T {
  return useSyncExternalStoreWithSelector(
    tasksStore.subscribe,
    tasksStore.getSnapshot,
    tasksStore.getServerSnapshot,
    selector,
    isEqual,
  );
}

export function useTaskDialog(): TaskDialog {
  return useSyncExternalStoreWithSelector(
    uiStore.subscribe,
    uiStore.getSnapshot,
    uiStore.getServerSnapshot,
    (snapshot: UiSnapshot) => snapshot.taskDialog,
    Object.is,
  );
}

export function useTask(taskId: string | null): TaskRecord | null {
  return useTasksSelector(
    (snapshot) => taskId ? snapshot.byId[taskId] ?? null : null,
  );
}

export function useInboxTasks(): TaskCollectionView {
  return useTasksSelector(
    (snapshot) => selectCollection(snapshot, INBOX_COLLECTION_KEY),
    equalTaskCollectionView,
  );
}

export function useSearchTasks(query: string): TaskCollectionView {
  const key = searchCollectionKey(query);
  return useTasksSelector(
    (snapshot) => selectCollection(snapshot, key),
    equalTaskCollectionView,
  );
}

export function useTaskSummary(): TaskSummaryView {
  return useTasksSelector((snapshot) => snapshot.summary);
}

export function useTaskMutation(taskId: string): TaskMutationKind | null {
  return useTasksSelector((snapshot) => snapshot.pendingById[taskId] ?? null);
}

export function openCreateTask(): void {
  uiStore.openCreateTask();
}

export function openTask(taskId: string): void {
  uiStore.openTask(taskId);
}

export function closeTask(): void {
  uiStore.closeTask();
}
