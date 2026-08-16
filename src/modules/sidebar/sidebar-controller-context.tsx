import type { SidebarController } from "@/modules/sidebar/sidebar-controller";
import { createRequiredContext } from "@/platform/react/create-required-context";

export const [SidebarControllerProvider, useSidebarController] =
  createRequiredContext<SidebarController>("useSidebarController");
