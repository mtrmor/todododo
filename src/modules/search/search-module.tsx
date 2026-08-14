import {
  ArrowClockwise,
  CalendarBlank,
  Check,
  CircleIcon,
  MagnifyingGlass,
  Plus,
  WarningCircle,
  WifiSlash,
  X,
} from "phosphor-react-native";
import {
  useCallback,
  useEffect,
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
  TextInput,
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
} from "@/modules/search/task-window-state";

const SEARCH_DEBOUNCE_MS = 250;
const PAGE_SIZE = 50;

async function getSearchWindow(
  searchQuery: string,
  targetCount: number,
  signal: AbortSignal,
) {
  const items: TaskRecord[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;
  let nextCursor: string | null = null;

  do {
    const page = await getTasks({
      query: searchQuery || undefined,
      cursor,
      limit: PAGE_SIZE,
      signal,
    });
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

export function SearchModule() {
  const { width } = useWindowDimensions();
  const { tasksRevision } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<TextInput>(null);
  const requestIdRef = useRef(0);
  const loadedCountRef = useRef(0);
  const pendingIdsRef = useRef<ReadonlySet<string>>(new Set());
  const ignoredRevisionRef = useRef<number | null>(null);
  const previousQueryRef = useRef<string | null>(null);
  const isCompact = width < 680;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    loadedCountRef.current = tasks.length;
  }, [tasks.length]);

  const runSearch = useCallback(async (
    searchQuery: string,
    targetCount = PAGE_SIZE,
    preserveMissingPending = true,
  ) => {
    const requestId = ++requestIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setLoadingMore(false);

    try {
      const page = await getSearchWindow(searchQuery, targetCount, controller.signal);
      if (requestId !== requestIdRef.current) return;
      setTasks((current) =>
        reconcileTaskWindow(
          page.items,
          current,
          pendingIdsRef.current,
          preserveMissingPending,
        ),
      );
      setNextCursor(page.nextCursor);
      setError(null);
      setOffline(false);
    } catch (caughtError) {
      if (!controller.signal.aborted) {
        setError(getErrorMessage(caughtError, "Search could not be completed."));
        setOffline(typeof navigator !== "undefined" && !navigator.onLine);
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const queryChanged = previousQueryRef.current !== debouncedQuery;
    previousQueryRef.current = debouncedQuery;

    if (ignoredRevisionRef.current === tasksRevision && !queryChanged) {
      ignoredRevisionRef.current = null;
      return;
    }
    if (ignoredRevisionRef.current === tasksRevision) {
      ignoredRevisionRef.current = null;
    }

    const targetCount = queryChanged
      ? PAGE_SIZE
      : Math.max(PAGE_SIZE, loadedCountRef.current);
    const timeout = setTimeout(
      () => void runSearch(debouncedQuery, targetCount, !queryChanged),
      0,
    );
    return () => {
      clearTimeout(timeout);
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [debouncedQuery, runSearch, tasksRevision]);

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
        void runSearch(
          debouncedQuery,
          Math.max(PAGE_SIZE, loadedCountRef.current),
        );
      }
    };
    const handleOnline = () => {
      setOffline(false);
      void runSearch(
        debouncedQuery,
        Math.max(PAGE_SIZE, loadedCountRef.current),
      );
    };
    const handleOffline = () => setOffline(true);
    const interval = window.setInterval(refreshIfVisible, 30_000);
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
  }, [debouncedQuery, runSearch]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void runSearch(
          debouncedQuery,
          Math.max(PAGE_SIZE, loadedCountRef.current),
        );
      }
    });
    return () => subscription.remove();
  }, [debouncedQuery, runSearch]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    const requestId = ++requestIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(false);
    setLoadingMore(true);
    try {
      const page = await getTasks({
        query: debouncedQuery || undefined,
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
      setError(getErrorMessage(caughtError, "More results could not be loaded."));
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
        <View style={{ gap: 18, paddingBottom: 14 }}>
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
            Search
          </Text>

          <View style={{ position: "relative", justifyContent: "center" }}>
            <MagnifyingGlass
              aria-hidden
              color={colors.mutedInk}
              size={17}
              style={{ position: "absolute", left: 14, zIndex: 1 }}
            />
            <TextInput
              accessibilityLabel="Search tasks"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="never"
              onChangeText={setQuery}
              placeholder="Search every title and note"
              placeholderTextColor={colors.placeholder}
              ref={inputRef}
              returnKeyType="search"
              selectionColor={colors.routeViolet}
              style={{
                minHeight: 48,
                paddingLeft: 43,
                paddingRight: query ? 50 : 14,
                borderWidth: 1,
                borderColor: colors.softLine,
                borderRadius: 12,
                borderCurve: "continuous",
                backgroundColor: colors.paper,
                color: colors.ink,
                fontFamily: fonts.body,
                fontSize: 14,
                boxShadow: shadows.subtle,
                outlineColor: colors.focusRing,
                outlineOffset: 1,
              }}
              value={query}
            />
            {query ? (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                onPress={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                style={({ pressed }) => ({
                  position: "absolute",
                  right: 2,
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.58 : 1,
                  cursor: "pointer",
                  outlineColor: colors.focusRing,
                })}
              >
                <X aria-hidden color={colors.mutedInk} size={17} />
              </Pressable>
            ) : null}
          </View>
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
            marginBottom: 8,
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
          <SearchError
            message={
              offline
                ? tasks.length > 0
                  ? "Offline. Showing results already loaded in this tab."
                  : "You are offline. Reconnect to search tasks."
                : error ?? "Search could not be completed."
            }
            offline={offline}
            onRetry={() =>
              void runSearch(
                debouncedQuery,
                Math.max(PAGE_SIZE, loadedCountRef.current),
              )
            }
          />
        ) : null}

        {loading && tasks.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.routeViolet} size="small" />
            <Text
              accessibilityLiveRegion="polite"
              style={{
                paddingTop: 10,
                color: colors.mutedInk,
                fontFamily: fonts.body,
                fontSize: 12,
              }}
            >
              Searching tasks…
            </Text>
          </View>
        ) : tasks.length === 0 && !error && !offline ? (
          <View style={{ alignItems: "center", gap: 8, paddingTop: 78 }}>
            <View
              style={{
                width: 50,
                height: 50,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                borderCurve: "continuous",
                backgroundColor: colors.lavenderSelection,
              }}
            >
              <MagnifyingGlass
                aria-hidden
                color={colors.routeViolet}
                size={24}
                weight="duotone"
              />
            </View>
            <Text
              selectable
              style={{
                color: colors.ink,
                fontFamily: fonts.heading,
                fontSize: 17,
                fontWeight: "700",
                paddingTop: 5,
              }}
            >
              {debouncedQuery ? "No matching tasks" : "No tasks yet"}
            </Text>
            <Text
              selectable
              style={{
                maxWidth: 300,
                color: colors.mutedInk,
                fontFamily: fonts.body,
                fontSize: 13,
                lineHeight: 19,
                textAlign: "center",
              }}
            >
              {debouncedQuery
                ? `Try a different word than “${debouncedQuery}”.`
                : "Create a task and it will be searchable here."}
            </Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={{ flex: 1 }} />
        ) : (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{ gap: 7, paddingBottom: 48 }}
            data={tasks}
            keyExtractor={(task) => task.id}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  paddingHorizontal: 2,
                  paddingBottom: 4,
                  color: colors.mutedInk,
                  fontFamily: fonts.body,
                  fontSize: 11,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {loading ? "Updating results…" : `${tasks.length} ${tasks.length === 1 ? "result" : "results"}`}
              </Text>
            }
            ListFooterComponent={
              nextCursor ? (
                <Pressable
                  accessibilityLabel="Load more search results"
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
            renderItem={({ item }) => (
              <SearchTaskRow
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

function SearchTaskRow({
  task,
  pending,
  onToggle,
  onOpen,
}: {
  task: TaskRecord;
  pending: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
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
          <CircleIcon aria-hidden color={colors.placeholder} size={20} />
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          {task.dueDate ? (
            <>
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
            </>
          ) : null}
          {task.notes ? (
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                color: colors.placeholder,
                fontFamily: fonts.body,
                fontSize: 10,
              }}
            >
              {task.notes}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function SearchError({
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
        accessibilityLabel="Retry search"
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

function formatDueDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
