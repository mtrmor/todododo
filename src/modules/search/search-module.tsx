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
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  shadows,
  type TaskRecord,
} from "@/core";
import {
  openCreateTask,
  openTask,
  useSearchTasks,
  useTaskMutation,
} from "@/shared-state";
import { searchController } from "@/modules/search/search-controller";

const SEARCH_DEBOUNCE_MS = 250;
export function SearchModule() {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<TextInput>(null);
  const { tasks, nextCursor, status, error, offline } = useSearchTasks(debouncedQuery);
  const isCompact = width < 680;
  const loading = status === "loading";
  const loadingMore = status === "loading-more";

  useEffect(() => searchController.connect(), []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    searchController.setQuery(debouncedQuery);
  }, [debouncedQuery]);

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
            onRetry={() => void searchController.load("refresh")}
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
                  onPress={() => void searchController.loadMore()}
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
              <ConnectedSearchTaskRow task={item} />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

function ConnectedSearchTaskRow({ task }: { task: TaskRecord }) {
  const mutation = useTaskMutation(task.id);
  return (
    <SearchTaskRow
      pending={mutation !== null}
      task={task}
      onOpen={() => openTask(task.id)}
      onToggle={() => void searchController.setCompleted(task.id, !task.completed)
        .catch(() => undefined)}
    />
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
