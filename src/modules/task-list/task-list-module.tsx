import { ArrowClockwise, ListChecks, Plus, WarningCircle, WifiSlash } from "phosphor-react-native";
import { FlatList, View } from "react-native";

import { LoadingRows } from "@/modules/task-list/components/loading-rows/loading-rows";
import { TaskListHeader } from "@/modules/task-list/components/task-list-header/task-list-header";
import { ConnectedTaskRow } from "@/modules/task-list/components/task-row/task-row";
import { useTaskList } from "@/modules/task-list/hooks/use-task-list";
import { styles } from "@/modules/task-list/styles";
import { Button, NoticeBanner, ScreenState } from "@/platform/ui";
import { useTaskDialogActions } from "@/shared-state";

export type TaskListModuleProps = { title?: string };

export function TaskListModule({ title = "Inbox" }: TaskListModuleProps) {
  const { openCreateTask } = useTaskDialogActions();
  const list = useTaskList();
  return (
    <View style={styles.screen}>
      <View style={[styles.content, list.isCompact ? styles.contentCompact : styles.contentWide]}>
        <TaskListHeader
          loading={list.loading}
          openTasks={list.openTasks}
          title={title}
          compact={list.isCompact}
        />
        <Button
          icon={Plus}
          onPress={() => openCreateTask()}
          style={styles.addAction}
          variant="ghost"
        >
          Add task
        </Button>
        {list.message ? (
          <NoticeBanner
            action={{ icon: ArrowClockwise, label: "Retry loading tasks", onPress: list.retry }}
            icon={list.offline ? WifiSlash : WarningCircle}
            message={list.message}
            tone={list.offline ? "neutral" : "error"}
          />
        ) : null}
        {list.loading && list.tasks.length === 0 ? (
          <LoadingRows />
        ) : list.tasks.length === 0 && !list.error && !list.offline ? (
          <ScreenState
            action={{ icon: Plus, label: "Create a task", onPress: () => openCreateTask() }}
            icon={ListChecks}
            message="Add the next thing you want to move forward."
            style={styles.screenState}
            title="Your route is clear"
          />
        ) : list.tasks.length === 0 ? (
          <View style={styles.fill} />
        ) : (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.listContent}
            data={list.tasks}
            keyExtractor={(task) => task.id}
            ListFooterComponent={
              list.nextCursor ? (
                <Button
                  loading={list.loadingMore}
                  onPress={list.loadMore}
                  style={styles.paginationAction}
                  variant="ghost"
                >
                  Load more
                </Button>
              ) : null
            }
            onRefresh={list.refresh}
            refreshing={list.refreshing}
            renderItem={({ item }) => <ConnectedTaskRow task={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}
