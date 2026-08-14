export type TaskDialog =
  | null
  | Readonly<{ mode: "create" }>
  | Readonly<{ mode: "edit"; taskId: string }>;

export type SharedSnapshot = Readonly<{
  taskDialog: TaskDialog;
  tasksRevision: number;
}>;

type Listener = () => void;

const SERVER_SNAPSHOT: SharedSnapshot = Object.freeze({ taskDialog: null, tasksRevision: 0 });
let snapshot: SharedSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<Listener>();

function publish(taskDialog: TaskDialog, tasksRevision: number): void {
  snapshot = Object.freeze({
    taskDialog: taskDialog ? Object.freeze(taskDialog) : null,
    tasksRevision,
  });

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLocal(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): SharedSnapshot {
  return snapshot;
}

export function getServerSnapshot(): SharedSnapshot {
  return SERVER_SNAPSHOT;
}

export function openCreateTask(): void {
  if (snapshot.taskDialog?.mode !== "create") {
    publish({ mode: "create" }, snapshot.tasksRevision);
  }
}

export function openTask(taskId: string): void {
  const normalizedTaskId = taskId.trim();
  if (!normalizedTaskId) {
    return;
  }

  if (snapshot.taskDialog?.mode === "edit" && snapshot.taskDialog.taskId === normalizedTaskId) {
    return;
  }

  publish({ mode: "edit", taskId: normalizedTaskId }, snapshot.tasksRevision);
}

export function closeTask(): void {
  if (snapshot.taskDialog !== null) {
    publish(null, snapshot.tasksRevision);
  }
}

export function markTasksChangedLocal(): void {
  const nextRevision = snapshot.tasksRevision === Number.MAX_SAFE_INTEGER ? 0 : snapshot.tasksRevision + 1;
  publish(snapshot.taskDialog, nextRevision);
}

export function resetSharedStateForTests(): void {
  snapshot = SERVER_SNAPSHOT;
  listeners.clear();
}
