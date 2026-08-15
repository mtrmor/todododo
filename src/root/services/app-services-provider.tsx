import { useState, type PropsWithChildren } from "react";

import { SearchControllerProvider } from "@/modules/search/search-controller-context";
import { SidebarControllerProvider } from "@/modules/sidebar/sidebar-controller-context";
import { TaskDetailControllerProvider } from "@/modules/task-detail/task-detail-controller-context";
import { TaskListControllerProvider } from "@/modules/task-list/task-list-controller-context";
import { createAppServices } from "@/root/services/app-services";
import { SharedStateProvider } from "@/shared-state/store-context";

export function AppServicesProvider({ children }: PropsWithChildren) {
  const [services] = useState(createAppServices);

  return (
    <SharedStateProvider tasksStore={services.tasksStore} uiStore={services.uiStore}>
      <TaskListControllerProvider controller={services.taskListController}>
        <SearchControllerProvider controller={services.searchController}>
          <SidebarControllerProvider controller={services.sidebarController}>
            <TaskDetailControllerProvider controller={services.taskDetailController}>
              {children}
            </TaskDetailControllerProvider>
          </SidebarControllerProvider>
        </SearchControllerProvider>
      </TaskListControllerProvider>
    </SharedStateProvider>
  );
}
