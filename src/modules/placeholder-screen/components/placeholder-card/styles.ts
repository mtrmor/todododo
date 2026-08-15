import { StyleSheet } from "react-native";

import { colors, fonts, shadows } from "@/platform";

export const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 28,
    paddingVertical: 36,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    boxShadow: shadows.subtle,
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: colors.lavenderSelection,
  },
  copy: { alignItems: "center", gap: 7 },
  title: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  description: {
    maxWidth: 330,
    color: colors.mutedInk,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  backAction: { alignSelf: "center" },
});
