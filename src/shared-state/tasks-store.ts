import { ExternalStore } from "@/shared-state/external-store";
import {
  normalizeSearchQuery,
  type TaskCollection,
  type TaskCollectionKind,
  type TaskCollectionStatus,
  type TaskMutationKind,
  type TaskRecord,
  type TaskSummary,
  type TaskSummaryState,
  type TasksSnapshot,
} from "@/shared-state/model";

const EMPTY_SUMMARY: TaskSummary = { open: 0, total: 0, completed: 0 };

function emptyCollection(status: TaskCollectionStatus = "idle"): TaskCollection {
  return { tasks: [], nextCursor: null, status, error: null, offline: false };
}

const SERVER_TASKS_SNAPSHOT: TasksSnapshot = {
  inbox: emptyCollection(),
  search: { ...emptyCollection(), query: "" },
  detail: null,
  summary: { data: EMPTY_SUMMARY, status: "idle", error: null, offline: false },
  pendingById: {},
};

export type CompletionTransaction = Readonly<{
  task: TaskRecord;
  summary: TaskSummaryState;
  source: TaskCollectionKind;
}>;

function taskEquals(left: TaskRecord, right: TaskRecord): boolean {
  return (
    left.id === right.id &&
    left.title === right.title &&
    left.notes === right.notes &&
    left.dueDate === right.dueDate &&
    left.completed === right.completed &&
    left.createdAt === right.createdAt &&
    left.updatedAt === right.updatedAt &&
    left.completedAt === right.completedAt
  );
}

function sameTasks(left: readonly TaskRecord[], right: readonly TaskRecord[]): boolean {
  return left.length === right.length && left.every((task, index) => task === right[index]);
}

function replaceTask(tasks: TaskRecord[], incoming: TaskRecord): void {
  const index = tasks.findIndex((task) => task.id === incoming.id);

  if (index >= 0 && !taskEquals(tasks[index], incoming)) {
    tasks[index] = incoming;
  }
}

export class TasksStore extends ExternalStore<TasksSnapshot> {
  constructor() {
    super(SERVER_TASKS_SNAPSHOT);
  }

  getTask(taskId: string): TaskRecord | null {
    const snapshot = this.getSnapshot();
    return (
      (snapshot.detail?.id === taskId ? snapshot.detail : null) ??
      snapshot.inbox.tasks.find((task) => task.id === taskId) ??
      snapshot.search.tasks.find((task) => task.id === taskId) ??
      null
    );
  }

  getCollection(kind: TaskCollectionKind): TaskCollection {
    return this.getSnapshot()[kind];
  }

  getSummary(): TaskSummaryState {
    return this.getSnapshot().summary;
  }

  activateSearch(query: string): void {
    const normalized = normalizeSearchQuery(query);

    if (this.getSnapshot().search.query === normalized) {
      return;
    }

    this.update((draft) => {
      draft.search.tasks = [];
      draft.search.nextCursor = null;
      draft.search.status = "idle";
      draft.search.error = null;
      draft.search.offline = false;
      draft.search.query = normalized;
    });
  }

  beginCollection(
    kind: TaskCollectionKind,
    status: "loading" | "refreshing" | "loading-more",
  ): void {
    const current = this.getCollection(kind);

    if (current.status === status && current.error === null && !current.offline) {
      return;
    }

    this.update((draft) => {
      draft[kind].status = status;
      draft[kind].error = null;
      draft[kind].offline = false;
    });
  }

