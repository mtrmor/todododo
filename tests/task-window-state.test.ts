import { describe, expect, it } from "vitest";

import type { TaskRecord } from "@/core";
import {
  appendTaskPage as appendInboxPage,
  reconcileTaskWindow as reconcileInboxWindow,
  replaceTaskRecord as replaceInboxTask,
} from "@/modules/task-list/task-window-state";
import {
  appendTaskPage as appendSearchPage,
  reconcileTaskWindow as reconcileSearchWindow,
} from "@/modules/search/task-window-state";

function task(id: string, completed = false, title = id): TaskRecord {
  return {
    id,
    title,
    notes: "",
    dueDate: null,
    completed,
    createdAt: `2026-08-14T12:00:0${id.length}.000Z`,
    updatedAt: "2026-08-14T12:00:00.000Z",
    completedAt: completed ? "2026-08-14T12:00:00.000Z" : null,
  };
}

describe("task window reconciliation", () => {
  it("keeps an optimistic pending row while applying fresh server rows", () => {
    const optimistic = task("pending", true, "Optimistic");
    const current = [optimistic, task("stable", false, "Old title")];
    const server = [task("pending", false, "Server stale"), task("stable", false, "Fresh title")];

    expect(reconcileInboxWindow(server, current, new Set(["pending"]))).toEqual([
      optimistic,
      task("stable", false, "Fresh title"),
    ]);
  });

  it("preserves a pending row missing from a same-query refresh", () => {
    const optimistic = task("pending", true);

    expect(reconcileSearchWindow([], [optimistic], new Set(["pending"]))).toEqual([
      optimistic,
    ]);
  });

  it("drops pending rows from the previous search when the query changes", () => {
    const optimistic = task("pending", true);

    expect(
      reconcileSearchWindow([], [optimistic], new Set(["pending"]), false),
    ).toEqual([]);
  });

  it("deduplicates appended pages without replacing pending rows", () => {
    const optimistic = task("pending", true);
    const nextTask = task("next", false);

    expect(
      appendInboxPage(
        [optimistic],
        [task("pending", false), nextTask],
        new Set(["pending"]),
      ),
    ).toEqual([optimistic, nextTask]);
    expect(
      appendSearchPage(
        [optimistic],
        [task("pending", false), nextTask],
        new Set(["pending"]),
      ),
    ).toEqual([optimistic, nextTask]);
  });

  it("replaces an optimistic row with the mutation response", () => {
    const saved = task("pending", true, "Saved");
    expect(replaceInboxTask([task("pending"), task("other")], saved)).toEqual([
      saved,
      task("other"),
    ]);
  });
});
