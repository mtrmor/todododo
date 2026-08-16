import { Text, View } from "react-native";
import { styles } from "@/modules/task-collection/components/task-list-header/styles";
export function TaskListHeader({
  title,
  openTasks,
  loading,
  compact,
}: {
  title: string;
  openTasks: number;
  loading: boolean;
  compact: boolean;
}) {
  return (
    <View style={styles.container}>
      <Text
        accessibilityRole="header"
        selectable
        style={[styles.title, compact ? styles.titleCompact : styles.titleWide]}
      >
        {title}
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.meta}>
        {loading
          ? "Loading your route…"
          : `${openTasks} ${openTasks === 1 ? "task" : "tasks"} ahead`}
      </Text>
    </View>
  );
}
