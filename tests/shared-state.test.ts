import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import {
  INBOX_COLLECTION_KEY,
  searchCollectionKey,
  useInboxTasks,
  useTask,
  type TaskCollectionView,
  type TaskRecord,
} from "@/shared-state";
import { ExternalStore } from "@/shared-state/external-store";
import { tasksStore, TasksStore, UiStore } from "@/shared-state/internal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function task(id: string, overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id,
    title: id,
    notes: "",
    dueDate: null,
    completed: false,
    createdAt: "2026-08-15T08:00:00.000Z",
    updatedAt: "2026-08-15T08:00:00.000Z",
    completedAt: null,
    ...overrides,
  };
}

class CounterStore extends ExternalStore<Readonly<{ count: number }>> {
  constructor() {
    super(Object.freeze({ count: 0 }));
  }

  publishSame(): void {
    this.publish(this.getSnapshot());
  }

  increment(): void {
    this.publish(Object.freeze({ count: this.getSnapshot().count + 1 }));
  }
}

describe("ExternalStore", () => {
  it("keeps identity for same-value publishes and notifies synchronously", () => {
    const store = new CounterStore();
    const initial = store.getSnapshot();
    const calls: string[] = [];
    store.subscribe(() => calls.push("listener"));

    store.publishSame();
    expect(store.getSnapshot()).toBe(initial);
    expect(calls).toEqual([]);

    calls.push("before");
    store.increment();
    calls.push("after");
    expect(calls).toEqual(["before", "listener", "after"]);
    expect(Object.isFrozen(store.getSnapshot())).toBe(true);
  });

  it("supports unsubscribe and a permanent SSR snapshot", () => {
    const store = new CounterStore();
    const listener = vi.fn();
    const serverSnapshot = store.getServerSnapshot();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.increment();

    expect(listener).not.toHaveBeenCalled();
    expect(store.getServerSnapshot()).toBe(serverSnapshot);
    expect(serverSnapshot).toEqual({ count: 0 });
  });
});

describe("UiStore", () => {
  let store: UiStore;

  beforeEach(() => {
    store = new UiStore();
  });

  it("opens create/edit dialogs and treats repeated commands as no-ops", () => {
    store.openCreateTask();
    const createSnapshot = store.getSnapshot();
    store.openCreateTask();
    expect(store.getSnapshot()).toBe(createSnapshot);

    store.openTask(" task-1 ");
    expect(store.getSnapshot().taskDialog).toEqual({ mode: "edit", taskId: "task-1" });
    const editSnapshot = store.getSnapshot();
    store.openTask("task-1");
    expect(store.getSnapshot()).toBe(editSnapshot);

    store.closeTask();
    const closedSnapshot = store.getSnapshot();
    store.closeTask();
    expect(store.getSnapshot()).toBe(closedSnapshot);
  });
});

