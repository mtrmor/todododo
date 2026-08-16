import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { useInboxController } from "@/modules/task-collection/inbox-controller-context";
import { useInboxTasks } from "@/shared-state";

export function useInboxModule() {
  const inboxController = useInboxController();
  const { width } = useWindowDimensions();
  const { tasks, nextCursor, status, error, offline } = useInboxTasks();
  useEffect(() => inboxController.connect(), [inboxController]);
  const message =
    error || offline
      ? offline
        ? tasks.length > 0
          ? "Offline. Showing tasks already loaded in this tab."
          : "You are offline. Reconnect to load tasks."
        : (error ?? "Tasks could not be refreshed.")
      : null;
  return {
    tasks,
    nextCursor,
    error,
    offline,
    message,
    isCompact: width < 680,
    loading: status === "loading",
    refreshing: status === "refreshing",
    loadingMore: status === "loading-more",
    openTasks: tasks.filter((task) => !task.completed).length,
    retry: () => void inboxController.load(tasks.length === 0 ? "initial" : "refresh"),
    refresh: () => void inboxController.load("refresh"),
    loadMore: () => void inboxController.loadMore(),
  };
}
