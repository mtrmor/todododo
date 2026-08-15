import { createContext, useContext, type PropsWithChildren } from "react";

import type { TaskListController } from "@/modules/task-list/task-list-controller";

const TaskListControllerContext = createContext<TaskListController | null>(null);

export function TaskListControllerProvider({
  children,
  controller,
}: PropsWithChildren<{ controller: TaskListController }>) {
  return (
    <TaskListControllerContext.Provider value={controller}>
      {children}
    </TaskListControllerContext.Provider>
  );
}

export function useTaskListController(): TaskListController {
  const controller = useContext(TaskListControllerContext);

  if (!controller) {
    throw new Error("useTaskListController must be used inside AppServicesProvider");
  }

  return controller;
}
