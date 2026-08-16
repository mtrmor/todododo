import type { TaskListController } from "@/modules/task-list/task-list-controller";
import { createRequiredContext } from "@/platform/react/create-required-context";

export const [TaskListControllerProvider, useTaskListController] =
  createRequiredContext<TaskListController>("useTaskListController");
