import { AppState } from "react-native";

const DEFAULT_POLL_INTERVAL_MS = 30_000;

/** Registers application-active signals without knowing what data is refreshed. */
export function subscribeToActiveRefresh(
  refresh: () => void,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
): () => void {
  const appStateSubscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      refresh();
    }
  });

  if (
    process.env.EXPO_OS !== "web" ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return () => appStateSubscription.remove();
  }

  const refreshIfVisible = () => {
    if (document.visibilityState === "visible") {
      refresh();
    }
  };
  window.addEventListener("focus", refreshIfVisible);
  window.addEventListener("online", refreshIfVisible);
  document.addEventListener("visibilitychange", refreshIfVisible);
  const interval = window.setInterval(refreshIfVisible, pollIntervalMs);

  return () => {
    appStateSubscription.remove();
    window.clearInterval(interval);
    window.removeEventListener("focus", refreshIfVisible);
    window.removeEventListener("online", refreshIfVisible);
    document.removeEventListener("visibilitychange", refreshIfVisible);
  };
}
