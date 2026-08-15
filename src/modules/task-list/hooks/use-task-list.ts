import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { taskListController } from "@/modules/task-list/task-list-controller";
import { useInboxTasks } from "@/shared-state";

export function useTaskList() {
  const { width } = useWindowDimensions();
  const { tasks, nextCursor, status, error, offline } = useInboxTasks();
  useEffect(() => taskListController.connect(), []);
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
    retry: () => void taskListController.load(tasks.length === 0 ? "initial" : "refresh"),
    refresh: () => void taskListController.load("refresh"),
    loadMore: () => void taskListController.loadMore(),
  };
}
