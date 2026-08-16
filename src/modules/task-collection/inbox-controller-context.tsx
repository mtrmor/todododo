import type { TaskCollectionController } from "@/modules/task-collection/task-collection-controller";
import { createRequiredContext } from "@/platform/react/create-required-context";

export const [InboxControllerProvider, useInboxController] =
  createRequiredContext<TaskCollectionController>("useInboxController");