describe("TasksStore", () => {
  let store: TasksStore;

  beforeEach(() => {
    store = new TasksStore();
  });

  it("normalizes entities, deduplicates pagination and preserves entity identity", () => {
    const first = task("one");
    store.replaceCollection(INBOX_COLLECTION_KEY, [first], "cursor-1");
    const entity = store.getTask("one");
    store.appendCollection(INBOX_COLLECTION_KEY, [task("one"), task("two")], null);

    expect(store.getCollection(INBOX_COLLECTION_KEY).ids).toEqual(["one", "two"]);
    expect(store.getTask("one")).toBe(entity);
    expect(Object.isFrozen(store.getSnapshot())).toBe(true);
    expect(Object.isFrozen(store.getSnapshot().byId)).toBe(true);
  });

  it("evicts the previous search collection while retaining Inbox", () => {
    const oldSearch = searchCollectionKey("old");
    const nextSearch = searchCollectionKey("next");
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("inbox")], null);
    store.activateSearch(oldSearch);
    store.replaceCollection(oldSearch, [task("old")], null);
    store.activateSearch(nextSearch);

    expect(store.getSnapshot().collections[INBOX_COLLECTION_KEY]).toBeDefined();
    expect(store.getSnapshot().collections[oldSearch]).toBeUndefined();
    expect(store.getActiveSearchKey()).toBe(nextSearch);
  });

  it("removes an entity from every collection and tracks pending mutations", () => {
    const searchKey = searchCollectionKey("one");
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one"), task("two")], null);
    store.activateSearch(searchKey);
    store.replaceCollection(searchKey, [task("one")], null);
    store.setPending("one", "delete");
    store.removeTask("one");

    expect(store.getTask("one")).toBeNull();
    expect(store.getCollection(INBOX_COLLECTION_KEY).ids).toEqual(["two"]);
    expect(store.getCollection(searchKey).ids).toEqual([]);
    expect(store.getSnapshot().pendingById.one).toBeUndefined();
  });

  it("uses structural sharing for unrelated slices and same-value entity upserts", () => {
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one")], null);
    const initial = store.getSnapshot();
    store.upsertTask(task("one"));
    expect(store.getSnapshot()).toBe(initial);

    store.setSummary({ open: 1, total: 1, completed: 0 });
    const next = store.getSnapshot();
    expect(next.byId).toBe(initial.byId);
    expect(next.collections).toBe(initial.collections);
    expect(next.summary).not.toBe(initial.summary);
  });

  it("does not overwrite an optimistic entity with a stale collection refresh", () => {
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one")], null);
    store.setPending("one", "complete");
    store.patchTask("one", { completed: true, completedAt: "2026-08-15T09:00:00.000Z" });

    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one", { completed: false })], null);

    expect(store.getTask("one")?.completed).toBe(true);
  });

  it("clears every task slice for logout or user changes", () => {
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one")], null);
    store.setPending("one", "update");
    store.setSummary({ open: 1, total: 1, completed: 0 });
    store.clear();

    expect(store.getSnapshot()).toBe(store.getServerSnapshot());
    expect(store.getTask("one")).toBeNull();
  });

  it("invalidates stale reads on mutation and user switches", () => {
    store.bindUser("user-a");
    const initialRead = store.captureReadToken();
    store.invalidateReads();
    expect(store.isReadTokenCurrent(initialRead)).toBe(false);

    const nextRead = store.captureReadToken();
    store.bindUser("user-b");
    expect(store.isReadTokenCurrent(nextRead)).toBe(false);
    expect(store.getSnapshot()).toBe(store.getServerSnapshot());
  });

  it("owns optimistic completion as a reversible transaction", () => {
    store.bindUser("user-a");
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one")], null);
    store.setSummary({ open: 1, total: 1, completed: 0 });
    const transaction = store.beginCompletion("one", true, INBOX_COLLECTION_KEY);

    expect(transaction).not.toBeNull();
    expect(store.getTask("one")?.completed).toBe(true);
    expect(store.getSummary().data).toEqual({ open: 0, total: 1, completed: 1 });
    expect(store.getSnapshot().pendingById.one).toBe("complete");

    store.rollbackCompletion(transaction!, "Not saved", false);
    expect(store.getTask("one")?.completed).toBe(false);
    expect(store.getSummary().data).toEqual({ open: 1, total: 1, completed: 0 });
    expect(store.getSnapshot().pendingById.one).toBeUndefined();
  });
});

describe("Shared State selectors", () => {
  let renderer: ReactTestRenderer | null = null;

  beforeEach(() => {
    tasksStore.resetForTests();
    renderer = null;
  });

  it("does not rerender an Inbox subscriber for unrelated entity or summary changes", () => {
    let renders = 0;
    const selections: TaskCollectionView[] = [];

    function Probe() {
      selections.push(useInboxTasks());
      renders += 1;
      return null;
    }

    act(() => {
      renderer = create(createElement(Probe));
    });
    const initialView = selections[0];
    expect(renders).toBe(1);

    act(() => tasksStore.setSummary({ open: 1, total: 1, completed: 0 }));
    act(() => tasksStore.upsertTask(task("not-in-inbox")));
    expect(renders).toBe(1);
    expect(selections.at(-1)).toBe(initialView);

    act(() => tasksStore.replaceCollection(INBOX_COLLECTION_KEY, [task("one")], null));
    expect(renders).toBe(2);
    expect(selections.at(-1)?.tasks.map((item) => item.id)).toEqual(["one"]);
    act(() => renderer?.unmount());
  });

  it("rerenders a selected entity exactly once when that entity changes", () => {
    tasksStore.upsertTask(task("one"));
    let renders = 0;
    const selections: (TaskRecord | null)[] = [];

    function Probe() {
      selections.push(useTask("one"));
      renders += 1;
      return null;
    }

    act(() => {
      renderer = create(createElement(Probe));
    });
    act(() => tasksStore.upsertTask(task("other")));
    expect(renders).toBe(1);

    act(() => {
      tasksStore.patchTask("one", { title: "Changed" });
    });
    expect(renders).toBe(2);
    expect(selections.at(-1)?.title).toBe("Changed");
    act(() => renderer?.unmount());
  });
});
