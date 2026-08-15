import { createContext, useContext, type PropsWithChildren } from "react";

import type { TaskDetailController } from "@/modules/task-detail/task-detail-controller";

const TaskDetailControllerContext = createContext<TaskDetailController | null>(null);

export function TaskDetailControllerProvider({
  children,
  controller,
}: PropsWithChildren<{ controller: TaskDetailController }>) {
  return (
    <TaskDetailControllerContext.Provider value={controller}>
      {children}
    </TaskDetailControllerContext.Provider>
  );
}

export function useTaskDetailController(): TaskDetailController {
  const controller = useContext(TaskDetailControllerContext);

  if (!controller) {
    throw new Error("useTaskDetailController must be used inside AppServicesProvider");
  }

  return controller;
}
