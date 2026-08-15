import { createContext, useContext, type PropsWithChildren } from "react";

import type { TasksStore } from "@/shared-state/tasks-store";
import type { UiStore } from "@/shared-state/ui-store";

const TaskStoreContext = createContext<TasksStore | null>(null);
const UiStoreContext = createContext<UiStore | null>(null);

export function SharedStateProvider({
  children,
  tasksStore,
  uiStore,
}: PropsWithChildren<{ tasksStore: TasksStore; uiStore: UiStore }>) {
  return (
    <TaskStoreContext.Provider value={tasksStore}>
      <UiStoreContext.Provider value={uiStore}>{children}</UiStoreContext.Provider>
    </TaskStoreContext.Provider>
  );
}

export function useTaskStore(): TasksStore {
  const store = useContext(TaskStoreContext);

  if (!store) {
    throw new Error("useTaskStore must be used inside AppServicesProvider");
  }

  return store;
}

export function useUiStore(): UiStore {
  const store = useContext(UiStoreContext);

  if (!store) {
    throw new Error("useUiStore must be used inside AppServicesProvider");
  }

  return store;
}
