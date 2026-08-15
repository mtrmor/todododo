import { useEffect, useState, type PropsWithChildren } from "react";

import { useAuth } from "@/platform/auth/auth-provider";
import { tasksStore } from "@/shared-state/internal";

/** Scopes the in-memory task cache to the authenticated user before mounting modules. */
export function TasksDataProvider({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const userId = status === "authenticated" ? user?.id ?? null : null;
  const [boundUserId, setBoundUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    tasksStore.bindUser(userId);
    queueMicrotask(() => {
      if (active) setBoundUserId(userId);
    });
    return () => {
      active = false;
      if (userId) tasksStore.releaseUser(userId);
    };
  }, [userId]);

  return userId === boundUserId ? children : null;
}
