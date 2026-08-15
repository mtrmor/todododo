import { FlatList, Text, View } from "react-native";
import { AddTaskAction } from "@/modules/search/components/add-task-action/add-task-action";
import { PaginationAction } from "@/modules/search/components/pagination-action/pagination-action";
import { SearchError } from "@/modules/search/components/search-error/search-error";
import { SearchInput } from "@/modules/search/components/search-input/search-input";
import { SearchState } from "@/modules/search/components/search-state/search-state";
import { ConnectedSearchTaskRow } from "@/modules/search/components/search-task-row/search-task-row";
import { useSearchModule } from "@/modules/search/hooks/use-search-module";
import { styles } from "@/modules/search/styles";
import { openCreateTask } from "@/shared-state";

export function SearchModule() {
  const search = useSearchModule();
  return (
    <View style={styles.screen}>
      <View style={[styles.content, search.isCompact ? styles.contentCompact : styles.contentWide]}>
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            selectable
            style={[styles.title, search.isCompact ? styles.titleCompact : styles.titleWide]}
          >
            Search
          </Text>
          <SearchInput onChange={search.setQuery} query={search.query} />
        </View>
        <AddTaskAction onPress={() => openCreateTask()} />
        {search.message ? (
          <SearchError message={search.message} offline={search.offline} onRetry={search.retry} />
        ) : null}
        {search.loading && search.tasks.length === 0 ? (
          <SearchState kind="loading" />
        ) : search.tasks.length === 0 && !search.error && !search.offline ? (
          <SearchState kind="empty" query={search.debouncedQuery} />
        ) : search.tasks.length === 0 ? (
          <View style={styles.fill} />
        ) : (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.listContent}
            data={search.tasks}
            keyExtractor={(task) => task.id}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text accessibilityLiveRegion="polite" style={styles.resultCount}>
                {search.loading
                  ? "Updating results…"
                  : `${search.tasks.length} ${search.tasks.length === 1 ? "result" : "results"}`}
              </Text>
            }
            ListFooterComponent={
              search.nextCursor ? (
                <PaginationAction loading={search.loadingMore} onPress={search.loadMore} />
              ) : null
            }
            renderItem={({ item }) => <ConnectedSearchTaskRow task={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}
