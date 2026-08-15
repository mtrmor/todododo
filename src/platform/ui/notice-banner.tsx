import { WarningCircle, type Icon } from "phosphor-react-native";
import { StyleSheet, View, type ViewStyle, type StyleProp } from "react-native";

import { colors, radii, spacing } from "@/platform/theme";
import { AppText } from "@/platform/ui/app-text";
import { IconButton } from "@/platform/ui/icon-button";

export type NoticeBannerTone = "neutral" | "warning" | "error";
export type NoticeBannerAction = Readonly<{ icon: Icon; label: string; onPress: () => void }>;

export type NoticeBannerProps = Readonly<{
  message: string;
  tone?: NoticeBannerTone;
  icon?: Icon;
  action?: NoticeBannerAction;
  style?: StyleProp<ViewStyle>;
}>;

const palettes = {
  neutral: {
    border: colors.softLine,
    background: colors.railFog,
    text: colors.mutedInk,
  },
  warning: {
    border: colors.softLine,
    background: colors.railFog,
    text: colors.warning,
  },
  error: {
    border: colors.dangerLine,
    background: colors.dangerSurface,
    text: colors.danger,
  },
} as const;

export function NoticeBanner({
  message,
  tone = "neutral",
  icon: NoticeIcon = WarningCircle,
  action,
  style,
}: NoticeBannerProps) {
  const palette = palettes[tone];

  return (
    <View
      accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
      accessibilityRole="alert"
      style={[
        styles.container,
        { borderColor: palette.border, backgroundColor: palette.background },
        style,
      ]}
    >
      <NoticeIcon aria-hidden color={palette.text} size={18} weight="fill" />
      <AppText
        style={styles.message}
        tone={tone === "error" ? "danger" : tone === "warning" ? "warning" : "muted"}
        variant="caption"
      >
        {message}
      </AppText>
      {action ? (
        <IconButton icon={action.icon} label={action.label} onPress={action.onPress} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: 2,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: radii.md,
    borderCurve: "continuous",
  },
  message: { flex: 1 },
});
