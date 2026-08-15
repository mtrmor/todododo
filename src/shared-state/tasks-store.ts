import { ExternalStore } from "@/shared-state/external-store";
import {
  INBOX_COLLECTION_KEY,
  type TaskCollection,
  type TaskCollectionStatus,
  type TaskMutationKind,
  type TaskRecord,
  type TaskSummary,
  type TaskSummaryState,
  type TasksSnapshot,
} from "@/shared-state/model";

const EMPTY_IDS: readonly string[] = Object.freeze([]);
const EMPTY_RECORD: Readonly<Record<string, never>> = Object.freeze({});
const EMPTY_SUMMARY: TaskSummary = Object.freeze({ open: 0, total: 0, completed: 0 });
const EMPTY_SUMMARY_STATE: TaskSummaryState = Object.freeze({
  data: EMPTY_SUMMARY,
  status: "idle",
  error: null,
  offline: false,
});
const SERVER_TASKS_SNAPSHOT: TasksSnapshot = Object.freeze({
  byId: EMPTY_RECORD,
  collections: EMPTY_RECORD,
  summary: EMPTY_SUMMARY_STATE,
  pendingById: EMPTY_RECORD,
});

export type TasksReadToken = Readonly<{
  userGeneration: number;
  readGeneration: number;
}>;

export type CompletionTransaction = Readonly<{
  task: TaskRecord;
  summary: TaskSummaryState;
  sourceCollectionKey: string;
}>;

function emptyCollection(status: TaskCollectionStatus = "idle"): TaskCollection {
  return Object.freeze({
    ids: EMPTY_IDS,
    nextCursor: null,
    status,
    error: null,
    offline: false,
  });
}

function freezeTask(task: TaskRecord): TaskRecord {
  return Object.isFrozen(task) ? task : Object.freeze({ ...task });
}

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

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function mergeEntities(
  current: Readonly<Record<string, TaskRecord>>,
  tasks: readonly TaskRecord[],
  pendingById?: Readonly<Record<string, TaskMutationKind>>,
): Readonly<Record<string, TaskRecord>> {
  let next: Record<string, TaskRecord> | null = null;

  for (const incoming of tasks) {
    const existing = current[incoming.id];

    if (existing && pendingById?.[incoming.id]) {
      continue;
    }

    if (existing && taskEquals(existing, incoming)) {
      continue;
    }

    next ??= { ...current };
    next[incoming.id] = freezeTask(incoming);
  }

  return next ? Object.freeze(next) : current;
}

export class TasksStore extends ExternalStore<TasksSnapshot> {
  #activeSearchKey: string | null = null;
  #boundUserId: string | null = null;
  #userGeneration = 0;
  #readGeneration = 0;

  constructor() {
    super(SERVER_TASKS_SNAPSHOT);
  }

  getTask(taskId: string): TaskRecord | null {
    return this.getSnapshot().byId[taskId] ?? null;
  }

  getCollection(key: string): TaskCollection {
    return this.getSnapshot().collections[key] ?? emptyCollection();
  }

  getSummary(): TaskSummaryState {
    return this.getSnapshot().summary;
  }

  getActiveSearchKey(): string | null {
    return this.#activeSearchKey;
  }

  bindUser(userId: string | null): void {
    if (this.#boundUserId === userId) {
      return;
    }

    this.#boundUserId = userId;
    this.#userGeneration += 1;
    this.#readGeneration += 1;
    this.clear();
  }

  releaseUser(userId: string): void {
    if (this.#boundUserId === userId) {
      this.bindUser(null);
    }
  }

  captureReadToken(): TasksReadToken {
    return Object.freeze({
      userGeneration: this.#userGeneration,
      readGeneration: this.#readGeneration,
    });
  }

  isReadTokenCurrent(token: TasksReadToken): boolean {
    return (
      token.userGeneration === this.#userGeneration && token.readGeneration === this.#readGeneration
    );
  }

