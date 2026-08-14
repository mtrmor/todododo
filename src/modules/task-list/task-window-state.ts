import type { TaskRecord } from "@/core";

export function reconcileTaskWindow(
  serverTasks: readonly TaskRecord[],
  currentTasks: readonly TaskRecord[],
  pendingIds: ReadonlySet<string>,
): TaskRecord[] {
  const currentById = new Map(currentTasks.map((task) => [task.id, task]));
  const serverIds = new Set(serverTasks.map((task) => task.id));
  const reconciled = serverTasks.map((task) =>
    pendingIds.has(task.id) ? currentById.get(task.id) ?? task : task,
  );

  for (const task of currentTasks) {
    if (pendingIds.has(task.id) && !serverIds.has(task.id)) {
      reconciled.push(task);
    }
  }

  return reconciled;
}

export function appendTaskPage(
  currentTasks: readonly TaskRecord[],
  pageTasks: readonly TaskRecord[],
  pendingIds: ReadonlySet<string>,
): TaskRecord[] {
  const next = [...currentTasks];
  const indexById = new Map(next.map((task, index) => [task.id, index]));

  for (const task of pageTasks) {
    const existingIndex = indexById.get(task.id);
    if (existingIndex === undefined) {
      indexById.set(task.id, next.length);
      next.push(task);
    } else if (!pendingIds.has(task.id)) {
      next[existingIndex] = task;
    }
  }

  return next;
}

export function replaceTaskRecord(
  currentTasks: readonly TaskRecord[],
  nextTask: TaskRecord,
): TaskRecord[] {
  return currentTasks.map((task) => (task.id === nextTask.id ? nextTask : task));
}
