import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { getErrorMessage, useAuth } from "@/platform";
import { sidebarController } from "@/modules/sidebar/sidebar-controller";
import type { SidebarRoute } from "@/modules/sidebar/sidebar-module";
import { closeTask, useTaskSummary } from "@/shared-state";

const ROUTES: Record<SidebarRoute, string> = {
  inbox: "/inbox",
  search: "/search",
  today: "/today",
  upcoming: "/upcoming",
  projects: "/projects",
  archived: "/archived",
  settings: "/settings",
};

export function useSidebar({
  onNavigate,
  onClose,
}: {
  onNavigate?: (route: SidebarRoute) => void;
  onClose?: () => void;
}) {
  const router = useRouter();
  const { user, signOut: performSignOut } = useAuth();
  const { data: summary, error: summaryError } = useTaskSummary();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => sidebarController.connect(), []);

  function navigate(route: SidebarRoute) {
    if (onNavigate) {
      onNavigate(route);
    } else {
      router.push(ROUTES[route] as never);
    }

    onClose?.();
  }

  async function signOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setSignOutError(null);
    try {
      closeTask();
      await performSignOut();
      router.replace("/sign-in");
    } catch (error) {
      setSignOutError(getErrorMessage(error, "Sign out could not be completed."));
    } finally {
      setSigningOut(false);
    }
  }

  return { email: user?.email, summary, summaryError, signingOut, signOutError, navigate, signOut };
}
