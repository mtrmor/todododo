import type { Icon, IconWeight } from "phosphor-react-native";
import { ActivityIndicator, Pressable, type PressableProps, StyleSheet } from "react-native";

import { colors, layout, radii, spacing } from "@/platform/theme";
import { AppText } from "@/platform/ui/app-text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerOutline";
export type ButtonSize = "regular" | "large";

export type ButtonProps = Omit<PressableProps, "children"> & {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: Icon;
  iconPosition?: "leading" | "trailing";
  iconWeight?: IconWeight;
  loading?: boolean;
};

const palettes = {
  primary: {
    background: colors.routeViolet,
    pressed: colors.routeVioletPressed,
    border: colors.routeViolet,
    text: colors.paper,
  },
  secondary: {
    background: colors.paper,
    pressed: colors.railFog,
    border: colors.softLine,
    text: colors.ink,
  },
  ghost: {
    background: "transparent",
    pressed: colors.lavenderSelection,
    border: "transparent",
    text: colors.routeViolet,
  },
  danger: {
    background: colors.danger,
    pressed: "#8E1D18",
    border: colors.danger,
    text: colors.paper,
  },
  dangerOutline: {
    background: colors.paper,
    pressed: colors.dangerSurface,
    border: colors.dangerLine,
    text: colors.danger,
  },
} as const;

export function Button({
  children,
  variant = "primary",
  size = "regular",
  icon: ButtonIcon,
  iconPosition = "leading",
  iconWeight = "bold",
  loading = false,
  disabled,
  style,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const palette = palettes[variant];
  const unavailable = Boolean(disabled || loading);
  const iconSize = size === "large" ? 17 : 16;
  const icon = ButtonIcon ? (
    <ButtonIcon aria-hidden color={palette.text} size={iconSize} weight={iconWeight} />
  ) : null;

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      style={(state) => [
        styles.base,
        size === "large" ? styles.large : styles.regular,
        {
          borderColor: palette.border,
          backgroundColor: state.pressed ? palette.pressed : palette.background,
        },
        unavailable && styles.unavailable,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <>
          {iconPosition === "leading" ? icon : null}
          <AppText
            selectable={false}
            style={{ color: palette.text }}
            variant={size === "large" ? "bodySemibold" : "label"}
          >
            {children}
          </AppText>
          {iconPosition === "trailing" ? icon : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minimumTargetSize,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    borderCurve: "continuous",
    cursor: "pointer",
    outlineColor: colors.focusRing,
    outlineOffset: 2,
  },
  regular: { minHeight: 44, paddingHorizontal: spacing.md },
  large: { minHeight: 48, paddingHorizontal: 18 },
  unavailable: { opacity: 0.6, cursor: "auto" },
});
