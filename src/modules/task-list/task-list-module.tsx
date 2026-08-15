import { FlatList, View } from "react-native";

import { AddTaskAction } from "@/modules/task-list/components/add-task-action/add-task-action";
import { EmptyState } from "@/modules/task-list/components/empty-state/empty-state";
import { LoadingRows } from "@/modules/task-list/components/loading-rows/loading-rows";
import { PaginationAction } from "@/modules/task-list/components/pagination-action/pagination-action";
import { StatusBanner } from "@/modules/task-list/components/status-banner/status-banner";
import { TaskListHeader } from "@/modules/task-list/components/task-list-header/task-list-header";
import { ConnectedTaskRow } from "@/modules/task-list/components/task-row/task-row";
import { useTaskList } from "@/modules/task-list/hooks/use-task-list";
import { styles } from "@/modules/task-list/styles";
import { openCreateTask } from "@/shared-state";

export type TaskListModuleProps = { title?: string };

export function TaskListModule({ title = "Inbox" }: TaskListModuleProps) {
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
        <AddTaskAction onPress={() => openCreateTask()} />
        {list.message ? (
          <StatusBanner message={list.message} offline={list.offline} onRetry={list.retry} />
        ) : null}
        {list.loading && list.tasks.length === 0 ? (
          <LoadingRows />
        ) : list.tasks.length === 0 && !list.error && !list.offline ? (
          <EmptyState onCreate={() => openCreateTask()} />
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
                <PaginationAction loading={list.loadingMore} onPress={list.loadMore} />
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
