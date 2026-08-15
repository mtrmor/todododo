import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/task-detail/components/loading-state/styles";
export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.routeViolet} size="small" />
      <Text accessibilityLiveRegion="polite" style={styles.label}>
        Opening task…
      </Text>
    </View>
  );
}
