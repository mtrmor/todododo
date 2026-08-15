import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";

import { useTaskListController } from "@/modules/task-list/task-list-controller-context";
import { AppServicesProvider } from "@/root/services/app-services-provider";
import { createAppServices } from "@/root/services/app-services";
import { useTaskStore, useUiStore } from "@/shared-state";
import type { TaskInvalidationBus, TasksStore } from "@/shared-state/internal";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("AppServicesProvider", () => {
  it("creates one connected dependency graph", () => {
    const services = createAppServices();
    const controllers = [
      services.taskListController,
      services.searchController,
      services.sidebarController,
      services.taskDetailController,
    ];

    expect(Object.isFrozen(services)).toBe(true);
    for (const controller of controllers) {
      const dependencies = controller as unknown as {
        store: TasksStore;
        invalidationBus: TaskInvalidationBus;
      };
      expect(dependencies.store).toBe(services.tasksStore);
      expect(dependencies.invalidationBus).toBe(services.taskInvalidationBus);
    }
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
