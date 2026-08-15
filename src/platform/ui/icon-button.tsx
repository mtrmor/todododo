import type { Icon } from "phosphor-react-native";
import { Pressable, type PressableProps, StyleSheet } from "react-native";

import { colors, layout, radii } from "@/platform/theme";

export type IconButtonProps = Omit<PressableProps, "accessibilityLabel" | "children"> & {
  icon: Icon;
  label: string;
  tone?: "default" | "danger" | "inverse";
  iconSize?: number;
};

const tones = {
  default: { color: colors.mutedInk, pressed: colors.lavenderSelection },
  danger: { color: colors.danger, pressed: colors.dangerSurface },
  inverse: { color: colors.paper, pressed: "rgba(255, 255, 255, 0.14)" },
} as const;

export function IconButton({
  icon: ButtonIcon,
  label,
  tone = "default",
  iconSize = 19,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const palette = tones[tone];

  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      hitSlop={4}
      style={(state) => [
        styles.button,
        state.pressed && { backgroundColor: palette.pressed },
        disabled && styles.disabled,
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <ButtonIcon aria-hidden color={palette.color} size={iconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: layout.minimumTargetSize,
    height: layout.minimumTargetSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    borderCurve: "continuous",
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  disabled: { opacity: 0.55, cursor: "auto" },
});
