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
import { INBOX_COLLECTION_KEY, searchCollectionKey } from "@/shared-state";
import { taskInvalidationBus, TasksStore } from "@/shared-state/internal";

vi.mock("@/root/lifecycle/active-refresh", () => ({
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
    getTasks: vi.fn(async (_options: GetTasksOptions = {}): Promise<TaskPage> => ({
      items: [], nextCursor: null,
    })),
    setTaskCompleted: vi.fn(async (taskId: string, completed: boolean) => task(taskId, {
      completed,
      completedAt: completed ? "2026-08-15T09:00:00.000Z" : null,
    })),
  };
}

const noLifecycle = (_refresh: () => void) => vi.fn();

describe("module-owned task controllers", () => {
  beforeEach(() => taskInvalidationBus.resetForTests());

  it("deduplicates Inbox loads, appends pagination and cleans lifecycle", async () => {
    const store = new TasksStore();
    store.bindUser("user-a");
    const api = collectionApi();
    const first = deferred<TaskPage>();
    api.getTasks.mockImplementationOnce(() => first.promise);
    const stopLifecycle = vi.fn();
    const controller = new TaskListController(store, api, () => stopLifecycle);
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
    expect(store.getCollection(INBOX_COLLECTION_KEY).ids.at(-1)).toBe("extra");
    stop();
    expect(stopLifecycle).toHaveBeenCalledOnce();
  });

  it("rolls optimistic Inbox completion back after failure", async () => {
    const store = new TasksStore();
    store.bindUser("user-a");
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one")], null);
    store.setSummary({ open: 1, total: 1, completed: 0 });
    const api = collectionApi();
    api.setTaskCompleted.mockRejectedValueOnce(new Error("offline"));
    const controller = new TaskListController(store, api, noLifecycle);
    const request = controller.setCompleted("one", true);
    expect(store.getTask("one")?.completed).toBe(true);
    await expect(request).rejects.toThrow("offline");
    expect(store.getTask("one")?.completed).toBe(false);
    expect(store.getSummary().data.open).toBe(1);
  });

  it("cancels stale Search and keeps only the active result collection", async () => {
    const store = new TasksStore();
    store.bindUser("user-a");
    const api = collectionApi();
    const stale = deferred<TaskPage>();
    api.getTasks.mockImplementationOnce(() => stale.promise)
      .mockResolvedValueOnce({ items: [task("fresh")], nextCursor: null });
    const controller = new SearchController(store, api, noLifecycle);
    controller.setQuery("old");
    controller.setQuery("new");
    await controller.load("initial");
    stale.resolve({ items: [task("stale")], nextCursor: null });
    await Promise.resolve();
    expect(store.getSnapshot().collections[searchCollectionKey("old")]).toBeUndefined();
    expect(store.getCollection(searchCollectionKey("new")).ids).toEqual(["fresh"]);
    expect(store.getTask("stale")).toBeNull();
  });

  it("loads summary but ignores a response from the previous user", async () => {
    const store = new TasksStore();
    store.bindUser("user-a");
    const response = deferred<{ open: number; total: number; completed: number }>();
    const api = { getTaskSummary: vi.fn(() => response.promise) };
    const controller = new SidebarController(store, api, noLifecycle);
    const request = controller.load("initial");
    store.bindUser("user-b");
    response.resolve({ open: 9, total: 9, completed: 0 });
    await request;
    expect(store.getSummary().status).toBe("idle");
  });

  it("reconciles Task Detail create, update and delete without exporting its controller", async () => {
    const store = new TasksStore();
    store.bindUser("user-a");
    store.replaceCollection(INBOX_COLLECTION_KEY, [task("one")], null);
    store.setSummary({ open: 1, total: 1, completed: 0 });
    const api = {
      getTask: vi.fn(async (taskId: string, _options: RequestOptions = {}) => task(taskId)),
      createTask: vi.fn(async (draft: TaskDraft) => task("new", draft)),
      updateTask: vi.fn(async (taskId: string, draft: TaskDraft) => task(taskId, draft)),
      deleteTask: vi.fn(async (_taskId: string) => undefined),
    };
    const controller = new TaskDetailController(store, api);
    await controller.create({ title: "Created", notes: "", dueDate: null });
    await controller.update("one", { title: "Updated", notes: "Note", dueDate: null });
    await controller.delete("one");
    expect(store.getCollection(INBOX_COLLECTION_KEY).ids).toEqual(["new"]);
    expect(store.getTask("one")).toBeNull();
    expect(store.getSummary().data.total).toBe(1);
  });
});
