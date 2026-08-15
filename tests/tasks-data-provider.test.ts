import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const auth = {
    status: "authenticated" as "authenticated" | "anonymous",
    user: { id: "user-a", email: "a@example.com" } as { id: string; email: string } | null,
  };
  return {
    auth,
    store: {
      bindUser: vi.fn(),
      releaseUser: vi.fn(),
    },
  };
});

vi.mock("@/core/auth/auth-provider", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/shared-state/internal", () => ({
  tasksStore: mocks.store,
}));

// Vitest hoists the mocks above this static import at transform time.
// eslint-disable-next-line import/first
import { TasksDataProvider } from "@/root/providers/tasks-data-provider";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("TasksDataProvider", () => {
  beforeEach(() => {
    mocks.auth.status = "authenticated";
    mocks.auth.user = { id: "user-a", email: "a@example.com" };
    vi.clearAllMocks();
  });

  it("binds and releases the authenticated user without loading data", async () => {
    let renderer: ReturnType<typeof create>;
    await act(async () => {
      renderer = create(createElement(TasksDataProvider, null, null));
      await Promise.resolve();
    });

    expect(mocks.store.bindUser).toHaveBeenCalledWith("user-a");

    mocks.auth.status = "anonymous";
    mocks.auth.user = null;
    await act(async () => {
      renderer.update(createElement(TasksDataProvider, null, null));
      await Promise.resolve();
    });
    expect(mocks.store.releaseUser).toHaveBeenCalledWith("user-a");
    expect(mocks.store.bindUser).toHaveBeenLastCalledWith(null);

    act(() => renderer.unmount());
  });

  it("does not mount task consumers until the store is bound to the current user", async () => {
    const child = vi.fn(() => null);
    let renderer: ReturnType<typeof create>;

    mocks.auth.status = "anonymous";
    mocks.auth.user = null;
    await act(async () => {
      renderer = create(createElement(TasksDataProvider, null, createElement(child)));
      await Promise.resolve();
    });
    expect(child).toHaveBeenCalledTimes(1);

    child.mockClear();
    mocks.auth.status = "authenticated";
    mocks.auth.user = { id: "user-b", email: "b@example.com" };
    await act(async () => {
      renderer.update(createElement(TasksDataProvider, null, createElement(child)));
      await Promise.resolve();
    });

    expect(mocks.store.bindUser).toHaveBeenLastCalledWith("user-b");
    expect(child).toHaveBeenCalledTimes(1);
    expect(mocks.store.bindUser.mock.invocationCallOrder.at(-1)).toBeLessThan(
      child.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    act(() => renderer.unmount());
  });
});