  captureUserGeneration(): number {
    return this.#userGeneration;
  }

  isUserGenerationCurrent(generation: number): boolean {
    return generation === this.#userGeneration;
  }

  invalidateReads(): void {
    this.#readGeneration += 1;
    const snapshot = this.getSnapshot();
    let collectionsChanged = false;
    const collections = Object.fromEntries(
      Object.entries(snapshot.collections).map(([key, collection]) => {
        if (
          collection.status === "idle" ||
          (collection.status === "ready" && collection.error === null && !collection.offline)
        ) {
          return [key, collection];
        }

        collectionsChanged = true;
        return [
          key,
          Object.freeze({
            ...collection,
            status: "ready" as const,
            error: null,
            offline: false,
          }),
        ];
      }),
    );
    const summaryChanged =
      snapshot.summary.status !== "idle" &&
      (snapshot.summary.status !== "ready" ||
        snapshot.summary.error !== null ||
        snapshot.summary.offline);

    if (!collectionsChanged && !summaryChanged) {
      return;
    }

    this.publish(
      Object.freeze({
        ...snapshot,
        collections: collectionsChanged ? Object.freeze(collections) : snapshot.collections,
        summary: summaryChanged
          ? Object.freeze({
              ...snapshot.summary,
              status: "ready" as const,
              error: null,
              offline: false,
            })
          : snapshot.summary,
      }),
    );
  }

  beginCompletion(
    taskId: string,
    completed: boolean,
    sourceCollectionKey: string,
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

    return Object.freeze({ task, summary, sourceCollectionKey });
  }

  confirmCompletion(task: TaskRecord, sourceCollectionKey: string): void {
    this.invalidateReads();
    this.upsertTask(task);
    this.clearCollectionError(sourceCollectionKey);
    this.setPending(task.id, null);
  }

  rollbackCompletion(transaction: CompletionTransaction, error: string, offline: boolean): void {
    this.upsertTask(transaction.task);

    if (transaction.summary.status !== "idle") {
      this.setSummary(transaction.summary.data);
    }

    this.failCollection(transaction.sourceCollectionKey, error, offline);
    this.setPending(transaction.task.id, null);
  }

  activateSearch(key: string): void {
    if (this.#activeSearchKey === key) {
      return;
    }

    this.#activeSearchKey = key;
    const snapshot = this.getSnapshot();
    const collections = Object.fromEntries(
      Object.entries(snapshot.collections).filter(
        ([collectionKey]) => collectionKey === INBOX_COLLECTION_KEY || collectionKey === key,
      ),
    );

    if (Object.keys(collections).length !== Object.keys(snapshot.collections).length) {
      this.publish(Object.freeze({ ...snapshot, collections: Object.freeze(collections) }));
    }
  }

  beginCollection(key: string, status: "loading" | "refreshing" | "loading-more"): void {
    const snapshot = this.getSnapshot();
    const current = snapshot.collections[key] ?? emptyCollection();

    if (current.status === status && current.error === null && !current.offline) {
      return;
    }

    const nextCollection: TaskCollection = Object.freeze({
      ...current,
      status,
      error: null,
      offline: false,
    });
    this.publish(
      Object.freeze({
        ...snapshot,
        collections: Object.freeze({ ...snapshot.collections, [key]: nextCollection }),
      }),
    );
  }

  replaceCollection(key: string, tasks: readonly TaskRecord[], nextCursor: string | null): void {
    const snapshot = this.getSnapshot();
    const byId = mergeEntities(snapshot.byId, tasks, snapshot.pendingById);
    const ids = Object.freeze(tasks.map((task) => task.id));
    const current = snapshot.collections[key];
    const nextCollection: TaskCollection = Object.freeze({
      ids: current && sameIds(current.ids, ids) ? current.ids : ids,
      nextCursor,
      status: "ready",
      error: null,
      offline: false,
    });

    if (
      current &&
      byId === snapshot.byId &&
      current.ids === nextCollection.ids &&
      current.nextCursor === nextCursor &&
      current.status === "ready" &&
      current.error === null &&
      !current.offline
    ) {
      return;
    }

    this.publish(
      Object.freeze({
        ...snapshot,
        byId,
        collections: Object.freeze({ ...snapshot.collections, [key]: nextCollection }),
      }),
    );
  }

