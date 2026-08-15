import { ArrowClockwise, WarningCircle, WifiSlash } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/task-list/components/status-banner/styles";
export function StatusBanner({
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
      style={[styles.container, offline ? styles.offline : styles.error]}
    >
      <Icon aria-hidden color={offline ? colors.mutedInk : colors.danger} size={18} />
      <Text
        selectable
        style={[styles.message, offline ? styles.offlineMessage : styles.errorMessage]}
      >
        {message}
      </Text>
      <Pressable
        accessibilityLabel="Retry loading tasks"
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
      >
        <ArrowClockwise aria-hidden color={colors.routeViolet} size={17} weight="bold" />
      </Pressable>
    </View>
  );
}
