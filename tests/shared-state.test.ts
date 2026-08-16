import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useInboxTasks,
  useTask,
  useTaskDialogActions,
  useUiStore,
  type TaskCollectionView,
  type TaskRecord,
} from "@/shared-state";
import { ExternalStore } from "@/shared-state/external-store";
import { TasksStore, UiStore } from "@/shared-state/internal";
import { SharedStateProvider } from "@/shared-state/store-context";

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

class CounterStore extends ExternalStore<Readonly<{ count: number; stable: { value: string } }>> {
  constructor() {
    super({ count: 0, stable: { value: "same" } });
  }

  publishSame(): void {
    this.publish(this.getSnapshot());
  }

  updateSame(): void {
    this.update((draft) => {
      draft.count = 0;
    });
  }

  increment(): void {
    this.update((draft) => {
      draft.count += 1;
    });
  }
}

describe("ExternalStore", () => {
  it("uses Mutative structural sharing and notifies synchronously", () => {
    const store = new CounterStore();
    const initial = store.getSnapshot();
    const stable = initial.stable;
    const calls: string[] = [];
    store.subscribe(() => calls.push("listener"));

    store.publishSame();
    store.updateSame();
    expect(store.getSnapshot()).toBe(initial);
    expect(calls).toEqual([]);

    calls.push("before");
    store.increment();
    calls.push("after");
    expect(calls).toEqual(["before", "listener", "after"]);
    expect(store.getSnapshot().stable).toBe(stable);
    expect(Object.isFrozen(store.getSnapshot())).toBe(false);
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
    expect(serverSnapshot.count).toBe(0);
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

  it("stores direct tasks, deduplicates pagination and preserves equal task identity", () => {
    const first = task("one");
    store.replaceCollection("inbox", [first], "cursor-1");
    const entity = store.getTask("one");
    store.appendCollection("inbox", [task("one"), task("two")], null);

    expect(store.getCollection("inbox").tasks.map((item) => item.id)).toEqual(["one", "two"]);
    expect(store.getTask("one")).toBe(entity);
    expect(Object.isFrozen(store.getSnapshot())).toBe(false);
  });

  it("keeps only the active Search query while retaining Inbox", () => {
    store.replaceCollection("inbox", [task("inbox")], null);
    store.activateSearch("old");
    store.replaceCollection("search", [task("old")], null);
    store.activateSearch(" next ");

    expect(store.getSnapshot().inbox.tasks.map((item) => item.id)).toEqual(["inbox"]);
    expect(store.getSnapshot().search.query).toBe("next");
    expect(store.getSnapshot().search.tasks).toEqual([]);
  });

  it("updates and removes a task from Inbox, Search and Detail", () => {
    store.replaceCollection("inbox", [task("one"), task("two")], null);
    store.activateSearch("one");
    store.replaceCollection("search", [task("one")], null);
    store.setDetail(task("one"));
    store.patchTask("one", { title: "Changed" });

    expect(store.getSnapshot().inbox.tasks[0].title).toBe("Changed");
    expect(store.getSnapshot().search.tasks[0].title).toBe("Changed");
    expect(store.getSnapshot().detail?.title).toBe("Changed");

    store.setPending("one", "delete");
    store.removeTask("one");
    expect(store.getTask("one")).toBeNull();
    expect(store.getCollection("inbox").tasks.map((item) => item.id)).toEqual(["two"]);
    expect(store.getCollection("search").tasks).toEqual([]);
    expect(store.getSnapshot().pendingById.one).toBeUndefined();
  });

  it("uses structural sharing for unrelated slices and same-value upserts", () => {
    store.replaceCollection("inbox", [task("one")], null);
    const initial = store.getSnapshot();
    store.upsertTask(task("one"));
    expect(store.getSnapshot()).toBe(initial);

    store.setSummary({ open: 1, total: 1, completed: 0 });
    const next = store.getSnapshot();
    expect(next.inbox).toBe(initial.inbox);
    expect(next.search).toBe(initial.search);
    expect(next.summary).not.toBe(initial.summary);
  });

  it("does not overwrite an optimistic task with a stale refresh", () => {
    store.replaceCollection("inbox", [task("one")], null);
    store.setPending("one", "complete");
    store.patchTask("one", { completed: true, completedAt: "2026-08-15T09:00:00.000Z" });

    store.replaceCollection("inbox", [task("one", { completed: false })], null);
    expect(store.getTask("one")?.completed).toBe(true);
  });

  it("clears every task slice", () => {
    store.replaceCollection("inbox", [task("one")], null);
    store.setPending("one", "update");
    store.setSummary({ open: 1, total: 1, completed: 0 });
    store.clear();

    expect(store.getSnapshot()).toBe(store.getServerSnapshot());
    expect(store.getTask("one")).toBeNull();
  });

  it("owns optimistic completion as a reversible transaction", () => {
    store.replaceCollection("inbox", [task("one")], null);
    store.setSummary({ open: 1, total: 1, completed: 0 });
    const transaction = store.beginCompletion("one", true, "inbox");

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
  let tasksStore: TasksStore;
  let uiStore: UiStore;

  beforeEach(() => {
    tasksStore = new TasksStore();
    uiStore = new UiStore();
    renderer = null;
  });

  function renderWithState(child: ReturnType<typeof createElement>) {
    return create(createElement(SharedStateProvider, { tasksStore, uiStore }, child));
  }

  it("does not rerender Inbox for unrelated task or summary changes", () => {
    let renders = 0;
    const selections: TaskCollectionView[] = [];

    function Probe() {
      selections.push(useInboxTasks());
      renders += 1;
      return null;
    }

    act(() => {
      renderer = renderWithState(createElement(Probe));
    });
    const initialView = selections[0];
    act(() => tasksStore.setSummary({ open: 1, total: 1, completed: 0 }));
    act(() => tasksStore.upsertTask(task("not-in-inbox")));
    expect(renders).toBe(1);
    expect(selections.at(-1)).toBe(initialView);

    act(() => tasksStore.replaceCollection("inbox", [task("one")], null));
    expect(renders).toBe(2);
    expect(selections.at(-1)?.tasks.map((item) => item.id)).toEqual(["one"]);
    act(() => renderer?.unmount());
  });

  it("rerenders a selected task exactly once when that task changes", () => {
    tasksStore.replaceCollection("inbox", [task("one")], null);
    let renders = 0;
    const selections: (TaskRecord | null)[] = [];

    function Probe() {
      selections.push(useTask("one"));
      renders += 1;
      return null;
    }

    act(() => {
      renderer = renderWithState(createElement(Probe));
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

  it("routes dialog actions to the supplied UiStore", () => {
    let actions: ReturnType<typeof useTaskDialogActions> | null = null;
    let selectedStore: UiStore | null = null;

    function Probe() {
      actions = useTaskDialogActions();
      selectedStore = useUiStore();
      return null;
    }

    act(() => {
      renderer = renderWithState(createElement(Probe));
    });
    act(() => actions?.openTask("task-1"));
    expect(selectedStore).toBe(uiStore);
    expect(uiStore.getSnapshot().taskDialog).toEqual({ mode: "edit", taskId: "task-1" });
    act(() => renderer?.unmount());
  });
});