  appendCollection(key: string, tasks: readonly TaskRecord[], nextCursor: string | null): void {
    const snapshot = this.getSnapshot();
    const current = snapshot.collections[key] ?? emptyCollection();
    const byId = mergeEntities(snapshot.byId, tasks, snapshot.pendingById);
    const ids = [...current.ids];
    const seen = new Set(ids);
    for (const task of tasks) {
      if (!seen.has(task.id)) {
        seen.add(task.id);
        ids.push(task.id);
      }
    }

    const nextIds = sameIds(current.ids, ids) ? current.ids : Object.freeze(ids);
    const nextCollection: TaskCollection = Object.freeze({
      ids: nextIds,
      nextCursor,
      status: "ready",
      error: null,
      offline: false,
    });

    if (
      byId === snapshot.byId &&
      nextIds === current.ids &&
      current.nextCursor === nextCursor &&
      current.status === "ready" &&
      current.error === null &&
      !current.offline
    ) {
      return;
    }

    this.publish(
      Object.freeze({
        ...snapshot,
        byId,
        collections: Object.freeze({ ...snapshot.collections, [key]: nextCollection }),
      }),
    );
  }

  failCollection(key: string, error: string, offline: boolean): void {
    const snapshot = this.getSnapshot();
    const current = snapshot.collections[key] ?? emptyCollection();
    const nextCollection: TaskCollection = Object.freeze({
      ...current,
      status: "error",
      error,
      offline,
    });
    this.publish(
      Object.freeze({
        ...snapshot,
        collections: Object.freeze({ ...snapshot.collections, [key]: nextCollection }),
      }),
    );
  }

  clearCollectionError(key: string): void {
    const snapshot = this.getSnapshot();
    const current = snapshot.collections[key];

    if (!current || (current.error === null && !current.offline)) {
      return;
    }

    const nextCollection: TaskCollection = Object.freeze({
      ...current,
      status: "ready",
      error: null,
      offline: false,
    });
    this.publish(
      Object.freeze({
        ...snapshot,
        collections: Object.freeze({ ...snapshot.collections, [key]: nextCollection }),
      }),
    );
  }

  settleCollection(key: string): void {
    const snapshot = this.getSnapshot();
    const current = snapshot.collections[key];

    if (!current || (current.status === "ready" && current.error === null && !current.offline)) {
      return;
    }

    const nextCollection: TaskCollection = Object.freeze({
      ...current,
      status: "ready",
      error: null,
      offline: false,
    });
    this.publish(
      Object.freeze({
        ...snapshot,
        collections: Object.freeze({ ...snapshot.collections, [key]: nextCollection }),
      }),
    );
  }

  upsertTask(task: TaskRecord): void {
    const snapshot = this.getSnapshot();
    const byId = mergeEntities(snapshot.byId, [task]);

    if (byId !== snapshot.byId) {
      this.publish(Object.freeze({ ...snapshot, byId }));
    }
  }

  prependToCollection(key: string, task: TaskRecord): void {
    const snapshot = this.getSnapshot();
    const current = snapshot.collections[key];
    const byId = mergeEntities(snapshot.byId, [task]);

    if (!current) {
      if (byId !== snapshot.byId) {
        this.publish(Object.freeze({ ...snapshot, byId }));
      }

      return;
    }

    const ids = Object.freeze([task.id, ...current.ids.filter((id) => id !== task.id)]);
    this.publish(
      Object.freeze({
        ...snapshot,
        byId,
        collections: Object.freeze({
          ...snapshot.collections,
          [key]: Object.freeze({ ...current, ids }),
        }),
      }),
    );
  }

