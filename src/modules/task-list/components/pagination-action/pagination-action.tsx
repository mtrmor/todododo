import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/task-list/components/pagination-action/styles";
export function PaginationAction({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Load more tasks"
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (pressed || loading) && styles.muted,
        loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.routeViolet} size="small" />
      ) : (
        <Text style={styles.label}>Load more</Text>
      )}
    </Pressable>
  );
}
