import type { Icon } from "phosphor-react-native";
import { ActivityIndicator, StyleSheet, View, type ViewStyle, type StyleProp } from "react-native";

import { colors, radii, spacing } from "@/platform/theme";
import { AppText } from "@/platform/ui/app-text";
import { Button, type ButtonVariant } from "@/platform/ui/button";

export type ScreenStateAction = Readonly<{
  label: string;
  onPress: () => void;
  icon?: Icon;
  variant?: ButtonVariant;
}>;

export type ScreenStateProps = Readonly<{
  title?: string;
  message?: string;
  loading?: boolean;
  icon?: Icon;
  action?: ScreenStateAction;
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenState({
  title,
  message,
  loading = false,
  icon: StateIcon,
  action,
  style,
}: ScreenStateProps) {
  return (
    <View accessibilityRole={loading ? "progressbar" : undefined} style={[styles.container, style]}>
      {loading ? <ActivityIndicator color={colors.routeViolet} size="small" /> : null}
      {!loading && StateIcon ? (
        <View style={styles.icon}>
          <StateIcon aria-hidden color={colors.routeViolet} size={24} weight="duotone" />
        </View>
      ) : null}
      {title ? (
        <AppText style={styles.centered} variant="subheading">
          {title}
        </AppText>
      ) : null}
      {message ? (
        <AppText
          accessibilityLiveRegion={loading ? "polite" : undefined}
          style={[styles.message, styles.centered]}
          tone="muted"
          variant="caption"
        >
          {message}
        </AppText>
      ) : null}
      {action ? (
        <Button icon={action.icon} onPress={action.onPress} variant={action.variant}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: spacing.lg,
  },
  icon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
    borderRadius: radii.lg,
    borderCurve: "continuous",
    backgroundColor: colors.lavenderSelection,
  },
  centered: { textAlign: "center" },
  message: { maxWidth: 300, lineHeight: 19 },
});
