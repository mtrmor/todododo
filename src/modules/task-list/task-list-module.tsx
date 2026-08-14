import {
  ArrowClockwise,
  CalendarBlank,
  Check,
  CircleIcon,
  ListChecks,
  Plus,
  WarningCircle,
  WifiSlash,
} from "phosphor-react-native";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  colors,
  fonts,
  getErrorMessage,
  getTasks,
  setTaskCompleted,
  shadows,
  type TaskRecord,
} from "@/core";
import {
  getServerSnapshot,
  getSnapshot,
  markTasksChanged,
  openCreateTask,
  openTask,
  subscribe,
} from "@/shared-state";
import {
  appendTaskPage,
  reconcileTaskWindow,
  replaceTaskRecord,
} from "@/modules/task-list/task-window-state";

export type TaskListModuleProps = {
  title?: string;
};

const ACTIVE_POLL_INTERVAL_MS = 30_000;
const PAGE_SIZE = 50;

async function getLoadedTaskWindow(targetCount: number, signal: AbortSignal) {
  const items: TaskRecord[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  let nextCursor: string | null = null;

  do {
    const page = await getTasks({ cursor, limit: PAGE_SIZE, signal });
    items.push(...page.items);
    nextCursor = page.nextCursor;

    if (!nextCursor || items.length >= targetCount || seenCursors.has(nextCursor)) {
      break;
    }

    seenCursors.add(nextCursor);
    cursor = nextCursor;
  } while (items.length < targetCount);

  return { items, nextCursor };
}

export function TaskListModule({ title = "Inbox" }: TaskListModuleProps) {
  const { width } = useWindowDimensions();
  const { tasksRevision } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const loadedCountRef = useRef(0);
  const pendingIdsRef = useRef<ReadonlySet<string>>(new Set());
  const ignoredRevisionRef = useRef<number | null>(null);
  const isCompact = width < 680;

  useEffect(() => {
    loadedCountRef.current = tasks.length;
  }, [tasks.length]);

  async function fetchTaskWindow(
    mode: "initial" | "refresh",
  ) {
    const requestId = ++requestIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const effectiveMode = loadedCountRef.current === 0 ? "initial" : mode;
    setLoading(effectiveMode === "initial");
    setRefreshing(effectiveMode === "refresh");
    setLoadingMore(false);

    try {
      const page = await getLoadedTaskWindow(
        Math.max(PAGE_SIZE, loadedCountRef.current),
        controller.signal,
      );
      if (requestId !== requestIdRef.current) return;
      setTasks((current) =>
        reconcileTaskWindow(page.items, current, pendingIdsRef.current),
      );
      setNextCursor(page.nextCursor);
      setError(null);
      setOffline(false);
    } catch (caughtError) {
      if (controller.signal.aborted) return;
      const message = getErrorMessage(caughtError, "Tasks could not be loaded.");
      setError(message);
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  const fetchTaskWindowEffect = useEffectEvent(fetchTaskWindow);

  useEffect(() => {
    if (ignoredRevisionRef.current === tasksRevision) {
      ignoredRevisionRef.current = null;
      return;
    }

    const timeout = setTimeout(() => {
      void fetchTaskWindowEffect(
        loadedCountRef.current === 0 ? "initial" : "refresh",
      );
    }, 0);
    return () => {
      clearTimeout(timeout);
    };
  }, [tasksRevision]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (
      process.env.EXPO_OS !== "web" ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchTaskWindowEffect("refresh");
      }
    };
    const handleOnline = () => {
      setOffline(false);
      void fetchTaskWindowEffect("refresh");
    };
    const handleOffline = () => setOffline(true);
    const interval = window.setInterval(refreshIfVisible, ACTIVE_POLL_INTERVAL_MS);

    window.addEventListener("focus", refreshIfVisible);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void fetchTaskWindowEffect("refresh");
    });
    return () => subscription.remove();
  }, []);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    const requestId = ++requestIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(false);
    setRefreshing(false);
    setLoadingMore(true);
    try {
      const page = await getTasks({
        cursor: nextCursor,
        limit: PAGE_SIZE,
        signal: controller.signal,
      });
      if (requestId !== requestIdRef.current) return;
      setTasks((current) => appendTaskPage(current, page.items, pendingIdsRef.current));
      setNextCursor(page.nextCursor);
      setError(null);
      setOffline(false);
    } catch (caughtError) {
      if (controller.signal.aborted) return;
      setError(getErrorMessage(caughtError, "More tasks could not be loaded."));
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  }

  async function toggleTask(task: TaskRecord) {
    if (pendingIdsRef.current.has(task.id)) return;
    const nextCompleted = !task.completed;

    const nextPending = new Set(pendingIdsRef.current).add(task.id);
    pendingIdsRef.current = nextPending;
    setPendingIds(nextPending);
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, completed: nextCompleted } : item,
      ),
    );

    try {
      const savedTask = await setTaskCompleted(task.id, nextCompleted);
      setTasks((current) => replaceTaskRecord(current, savedTask));
      setError(null);
      setOffline(false);
      markTasksChanged();
      ignoredRevisionRef.current = getSnapshot().tasksRevision;
    } catch (caughtError) {
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, completed: task.completed } : item,
        ),
      );
      setError(getErrorMessage(caughtError, "The task was not changed."));
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    } finally {
      const remainingPending = new Set(pendingIdsRef.current);
      remainingPending.delete(task.id);
      pendingIdsRef.current = remainingPending;
      setPendingIds(remainingPending);
    }
  }

  const openTasks = tasks.filter((task) => !task.completed).length;

  return (
    <View style={{ flex: 1, alignItems: "center", backgroundColor: colors.paper }}>
      <View
        style={{
          width: "100%",
          maxWidth: 640,
          flex: 1,
          paddingHorizontal: isCompact ? 18 : 20,
          paddingTop: isCompact ? 24 : 42,
        }}
      >
        <View style={{ gap: 7, paddingHorizontal: 2, paddingBottom: 22 }}>
          <Text
            accessibilityRole="header"
            selectable
            style={{
              color: colors.ink,
              fontFamily: fonts.heading,
              fontSize: isCompact ? 27 : 30,
              fontWeight: "700",
              letterSpacing: -0.9,
              lineHeight: isCompact ? 34 : 38,
            }}
          >
            {title}
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={{
              color: colors.mutedInk,
              fontFamily: fonts.body,
              fontSize: 12,
              fontVariant: ["tabular-nums"],
            }}
          >
            {loading ? "Loading your route…" : `${openTasks} ${openTasks === 1 ? "task" : "tasks"} ahead`}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Add task"
          accessibilityRole="button"
          onPress={() => openCreateTask()}
          style={({ pressed }) => ({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            alignSelf: "flex-start",
            paddingHorizontal: 2,
            marginBottom: 10,
            opacity: pressed ? 0.6 : 1,
            cursor: "pointer",
            outlineColor: colors.focusRing,
          })}
        >
          <Plus aria-hidden color={colors.routeViolet} size={17} weight="bold" />
          <Text
            style={{
              color: colors.routeViolet,
              fontFamily: fonts.body,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            Add task
          </Text>
        </Pressable>

        {error || offline ? (
          <StatusBanner
            message={
              offline
                ? tasks.length > 0
                  ? "Offline. Showing tasks already loaded in this tab."
                  : "You are offline. Reconnect to load tasks."
                : error ?? "Tasks could not be refreshed."
            }
            offline={offline}
            onRetry={() => void fetchTaskWindow(tasks.length === 0 ? "initial" : "refresh")}
          />
        ) : null}

        {loading && tasks.length === 0 ? (
          <LoadingRows />
        ) : tasks.length === 0 && !error && !offline ? (
          <EmptyState onCreate={() => openCreateTask()} />
        ) : tasks.length === 0 ? (
          <View style={{ flex: 1 }} />
        ) : (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{ gap: 7, paddingBottom: 48 }}
            data={tasks}
            keyExtractor={(task) => task.id}
            ListFooterComponent={
              nextCursor ? (
                <Pressable
                  accessibilityLabel="Load more tasks"
                  accessibilityRole="button"
                  disabled={loadingMore}
                  onPress={() => void loadMore()}
                  style={({ pressed }) => ({
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 4,
                    opacity: pressed || loadingMore ? 0.6 : 1,
                    cursor: loadingMore ? "auto" : "pointer",
                    outlineColor: colors.focusRing,
                  })}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={colors.routeViolet} size="small" />
                  ) : (
                    <Text
                      style={{
                        color: colors.routeViolet,
                        fontFamily: fonts.body,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Load more
                    </Text>
                  )}
                </Pressable>
              ) : null
            }
            onRefresh={() => void fetchTaskWindow("refresh")}
            refreshing={refreshing}
            renderItem={({ item }) => (
              <TaskRow
                pending={pendingIds.has(item.id)}
                task={item}
                onOpen={() => openTask(item.id)}
                onToggle={() => void toggleTask(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

type TaskRowProps = {
  task: TaskRecord;
  pending: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

function TaskRow({ task, pending, onToggle, onOpen }: TaskRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <View
      style={{
        minHeight: 65,
        flexDirection: "row",
        alignItems: "stretch",
        borderWidth: 1,
        borderColor: colors.softLine,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: colors.paper,
        boxShadow: shadows.subtle,
      }}
    >
      <Pressable
        accessibilityLabel={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed, disabled: pending }}
        disabled={pending}
        hitSlop={2}
        onPress={onToggle}
        style={({ pressed }) => ({
          width: 50,
          minHeight: 62,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed || pending ? 0.6 : 1,
          cursor: pending ? "auto" : "pointer",
          outlineColor: colors.focusRing,
        })}
      >
        {task.completed ? (
          <View
            style={{
              width: 18,
              height: 18,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              backgroundColor: colors.routeViolet,
            }}
          >
            <Check aria-hidden color={colors.paper} size={11} weight="bold" />
          </View>
        ) : (
          <CircleIcon aria-hidden color={colors.placeholder} size={20} weight="regular" />
        )}
      </Pressable>

      <Pressable
        accessibilityHint="Opens task details"
        accessibilityLabel={`${task.title}${task.completed ? ", completed" : ""}`}
        accessibilityRole="button"
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onOpen}
        style={({ pressed }) => ({
          flex: 1,
          justifyContent: "center",
          gap: 5,
          paddingVertical: 11,
          paddingRight: 16,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
          backgroundColor: hovered || pressed ? colors.railFog : "transparent",
          cursor: "pointer",
          outlineColor: colors.focusRing,
          outlineOffset: -2,
        })}
      >
        <Text
          numberOfLines={2}
          style={{
            color: task.completed ? colors.mutedInk : colors.ink,
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: "500",
            lineHeight: 18,
            textDecorationLine: task.completed ? "line-through" : "none",
          }}
        >
          {task.title}
        </Text>
        {task.dueDate ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <CalendarBlank aria-hidden color={colors.placeholder} size={12} />
            <Text
              style={{
                color: colors.mutedInk,
                fontFamily: fonts.body,
                fontSize: 10,
                fontVariant: ["tabular-nums"],
              }}
            >
              {formatDueDate(task.dueDate)}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function StatusBanner({
  message,
  offline,
  onRetry,
}: {
  message: string;
  offline: boolean;
  onRetry: () => void;
}) {
  const Icon = offline ? WifiSlash : WarningCircle;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        marginBottom: 10,
        paddingLeft: 13,
        paddingRight: 4,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: offline ? colors.softLine : colors.dangerLine,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: offline ? colors.railFog : colors.dangerSurface,
      }}
    >
      <Icon aria-hidden color={offline ? colors.mutedInk : colors.danger} size={18} />
      <Text
        selectable
        style={{
          flex: 1,
          color: offline ? colors.mutedInk : colors.danger,
          fontFamily: fonts.body,
          fontSize: 12,
          lineHeight: 17,
        }}
      >
        {message}
      </Text>
      <Pressable
        accessibilityLabel="Retry loading tasks"
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.55 : 1,
          cursor: "pointer",
          outlineColor: colors.focusRing,
        })}
      >
        <ArrowClockwise aria-hidden color={colors.routeViolet} size={17} weight="bold" />
      </Pressable>
    </View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View
      style={{
        alignItems: "center",
        gap: 15,
        paddingHorizontal: 20,
        paddingTop: 74,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 17,
          borderCurve: "continuous",
          backgroundColor: colors.lavenderSelection,
        }}
      >
        <ListChecks aria-hidden color={colors.routeViolet} size={25} weight="duotone" />
      </View>
      <View style={{ alignItems: "center", gap: 5 }}>
        <Text
          selectable
          style={{
            color: colors.ink,
            fontFamily: fonts.heading,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          Your route is clear
        </Text>
        <Text
          selectable
          style={{
            maxWidth: 290,
            color: colors.mutedInk,
            fontFamily: fonts.body,
            fontSize: 13,
            lineHeight: 19,
            textAlign: "center",
          }}
        >
          Add the next thing you want to move forward.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Create your first task"
        accessibilityRole="button"
        onPress={onCreate}
        style={({ pressed }) => ({
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          borderRadius: 11,
          borderCurve: "continuous",
          backgroundColor: pressed ? colors.routeVioletPressed : colors.routeViolet,
          cursor: "pointer",
          outlineColor: colors.focusRing,
          outlineOffset: 2,
        })}
      >
        <Plus aria-hidden color={colors.paper} size={16} weight="bold" />
        <Text
          style={{
            color: colors.paper,
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          Create a task
        </Text>
      </Pressable>
    </View>
  );
}

function LoadingRows() {
  return (
    <View accessibilityLabel="Loading tasks" style={{ gap: 7 }}>
      {Array.from({ length: 5 }, (_, index) => (
        <View
          key={index}
          style={{
            height: 65,
            borderWidth: 1,
            borderColor: colors.softLine,
            borderRadius: 12,
            borderCurve: "continuous",
            backgroundColor: colors.railFog,
            opacity: 1 - index * 0.12,
          }}
        />
      ))}
    </View>
  );
}

function formatDueDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
