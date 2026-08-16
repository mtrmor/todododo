import { SidebarController } from "@/modules/sidebar/sidebar-controller";
import { TaskDetailController } from "@/modules/task-detail/task-detail-controller";
import { TaskCollectionController } from "@/modules/task-collection/task-collection-controller";
import { TaskInvalidationBus } from "@/shared-state/broadcast-bridge";
import { TasksStore } from "@/shared-state/tasks-store";
import { UiStore } from "@/shared-state/ui-store";

export type AppServices = Readonly<{
  tasksStore: TasksStore;
  uiStore: UiStore;
  taskInvalidationBus: TaskInvalidationBus;
  inboxController: TaskCollectionController;
  searchController: TaskCollectionController;
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
    inboxController: new TaskCollectionController(tasksStore, taskInvalidationBus, {
      collection: "inbox",
      messages: {
        load: "Tasks could not be loaded.",
        loadMore: "More tasks could not be loaded.",
        completion: "The task was not changed.",
      },
    }),
    searchController: new TaskCollectionController(tasksStore, taskInvalidationBus, {
      collection: "search",
      searchable: true,
      messages: {
        load: "Search could not be loaded.",
        loadMore: "More results could not be loaded.",
        completion: "The task was not changed.",
      },
    }),
    sidebarController: new SidebarController(tasksStore, taskInvalidationBus),
    taskDetailController: new TaskDetailController(tasksStore, taskInvalidationBus),
  });
}
