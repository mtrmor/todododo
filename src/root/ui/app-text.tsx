import type { ComponentProps } from "react";
import { Text } from "react-native";

import { colors, fonts } from "@/platform/theme";

export type AppTextProps = ComponentProps<typeof Text> & {
  variant?: "body" | "bodyMedium" | "bodySemibold" | "heading" | "caption";
  tone?: "default" | "muted" | "danger" | "violet";
};

const variantStyles = {
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  bodySemibold: { fontFamily: fonts.bodySemibold, fontSize: 15, lineHeight: 22 },
  heading: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 34 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
} as const;

const toneColors = {
  default: colors.ink,
  muted: colors.mutedInk,
  danger: colors.danger,
  violet: colors.routeViolet,
} as const;

export function AppText({ variant = "body", tone = "default", style, ...props }: AppTextProps) {
  return (
    <Text
      selectable
      {...props}
      style={[variantStyles[variant], { color: toneColors[tone] }, style]}
    />
  );
}
