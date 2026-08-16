import type { TaskDetailController } from "@/modules/task-detail/task-detail-controller";
import { createRequiredContext } from "@/platform/react/create-required-context";

export const [TaskDetailControllerProvider, useTaskDetailController] =
  createRequiredContext<TaskDetailController>("useTaskDetailController");
