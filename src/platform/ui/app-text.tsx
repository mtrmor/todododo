import type { ComponentProps } from "react";
import { StyleSheet, Text } from "react-native";

import { colors, fonts } from "@/platform/theme";

export type AppTextProps = ComponentProps<typeof Text> & {
  variant?:
    | "body"
    | "bodyMedium"
    | "bodySemibold"
    | "label"
    | "caption"
    | "micro"
    | "heading"
    | "subheading";
  tone?: "default" | "muted" | "danger" | "warning" | "violet" | "inverse";
};

const styles = StyleSheet.create({
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  bodySemibold: { fontFamily: fonts.bodySemibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  micro: { fontFamily: fonts.body, fontSize: 10, lineHeight: 14 },
  heading: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 34 },
  subheading: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24 },
});

const toneColors = {
  default: colors.ink,
  muted: colors.mutedInk,
  danger: colors.danger,
  warning: colors.warning,
  violet: colors.routeViolet,
  inverse: colors.paper,
} as const;

export function AppText({ variant = "body", tone = "default", style, ...props }: AppTextProps) {
  return (
    <Text selectable {...props} style={[styles[variant], { color: toneColors[tone] }, style]} />
  );
}
