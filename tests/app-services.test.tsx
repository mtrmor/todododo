import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    status: "authenticated" as "authenticated" | "anonymous",
    user: { id: "user-a", email: "a@example.com" } as { id: string; email: string } | null,
  },
}));

vi.mock("@/platform/auth/auth-provider", () => ({ useAuth: () => mocks.auth }));

// Vitest hoists the mock above these imports at transform time.
// eslint-disable-next-line import/first
import { useTaskListController } from "@/modules/task-list/task-list-controller-context";
// eslint-disable-next-line import/first
import { AppServicesProvider } from "@/root/services/app-services-provider";
// eslint-disable-next-line import/first
import { createAppServices } from "@/root/services/app-services";
// eslint-disable-next-line import/first
import { useTaskStore, useUiStore } from "@/shared-state";
// eslint-disable-next-line import/first
import type { TasksStore } from "@/shared-state/internal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("AppServicesProvider", () => {
  it("creates one connected dependency graph", () => {
    const services = createAppServices();

    expect(Object.isFrozen(services)).toBe(true);
    expect(services.tasksStore).toBeDefined();
    expect(services.uiStore).toBeDefined();
    expect(services.taskInvalidationBus).toBeDefined();
    expect(services.taskListController).toBeDefined();
    expect(services.searchController).toBeDefined();
    expect(services.sidebarController).toBeDefined();
    expect(services.taskDetailController).toBeDefined();
  });

  it("keeps hook instances stable across provider rerenders", () => {
    const selections: {
      tasksStore: ReturnType<typeof useTaskStore>;
      uiStore: ReturnType<typeof useUiStore>;
      taskListController: ReturnType<typeof useTaskListController>;
    }[] = [];

    function Probe() {
      selections.push({
        tasksStore: useTaskStore(),
        uiStore: useUiStore(),
        taskListController: useTaskListController(),
      });
      return null;
    }

    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(createElement(AppServicesProvider, null, createElement(Probe)));
    });
    act(() => {
      renderer.update(createElement(AppServicesProvider, null, createElement(Probe)));
    });

    expect(selections).toHaveLength(2);
    expect(selections[1]).toEqual(selections[0]);
    act(() => renderer.unmount());
  });

  it("isolates separate provider instances", () => {
    const stores: TasksStore[] = [];

    function Probe() {
      stores.push(useTaskStore());
      return null;
    }

    let first: ReturnType<typeof create>;
    let second: ReturnType<typeof create>;
    act(() => {
      first = create(createElement(AppServicesProvider, null, createElement(Probe)));
      second = create(createElement(AppServicesProvider, null, createElement(Probe)));
    });

    expect(stores).toHaveLength(2);
    expect(stores[0]).not.toBe(stores[1]);
    act(() => {
      first.unmount();
      second.unmount();
    });
  });

  it("fails clearly when a specialized hook has no provider", () => {
    function Probe() {
      useTaskStore();
      return null;
    }

    expect(() => {
      act(() => {
        create(createElement(Probe));
      });
    }).toThrow("useTaskStore must be used inside AppServicesProvider");
  });
});
