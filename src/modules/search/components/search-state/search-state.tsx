import { MagnifyingGlass } from "phosphor-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/search/components/search-state/styles";
export function SearchState({ kind, query = "" }: { kind: "loading" | "empty"; query?: string }) {
  if (kind === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.routeViolet} size="small" />
        <Text accessibilityLiveRegion="polite" style={styles.loadingLabel}>
          Searching tasks…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.empty}>
      <View style={styles.icon}>
        <MagnifyingGlass aria-hidden color={colors.routeViolet} size={24} weight="duotone" />
      </View>
      <Text selectable style={styles.title}>
        {query ? "No matching tasks" : "No tasks yet"}
      </Text>
      <Text selectable style={styles.description}>
        {query
          ? `Try a different word than “${query}”.`
          : "Create a task and it will be searchable here."}
      </Text>
    </View>
  );
}
