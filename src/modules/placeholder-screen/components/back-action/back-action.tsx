import { ArrowLeft } from "phosphor-react-native";
import { Pressable, Text } from "react-native";

import { colors } from "@/platform";
import { styles } from "@/modules/placeholder-screen/components/back-action/styles";

export function BackAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityHint="Returns to your inbox"
      accessibilityLabel="Back to Inbox"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <ArrowLeft aria-hidden color={colors.paper} size={17} weight="bold" />
      <Text style={styles.label}>Back to Inbox</Text>
    </Pressable>
  );
}
