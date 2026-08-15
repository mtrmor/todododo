import { ActivityIndicator, View } from "react-native";

import { AppText } from "@/root/ui/app-text";
import { colors, spacing } from "@/platform/theme";

type ScreenStateProps = Readonly<{ title?: string; message?: string; loading?: boolean }>;

export function ScreenState({ title, message, loading = false }: ScreenStateProps) {
  return (
    <View accessibilityRole={loading ? "progressbar" : undefined} style={{ alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl }}>
      {loading ? <ActivityIndicator color={colors.routeViolet} /> : null}
      {title ? <AppText variant="bodySemibold">{title}</AppText> : null}
      {message ? <AppText tone="muted" style={{ textAlign: "center" }}>{message}</AppText> : null}
    </View>
  );
}