  patchTask(taskId: string, patch: Partial<TaskRecord>): TaskRecord | null {
    const snapshot = this.getSnapshot();
    const current = snapshot.byId[taskId];

    if (!current) {
      return null;
    }

    const next = freezeTask({ ...current, ...patch, id: current.id });

    if (taskEquals(current, next)) {
      return current;
    }

    this.publish(
      Object.freeze({
        ...snapshot,
        byId: Object.freeze({ ...snapshot.byId, [taskId]: next }),
      }),
    );
    return current;
  }

  removeTask(taskId: string): TaskRecord | null {
    const snapshot = this.getSnapshot();
    const current = snapshot.byId[taskId];

    if (!current) {
      return null;
    }

    const byId = { ...snapshot.byId };
    delete byId[taskId];
    const collections = Object.fromEntries(
      Object.entries(snapshot.collections).map(([key, collection]) => [
        key,
        collection.ids.includes(taskId)
          ? Object.freeze({
              ...collection,
              ids: Object.freeze(collection.ids.filter((id) => id !== taskId)),
            })
          : collection,
      ]),
    );
    const pendingById = { ...snapshot.pendingById };
    delete pendingById[taskId];

    this.publish(
      Object.freeze({
        ...snapshot,
        byId: Object.freeze(byId),
        collections: Object.freeze(collections),
        pendingById: Object.freeze(pendingById),
      }),
    );
    return current;
  }

  setPending(taskId: string, kind: TaskMutationKind | null): void {
    const snapshot = this.getSnapshot();

    if (kind === null && !(taskId in snapshot.pendingById)) {
      return;
    }

    if (kind !== null && snapshot.pendingById[taskId] === kind) {
      return;
    }

    const pendingById = { ...snapshot.pendingById };

    if (kind === null) {
      delete pendingById[taskId];
    } else {
      pendingById[taskId] = kind;
    }

    this.publish(Object.freeze({ ...snapshot, pendingById: Object.freeze(pendingById) }));
  }

  beginSummary(status: "loading" | "refreshing"): void {
    const snapshot = this.getSnapshot();

    if (
      snapshot.summary.status === status &&
      snapshot.summary.error === null &&
      !snapshot.summary.offline
    ) {
      return;
    }

    const summary: TaskSummaryState = Object.freeze({
      ...snapshot.summary,
      status,
      error: null,
      offline: false,
    });
    this.publish(Object.freeze({ ...snapshot, summary }));
  }

  setSummary(data: TaskSummary): void {
    const snapshot = this.getSnapshot();
    const frozenData = Object.freeze({ ...data });
    const current = snapshot.summary;

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

    const summary: TaskSummaryState = Object.freeze({
      data: frozenData,
      status: "ready",
      error: null,
      offline: false,
    });
    this.publish(Object.freeze({ ...snapshot, summary }));
  }

  failSummary(error: string, offline: boolean): void {
    const snapshot = this.getSnapshot();
    const summary: TaskSummaryState = Object.freeze({
      ...snapshot.summary,
      status: "error",
      error,
      offline,
    });
    this.publish(Object.freeze({ ...snapshot, summary }));
  }

  settleSummary(): void {
    const snapshot = this.getSnapshot();

    if (
      snapshot.summary.status === "idle" ||
      (snapshot.summary.status === "ready" &&
        snapshot.summary.error === null &&
        !snapshot.summary.offline)
    ) {
      return;
    }

    const summary: TaskSummaryState = Object.freeze({
      ...snapshot.summary,
      status: "ready",
      error: null,
      offline: false,
    });
    this.publish(Object.freeze({ ...snapshot, summary }));
  }

  clear(): void {
    this.#activeSearchKey = null;
    this.resetSnapshot();
  }

  resetForTests(): void {
    this.#boundUserId = null;
    this.#userGeneration = 0;
    this.#readGeneration = 0;
    this.clear();
    this.clearListenersForTests();
  }
}
