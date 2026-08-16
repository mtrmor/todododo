import { useState, type PropsWithChildren } from "react";

import { SearchControllerProvider } from "@/modules/search/search-controller-context";
import { SidebarControllerProvider } from "@/modules/sidebar/sidebar-controller-context";
import { TaskDetailControllerProvider } from "@/modules/task-detail/task-detail-controller-context";
import { TaskListControllerProvider } from "@/modules/task-list/task-list-controller-context";
import { createAppServices } from "@/root/services/app-services";
import { useAuth } from "@/platform/auth/auth-provider";
import { SharedStateProvider } from "@/shared-state/store-context";

export function AppServicesProvider({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const scopeKey = status === "authenticated" && user ? `user:${user.id}` : "anonymous";

  return (
    <ScopedAppServicesProvider key={scopeKey}>{children}</ScopedAppServicesProvider>
  );
}

function ScopedAppServicesProvider({ children }: PropsWithChildren) {
  const [services] = useState(createAppServices);

  return (
    <SharedStateProvider tasksStore={services.tasksStore} uiStore={services.uiStore}>
      <TaskListControllerProvider value={services.taskListController}>
        <SearchControllerProvider value={services.searchController}>
          <SidebarControllerProvider value={services.sidebarController}>
            <TaskDetailControllerProvider value={services.taskDetailController}>
              {children}
            </TaskDetailControllerProvider>
          </SidebarControllerProvider>
        </SearchControllerProvider>
      </TaskListControllerProvider>
    </SharedStateProvider>
  );
}
