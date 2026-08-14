import { beforeEach, describe, expect, it, vi } from "vitest";
import { closeTask, getServerSnapshot, getSnapshot, markTasksChanged, openCreateTask, openTask } from "@/shared-state";
import { markTasksChangedLocal, resetSharedStateForTests, subscribeLocal } from "@/shared-state/store";

describe("shared state", () => {
  beforeEach(resetSharedStateForTests);

  it("keeps snapshot identity until an actual change", () => {
    const initial = getSnapshot();
    closeTask();
    expect(getSnapshot()).toBe(initial);

    openCreateTask();
    const created = getSnapshot();
    expect(created).not.toBe(initial);
    openCreateTask();
    expect(getSnapshot()).toBe(created);

    openTask("task-1");
    const edited = getSnapshot();
    openTask("task-1");
    expect(getSnapshot()).toBe(edited);
  });

  it("publishes immutable snapshots", () => {
    openTask("task-1");
    expect(Object.isFrozen(getSnapshot())).toBe(true);
    expect(Object.isFrozen(getSnapshot().taskDialog)).toBe(true);
  });

  it("notifies listeners synchronously", () => {
    const calls: string[] = [];
    subscribeLocal(() => calls.push("listener"));
    calls.push("before");
    openCreateTask();
    calls.push("after");
    expect(calls).toEqual(["before", "listener", "after"]);
  });

  it("supports unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLocal(listener);
    unsubscribe();
    openCreateTask();
    expect(listener).not.toHaveBeenCalled();
  });

  it("increments only the revision when tasks change", () => {
    openTask("task-1");
    const dialog = getSnapshot().taskDialog;
    markTasksChanged();
    expect(getSnapshot()).toEqual({ taskDialog: dialog, tasksRevision: 1 });
  });

  it("returns a permanent closed server snapshot", () => {
    const serverSnapshot = getServerSnapshot();
    openTask("task-1");
    markTasksChangedLocal();
    expect(getServerSnapshot()).toBe(serverSnapshot);
    expect(serverSnapshot).toEqual({ taskDialog: null, tasksRevision: 0 });
  });
});
