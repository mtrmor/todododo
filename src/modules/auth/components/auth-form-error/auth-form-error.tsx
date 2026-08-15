import { WarningCircle } from "phosphor-react-native";
import { Text, View } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/auth/components/auth-form-error/styles";

export function AuthFormError({ message }: { message: string }) {
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.container}>
      <WarningCircle aria-hidden color={colors.danger} size={18} weight="fill" />
      <Text selectable style={styles.message}>
        {message}
      </Text>
    </View>
  );
}
