import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    status: "authenticated" as "authenticated" | "anonymous",
    user: { id: "user-a", email: "a@example.com" } as { id: string; email: string } | null,
  },
}));

vi.mock("@/platform/auth/auth-provider", () => ({ useAuth: () => mocks.auth }));

// Vitest hoists the mock above these imports at transform time.
// eslint-disable-next-line import/first
import { AppServicesProvider } from "@/root/services/app-services-provider";
// eslint-disable-next-line import/first
import { useTaskStore, useUiStore } from "@/shared-state";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("authenticated AppServices scope", () => {
  beforeEach(() => {
    mocks.auth.status = "authenticated";
    mocks.auth.user = { id: "user-a", email: "a@example.com" };
  });

  it("keeps the graph for one user and recreates it on user changes and logout", () => {
    const selections: {
      tasksStore: ReturnType<typeof useTaskStore>;
      uiStore: ReturnType<typeof useUiStore>;
    }[] = [];

    function Probe() {
      selections.push({ tasksStore: useTaskStore(), uiStore: useUiStore() });
      return null;
    }

    const tree = () => createElement(AppServicesProvider, null, createElement(Probe));
    let renderer: ReturnType<typeof create>;

    act(() => {
      renderer = create(tree());
    });
    act(() => {
      renderer.update(tree());
    });

    expect(selections[1]).toEqual(selections[0]);

    mocks.auth.user = { id: "user-b", email: "b@example.com" };
    act(() => {
      renderer.update(tree());
    });

    expect(selections[2].tasksStore).not.toBe(selections[1].tasksStore);
    expect(selections[2].uiStore).not.toBe(selections[1].uiStore);

    mocks.auth.status = "anonymous";
    mocks.auth.user = null;
    act(() => {
      renderer.update(tree());
    });

    expect(selections[3].tasksStore).not.toBe(selections[2].tasksStore);
    expect(selections[3].uiStore).not.toBe(selections[2].uiStore);
    act(() => renderer.unmount());
  });
});
