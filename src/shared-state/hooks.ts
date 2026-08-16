import { useMemo } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

import {
  normalizeSearchQuery,
  type TaskCollection,
  type TaskCollectionView,
  type TaskMutationKind,
  type TaskRecord,
  type TaskSummaryView,
  type TasksSnapshot,
} from "@/shared-state/model";
import { useTaskStore, useUiStore } from "@/shared-state/store-context";
import type { TaskDialog, UiSnapshot } from "@/shared-state/ui-store";

const EMPTY_COLLECTION: TaskCollection = {
  tasks: [],
  nextCursor: null,
  status: "idle",
  error: null,
  offline: false,
};

function selectTask(snapshot: TasksSnapshot, taskId: string): TaskRecord | null {
  return (
    (snapshot.detail?.id === taskId ? snapshot.detail : null) ??
    snapshot.inbox.tasks.find((task) => task.id === taskId) ??
    snapshot.search.tasks.find((task) => task.id === taskId) ??
    null
  );
}

function useTasksSelector<T>(
  selector: (snapshot: TasksSnapshot) => T,
  isEqual: (left: T, right: T) => boolean = Object.is,
): T {
  const tasksStore = useTaskStore();

  return useSyncExternalStoreWithSelector(
    tasksStore.subscribe,
    tasksStore.getSnapshot,
    tasksStore.getServerSnapshot,
    selector,
    isEqual,
  );
}

export function useTaskDialog(): TaskDialog {
  const uiStore = useUiStore();

  return useSyncExternalStoreWithSelector(
    uiStore.subscribe,
    uiStore.getSnapshot,
    uiStore.getServerSnapshot,
    (snapshot: UiSnapshot) => snapshot.taskDialog,
    Object.is,
  );
}

export function useTask(taskId: string | null): TaskRecord | null {
  return useTasksSelector((snapshot) => (taskId ? selectTask(snapshot, taskId) : null));
}

export function useInboxTasks(): TaskCollectionView {
  return useTasksSelector((snapshot) => snapshot.inbox);
}

export function useSearchTasks(query: string): TaskCollectionView {
  const normalized = normalizeSearchQuery(query);
  return useTasksSelector((snapshot) =>
    snapshot.search.query === normalized ? snapshot.search : EMPTY_COLLECTION,
  );
}

export function useTaskSummary(): TaskSummaryView {
  return useTasksSelector((snapshot) => snapshot.summary);
}

export function useTaskMutation(taskId: string): TaskMutationKind | null {
  return useTasksSelector((snapshot) => snapshot.pendingById[taskId] ?? null);
}

export function useTaskDialogActions() {
  const uiStore = useUiStore();

  return useMemo(
    () => ({
      openCreateTask: () => uiStore.openCreateTask(),
      openTask: (taskId: string) => uiStore.openTask(taskId),
      closeTask: () => uiStore.closeTask(),
    }),
    [uiStore],
  );
}
