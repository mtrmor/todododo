import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useSearchController } from "@/modules/task-collection/search-controller-context";
import { useSearchTasks } from "@/shared-state";

const SEARCH_DEBOUNCE_MS = 250;
export function useSearchModule() {
  const searchController = useSearchController();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { tasks, nextCursor, status, error, offline } = useSearchTasks(debouncedQuery);
  useEffect(() => searchController.connect(), [searchController]);
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);
  useEffect(() => {
    searchController.setQuery(debouncedQuery);
  }, [debouncedQuery, searchController]);
  const message =
    error || offline
      ? offline
        ? tasks.length > 0
          ? "Offline. Showing results already loaded in this tab."
          : "You are offline. Reconnect to search tasks."
        : (error ?? "Search could not be completed.")
      : null;
  return {
    query,
    setQuery,
    debouncedQuery,
    tasks,
    nextCursor,
    error,
    offline,
    message,
    isCompact: width < 680,
    loading: status === "loading",
    loadingMore: status === "loading-more",
    retry: () => void searchController.load("refresh"),
    loadMore: () => void searchController.loadMore(),
  };
}
