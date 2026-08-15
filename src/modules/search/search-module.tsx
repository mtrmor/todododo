import {
  ArrowClockwise,
  MagnifyingGlass,
  Plus,
  WarningCircle,
  WifiSlash,
} from "phosphor-react-native";
import { FlatList, Text, View } from "react-native";

import { SearchInput } from "@/modules/search/components/search-input/search-input";
import { ConnectedSearchTaskRow } from "@/modules/search/components/search-task-row/search-task-row";
import { useSearchModule } from "@/modules/search/hooks/use-search-module";
import { styles } from "@/modules/search/styles";
import { Button, NoticeBanner, ScreenState } from "@/platform/ui";
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
        <Button
          icon={Plus}
          onPress={() => openCreateTask()}
          style={styles.addAction}
          variant="ghost"
        >
          Add task
        </Button>
        {search.message ? (
          <NoticeBanner
            action={{ icon: ArrowClockwise, label: "Retry search", onPress: search.retry }}
            icon={search.offline ? WifiSlash : WarningCircle}
            message={search.message}
            tone={search.offline ? "neutral" : "error"}
          />
        ) : null}
        {search.loading && search.tasks.length === 0 ? (
          <ScreenState loading message="Searching tasks…" style={styles.screenState} />
        ) : search.tasks.length === 0 && !search.error && !search.offline ? (
          <ScreenState
            icon={MagnifyingGlass}
            message={
              search.debouncedQuery
                ? `Try a different word than “${search.debouncedQuery}”.`
                : "Create a task and it will be searchable here."
            }
            style={styles.screenState}
            title={search.debouncedQuery ? "No matching tasks" : "No tasks yet"}
          />
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
                <Button
                  loading={search.loadingMore}
                  onPress={search.loadMore}
                  style={styles.paginationAction}
                  variant="ghost"
                >
                  Load more results
                </Button>
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
