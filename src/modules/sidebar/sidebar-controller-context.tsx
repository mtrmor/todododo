import { createContext, useContext, type PropsWithChildren } from "react";

import type { SidebarController } from "@/modules/sidebar/sidebar-controller";

const SidebarControllerContext = createContext<SidebarController | null>(null);

export function SidebarControllerProvider({
  children,
  controller,
}: PropsWithChildren<{ controller: SidebarController }>) {
  return (
    <SidebarControllerContext.Provider value={controller}>
      {children}
    </SidebarControllerContext.Provider>
  );
}

export function useSidebarController(): SidebarController {
  const controller = useContext(SidebarControllerContext);

  if (!controller) {
    throw new Error("useSidebarController must be used inside AppServicesProvider");
  }

  return controller;
}
