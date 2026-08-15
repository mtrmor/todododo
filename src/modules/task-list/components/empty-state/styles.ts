import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 15, paddingHorizontal: 20, paddingTop: 74 },
  icon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderCurve: "continuous",
    backgroundColor: colors.lavenderSelection,
  },
  copy: { alignItems: "center", gap: 5 },
  title: { color: colors.ink, fontFamily: fonts.heading, fontSize: 18, fontWeight: "700" },
  description: {
    maxWidth: 290,
    color: colors.mutedInk,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 11,
    borderCurve: "continuous",
    backgroundColor: colors.routeViolet,
    cursor: "pointer",
    outlineColor: colors.focusRing,
    outlineOffset: 2,
  },
  buttonPressed: { backgroundColor: colors.routeVioletPressed },
  buttonLabel: { color: colors.paper, fontFamily: fonts.body, fontSize: 13, fontWeight: "600" },
});
