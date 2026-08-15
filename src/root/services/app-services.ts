import { SearchController } from "@/modules/search/search-controller";
import { SidebarController } from "@/modules/sidebar/sidebar-controller";
import { TaskDetailController } from "@/modules/task-detail/task-detail-controller";
import { TaskListController } from "@/modules/task-list/task-list-controller";
import { TaskInvalidationBus } from "@/shared-state/broadcast-bridge";
import { TasksStore } from "@/shared-state/tasks-store";
import { UiStore } from "@/shared-state/ui-store";

export type AppServices = Readonly<{
  tasksStore: TasksStore;
  uiStore: UiStore;
  taskInvalidationBus: TaskInvalidationBus;
  taskListController: TaskListController;
  searchController: SearchController;
  sidebarController: SidebarController;
  taskDetailController: TaskDetailController;
}>;

export function createAppServices(): AppServices {
  const tasksStore = new TasksStore();
  const uiStore = new UiStore();
  const taskInvalidationBus = new TaskInvalidationBus();

  return Object.freeze({
    tasksStore,
    uiStore,
    taskInvalidationBus,
    taskListController: new TaskListController(tasksStore, taskInvalidationBus),
    searchController: new SearchController(tasksStore, taskInvalidationBus),
    sidebarController: new SidebarController(tasksStore, taskInvalidationBus),
    taskDetailController: new TaskDetailController(tasksStore, taskInvalidationBus),
  });
}