  replaceCollection(
    kind: TaskCollectionKind,
    tasks: readonly TaskRecord[],
    nextCursor: string | null,
  ): void {
    const snapshot = this.getSnapshot();
    const current = snapshot[kind];
    const reconciled = tasks.map((incoming) => {
      const existing = this.getTask(incoming.id);
      return existing && (snapshot.pendingById[incoming.id] || taskEquals(existing, incoming))
        ? existing
        : incoming;
    });

    if (
      sameTasks(current.tasks, reconciled) &&
      current.nextCursor === nextCursor &&
      current.status === "ready" &&
      current.error === null &&
      !current.offline
    ) {
      return;
    }

    this.update((draft) => {
      draft[kind].tasks = reconciled;
      draft[kind].nextCursor = nextCursor;
      draft[kind].status = "ready";
      draft[kind].error = null;
      draft[kind].offline = false;

      for (const task of reconciled) {
        if (snapshot.pendingById[task.id]) {
          continue;
        }

        if (kind !== "inbox") {
          replaceTask(draft.inbox.tasks, task);
        }

        if (kind !== "search") {
          replaceTask(draft.search.tasks, task);
        }

        if (draft.detail?.id === task.id && !taskEquals(draft.detail, task)) {
          draft.detail = task;
        }
      }
    });
  }

  appendCollection(
    kind: TaskCollectionKind,
    tasks: readonly TaskRecord[],
    nextCursor: string | null,
  ): void {
    const snapshot = this.getSnapshot();
    const current = snapshot[kind];
    const nextTasks = [...current.tasks];

    for (const incoming of tasks) {
      const index = nextTasks.findIndex((task) => task.id === incoming.id);
      const existing = this.getTask(incoming.id);
      const task =
        existing && (snapshot.pendingById[incoming.id] || taskEquals(existing, incoming))
          ? existing
          : incoming;

      if (index < 0) {
        nextTasks.push(task);
      } else if (nextTasks[index] !== task) {
        nextTasks[index] = task;
      }
    }

    if (
      sameTasks(current.tasks, nextTasks) &&
      current.nextCursor === nextCursor &&
      current.status === "ready" &&
      current.error === null &&
      !current.offline
    ) {
      return;
    }

    this.replaceCollection(kind, nextTasks, nextCursor);
  }

  failCollection(kind: TaskCollectionKind, error: string, offline: boolean): void {
    this.update((draft) => {
      draft[kind].status = "error";
      draft[kind].error = error;
      draft[kind].offline = offline;
    });
  }

  clearCollectionError(kind: TaskCollectionKind): void {
    const current = this.getCollection(kind);

    if (current.error === null && !current.offline) {
      return;
    }

    this.update((draft) => {
      draft[kind].status = "ready";
      draft[kind].error = null;
      draft[kind].offline = false;
    });
  }

  settleCollection(kind: TaskCollectionKind): void {
    const current = this.getCollection(kind);

    if (current.status === "ready" && current.error === null && !current.offline) {
      return;
    }

    this.update((draft) => {
      draft[kind].status = "ready";
      draft[kind].error = null;
      draft[kind].offline = false;
    });
  }

  setDetail(task: TaskRecord | null): void {
    const current = this.getSnapshot().detail;

    if (current === task || (current && task && taskEquals(current, task))) {
      return;
    }

    this.update((draft) => {
      draft.detail = task;
    });
  }

  upsertTask(task: TaskRecord): void {
    this.update((draft) => {
      replaceTask(draft.inbox.tasks, task);
      replaceTask(draft.search.tasks, task);

      if (draft.detail?.id === task.id) {
        draft.detail = task;
      }
    });
  }

  prependToInbox(task: TaskRecord): void {
    this.update((draft) => {
      draft.inbox.tasks = [task, ...draft.inbox.tasks.filter((current) => current.id !== task.id)];
      replaceTask(draft.search.tasks, task);

      if (draft.detail?.id === task.id) {
        draft.detail = task;
      }
    });
  }

  patchTask(taskId: string, patch: Partial<TaskRecord>): TaskRecord | null {
    const current = this.getTask(taskId);

    if (!current) {
      return null;
    }

    this.update((draft) => {
      for (const collection of [draft.inbox, draft.search]) {
        const task = collection.tasks.find((candidate) => candidate.id === taskId);

        if (task) {
          Object.assign(task, patch, { id: taskId });
        }
      }

      if (draft.detail?.id === taskId) {
        Object.assign(draft.detail, patch, { id: taskId });
      }
    });
    return current;
  }

