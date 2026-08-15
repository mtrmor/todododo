import { useEffect, useState, type PropsWithChildren } from "react";

import { useAuth } from "@/platform/auth/auth-provider";
import { useTaskStore } from "@/shared-state";

/** Scopes the in-memory task cache to the authenticated user before mounting modules. */
export function TasksDataProvider({ children }: PropsWithChildren) {
  const tasksStore = useTaskStore();
  const { status, user } = useAuth();
  const userId = status === "authenticated" ? (user?.id ?? null) : null;
  const [boundUserId, setBoundUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    tasksStore.bindUser(userId);
    queueMicrotask(() => {
      if (active) {
        setBoundUserId(userId);
      }
    });
    return () => {
      active = false;

      if (userId) {
        tasksStore.releaseUser(userId);
      }
    };
  }, [tasksStore, userId]);

  return userId === boundUserId ? children : null;
}
