import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TasksStore, UiStore } from "@/shared-state/internal";
import { SharedStateProvider } from "@/shared-state/store-context";

const mocks = vi.hoisted(() => {
  const auth = {
    status: "authenticated" as "authenticated" | "anonymous",
    user: { id: "user-a", email: "a@example.com" } as { id: string; email: string } | null,
  };
  return {
    auth,
  };
});

vi.mock("@/platform/auth/auth-provider", () => ({ useAuth: () => mocks.auth }));

// Vitest hoists the mocks above this static import at transform time.
// eslint-disable-next-line import/first
import { TasksDataProvider } from "@/root/providers/tasks-data-provider";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("TasksDataProvider", () => {
  let tasksStore: TasksStore;
  let uiStore: UiStore;
  let bindUser: ReturnType<typeof vi.spyOn>;
  let releaseUser: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mocks.auth.status = "authenticated";
    mocks.auth.user = { id: "user-a", email: "a@example.com" };
    tasksStore = new TasksStore();
    uiStore = new UiStore();
    bindUser = vi.spyOn(tasksStore, "bindUser");
    releaseUser = vi.spyOn(tasksStore, "releaseUser");
    vi.clearAllMocks();
  });

  function renderTree(children?: ReturnType<typeof createElement>) {
    return createElement(
      SharedStateProvider,
      { tasksStore, uiStore },
      createElement(TasksDataProvider, null, children),
    );
  }

  it("binds and releases the authenticated user without loading data", async () => {
    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(renderTree());
      await Promise.resolve();
    });

    expect(bindUser).toHaveBeenCalledWith("user-a");

    mocks.auth.status = "anonymous";
    mocks.auth.user = null;
    await act(async () => {
      renderer.update(renderTree());
      await Promise.resolve();
    });
    expect(releaseUser).toHaveBeenCalledWith("user-a");
    expect(bindUser).toHaveBeenLastCalledWith(null);

    act(() => renderer.unmount());
  });

  it("does not mount task consumers until the store is bound to the current user", async () => {
    const child = vi.fn(() => null);
    let renderer: ReturnType<typeof create>;

    mocks.auth.status = "anonymous";
    mocks.auth.user = null;
    await act(async () => {
      renderer = create(renderTree(createElement(child)));
      await Promise.resolve();
    });
    expect(child).toHaveBeenCalledTimes(1);

    child.mockClear();
    mocks.auth.status = "authenticated";
    mocks.auth.user = { id: "user-b", email: "b@example.com" };
    await act(async () => {
      renderer.update(renderTree(createElement(child)));
      await Promise.resolve();
    });

    expect(bindUser).toHaveBeenLastCalledWith("user-b");
    expect(child).toHaveBeenCalledTimes(1);
    expect(bindUser.mock.invocationCallOrder.at(-1)).toBeLessThan(
      child.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    act(() => renderer.unmount());
  });
});