  removeTask(taskId: string): TaskRecord | null {
    const current = this.getTask(taskId);

    if (!current) {
      return null;
    }

    this.update((draft) => {
      draft.inbox.tasks = draft.inbox.tasks.filter((task) => task.id !== taskId);
      draft.search.tasks = draft.search.tasks.filter((task) => task.id !== taskId);

      if (draft.detail?.id === taskId) {
        draft.detail = null;
      }

      delete draft.pendingById[taskId];
    });
    return current;
  }

  setPending(taskId: string, kind: TaskMutationKind | null): void {
    const pendingById = this.getSnapshot().pendingById;

    if (pendingById[taskId] === kind && kind !== null) {
      return;
    }

    if (kind === null && !Object.prototype.hasOwnProperty.call(pendingById, taskId)) {
      return;
    }

    this.update((draft) => {
      if (kind === null) {
        delete draft.pendingById[taskId];
      } else {
        draft.pendingById[taskId] = kind;
      }
    });
  }

  beginCompletion(
    taskId: string,
    completed: boolean,
    source: TaskCollectionKind,
  ): CompletionTransaction | null {
    const task = this.getTask(taskId);

    if (!task || this.getSnapshot().pendingById[taskId]) {
      return null;
    }

    const summary = this.getSummary();
    const now = new Date().toISOString();
    this.setPending(taskId, "complete");
    this.patchTask(taskId, {
      completed,
      completedAt: completed ? now : null,
      updatedAt: now,
    });

    if (summary.status !== "idle" && task.completed !== completed) {
      this.setSummary({
        total: summary.data.total,
        open: Math.max(0, summary.data.open + (completed ? -1 : 1)),
        completed: Math.max(0, summary.data.completed + (completed ? 1 : -1)),
      });
    }

    return { task, summary, source };
  }

  confirmCompletion(task: TaskRecord, source: TaskCollectionKind): void {
    this.upsertTask(task);
    this.clearCollectionError(source);
    this.setPending(task.id, null);
  }

  rollbackCompletion(transaction: CompletionTransaction, error: string, offline: boolean): void {
    this.upsertTask(transaction.task);

    if (transaction.summary.status !== "idle") {
      this.setSummary(transaction.summary.data);
    }

    this.failCollection(transaction.source, error, offline);
    this.setPending(transaction.task.id, null);
  }

  beginSummary(status: "loading" | "refreshing"): void {
    const current = this.getSummary();

    if (current.status === status && current.error === null && !current.offline) {
      return;
    }

    this.update((draft) => {
      draft.summary.status = status;
      draft.summary.error = null;
      draft.summary.offline = false;
    });
  }

  setSummary(data: TaskSummary): void {
    const current = this.getSummary();

    if (
      current.status === "ready" &&
      current.error === null &&
      !current.offline &&
      current.data.open === data.open &&
      current.data.total === data.total &&
      current.data.completed === data.completed
    ) {
      return;
    }

    this.update((draft) => {
      draft.summary.data = data;
      draft.summary.status = "ready";
      draft.summary.error = null;
      draft.summary.offline = false;
    });
  }

  failSummary(error: string, offline: boolean): void {
    this.update((draft) => {
      draft.summary.status = "error";
      draft.summary.error = error;
      draft.summary.offline = offline;
    });
  }

  settleSummary(): void {
    const current = this.getSummary();

    if (
      current.status === "idle" ||
      (current.status === "ready" && current.error === null && !current.offline)
    ) {
      return;
    }

    this.update((draft) => {
      draft.summary.status = "ready";
      draft.summary.error = null;
      draft.summary.offline = false;
    });
  }

  clear(): void {
    this.resetSnapshot();
  }

  resetForTests(): void {
    this.clear();
    this.clearListenersForTests();
  }
}
