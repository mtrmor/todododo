import { ArrowRight } from "phosphor-react-native";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/auth/components/auth-submit-action/styles";

export function AuthSubmitAction({
  isSignUp,
  submitting,
  onPress,
}: {
  isSignUp: boolean;
  submitting: boolean;
  onPress: () => void;
}) {
  const label = isSignUp ? "Create account" : "Sign in";
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={submitting}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        submitting && styles.disabled,
      ]}
    >
      {submitting ? (
        <ActivityIndicator color={colors.paper} size="small" />
      ) : (
        <>
          <Text style={styles.label}>{label}</Text>
          <ArrowRight aria-hidden color={colors.paper} size={17} weight="bold" />
        </>
      )}
    </Pressable>
  );
}
