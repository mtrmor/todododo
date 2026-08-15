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
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
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
  useInboxTasks,
  useTaskMutation,
} from "@/shared-state";
import { taskListController } from "@/modules/task-list/task-list-controller";

export type TaskListModuleProps = {
  title?: string;
};

export function TaskListModule({ title = "Inbox" }: TaskListModuleProps) {
  const { width } = useWindowDimensions();
  const { tasks, nextCursor, status, error, offline } = useInboxTasks();
  const isCompact = width < 680;
  const loading = status === "loading";
  const refreshing = status === "refreshing";
  const loadingMore = status === "loading-more";

  const openTasks = tasks.filter((task) => !task.completed).length;

  useEffect(() => taskListController.connect(), []);

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
            onRetry={() => void taskListController.load(tasks.length === 0 ? "initial" : "refresh")}
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
                  onPress={() => void taskListController.loadMore()}
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
            onRefresh={() => void taskListController.load("refresh")}
            refreshing={refreshing}
            renderItem={({ item }) => (
              <ConnectedTaskRow task={item} />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

function ConnectedTaskRow({ task }: { task: TaskRecord }) {
  const mutation = useTaskMutation(task.id);
  return (
    <TaskRow
      pending={mutation !== null}
      task={task}
      onOpen={() => openTask(task.id)}
      onToggle={() => void taskListController.setCompleted(task.id, !task.completed)
        .catch(() => undefined)}
    />
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
