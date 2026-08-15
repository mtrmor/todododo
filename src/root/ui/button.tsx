import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, type PressableProps } from "react-native";

import { AppText } from "@/root/ui/app-text";
import { colors, layout, radii, spacing } from "@/core/theme";

type ButtonProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};

const variants = {
  primary: { background: colors.routeViolet, pressed: colors.routeVioletPressed, border: colors.routeViolet, text: colors.white },
  secondary: { background: colors.paper, pressed: colors.railFog, border: colors.softLine, text: colors.ink },
  ghost: { background: "transparent", pressed: colors.lavenderSelection, border: "transparent", text: colors.routeViolet },
  danger: { background: colors.danger, pressed: "#8E1D18", border: colors.danger, text: colors.white },
} as const;

export function Button({ children, variant = "primary", loading = false, disabled, style, ...props }: ButtonProps) {
  const palette = variants[variant];
  const unavailable = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      {...props}
      style={(state) => [
        {
          minHeight: layout.minimumTargetSize,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: state.pressed ? palette.pressed : palette.background,
          opacity: unavailable ? 0.55 : 1,
        },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading ? <ActivityIndicator color={palette.text} size="small" /> : null}
      <AppText variant="bodySemibold" style={{ color: palette.text }}>{children}</AppText>
    </Pressable>
  );
}
