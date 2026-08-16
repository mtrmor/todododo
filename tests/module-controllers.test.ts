import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  GetTasksOptions,
  RequestOptions,
  TaskDraft,
  TaskPage,
  TaskRecord,
} from "@/domain/tasks";
import { SearchController } from "@/modules/search/search-controller";
import { SidebarController } from "@/modules/sidebar/sidebar-controller";
import { TaskDetailController } from "@/modules/task-detail/task-detail-controller";
import { TaskListController } from "@/modules/task-list/task-list-controller";
import { TaskInvalidationBus, TasksStore } from "@/shared-state/internal";

vi.mock("@/platform/lifecycle/active-refresh", () => ({
  subscribeToActiveRefresh: () => () => undefined,
}));

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function collectionApi() {
  return {
    getTasks: vi.fn(
      async (_options: GetTasksOptions = {}): Promise<TaskPage> => ({
        items: [],
        nextCursor: null,
      }),
    ),
    setTaskCompleted: vi.fn(async (taskId: string, completed: boolean) =>
      task(taskId, {
        completed,
        completedAt: completed ? "2026-08-15T09:00:00.000Z" : null,
      }),
    ),
  };
}

const noLifecycle = (_refresh: () => void) => vi.fn();

describe("module-owned task controllers", () => {
  let invalidationBus: TaskInvalidationBus;

  beforeEach(() => {
    invalidationBus = new TaskInvalidationBus();
  });

  it("deduplicates Inbox loads, appends pagination and cleans lifecycle", async () => {
    const store = new TasksStore();
    const api = collectionApi();
    const first = deferred<TaskPage>();
    api.getTasks.mockImplementationOnce(() => first.promise);
    const stopLifecycle = vi.fn();
    const controller = new TaskListController(store, invalidationBus, api, () => stopLifecycle);
    const stop = controller.connect();
    const duplicate = controller.load("initial");
    expect(api.getTasks).toHaveBeenCalledTimes(1);
    first.resolve({
      items: Array.from({ length: 50 }, (_, index) => task(`task-${index}`)),
      nextCursor: "next",
    });
    await duplicate;
    api.getTasks.mockResolvedValueOnce({ items: [task("extra")], nextCursor: null });
    await controller.loadMore();
    expect(store.getCollection("inbox").tasks.at(-1)?.id).toBe("extra");
    stop();
    expect(stopLifecycle).toHaveBeenCalledOnce();
  });

  it("rolls optimistic Inbox completion back after failure", async () => {
    const store = new TasksStore();
    store.replaceCollection("inbox", [task("one")], null);
    store.setSummary({ open: 1, total: 1, completed: 0 });
    const api = collectionApi();
    api.setTaskCompleted.mockRejectedValueOnce(new Error("offline"));
    const controller = new TaskListController(store, invalidationBus, api, noLifecycle);
    const request = controller.setCompleted("one", true);
    expect(store.getTask("one")?.completed).toBe(true);
    await expect(request).rejects.toThrow("offline");
    expect(store.getTask("one")?.completed).toBe(false);
    expect(store.getSummary().data.open).toBe(1);
  });

  it("cancels stale Search and keeps only the active result", async () => {
    const store = new TasksStore();
    const api = collectionApi();
    const stale = deferred<TaskPage>();
    api.getTasks
      .mockImplementationOnce(() => stale.promise)
      .mockResolvedValueOnce({ items: [task("fresh")], nextCursor: null });
    const controller = new SearchController(store, invalidationBus, api, noLifecycle);
    controller.setQuery("old");
    controller.setQuery("new");
    await controller.load("initial");
    stale.resolve({ items: [task("stale")], nextCursor: null });
    await Promise.resolve();
    expect(store.getSnapshot().search.query).toBe("new");
    expect(store.getCollection("search").tasks.map((item) => item.id)).toEqual(["fresh"]);
    expect(store.getTask("stale")).toBeNull();
  });

  it("aborts an invalidated collection request and applies the replacement refresh", async () => {
    const store = new TasksStore();
    const api = collectionApi();
    const stale = deferred<TaskPage>();
    api.getTasks
      .mockImplementationOnce(() => stale.promise)
      .mockResolvedValueOnce({ items: [task("fresh")], nextCursor: null });
    const controller = new TaskListController(store, invalidationBus, api, noLifecycle);
    const stop = controller.connect();
    invalidationBus.publish();
    await controller.load("refresh");
    stale.resolve({ items: [task("stale")], nextCursor: null });
    await Promise.resolve();
    expect(store.getCollection("inbox").tasks.map((item) => item.id)).toEqual(["fresh"]);
    stop();
  });

  it("restarts a stale summary read after invalidation", async () => {
    const store = new TasksStore();
    const stale = deferred<{ open: number; total: number; completed: number }>();
    const api = {
      getTaskSummary: vi
        .fn()
        .mockImplementationOnce(() => stale.promise)
        .mockResolvedValueOnce({ open: 1, total: 1, completed: 0 }),
    };
    const controller = new SidebarController(store, invalidationBus, api, noLifecycle);
    const stop = controller.connect();
    invalidationBus.publish();
    await controller.load("refresh");
    stale.resolve({ open: 9, total: 9, completed: 0 });
    await Promise.resolve();
    expect(store.getSummary().data).toEqual({ open: 1, total: 1, completed: 0 });
    stop();
  });

  it("reconciles Task Detail create, update and delete", async () => {
    const store = new TasksStore();
    store.replaceCollection("inbox", [task("one")], null);
    store.setSummary({ open: 1, total: 1, completed: 0 });
    const api = {
      getTask: vi.fn(async (taskId: string, _options: RequestOptions = {}) => task(taskId)),
      createTask: vi.fn(async (draft: TaskDraft) => task("new", draft)),
      updateTask: vi.fn(async (taskId: string, draft: TaskDraft) => task(taskId, draft)),
      deleteTask: vi.fn(async (_taskId: string) => undefined),
    };
    const controller = new TaskDetailController(store, invalidationBus, api);
    await controller.create({ title: "Created", notes: "", dueDate: null });
    await controller.update("one", { title: "Updated", notes: "Note", dueDate: null });
    await controller.delete("one");
    expect(store.getCollection("inbox").tasks.map((item) => item.id)).toEqual(["new"]);
    expect(store.getTask("one")).toBeNull();
    expect(store.getSummary().data.total).toBe(1);
  });
});
