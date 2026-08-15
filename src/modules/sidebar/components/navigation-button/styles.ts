import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderCurve: "continuous",
    cursor: "pointer",
    outlineColor: colors.focusRing,
    outlineOffset: 1,
  },
  compact: { justifyContent: "center", paddingHorizontal: 0 },
  expanded: { justifyContent: "flex-start", paddingHorizontal: 9 },
  active: { backgroundColor: colors.lavenderSelection },
  hovered: { backgroundColor: colors.paper },
  disabled: { opacity: 0.5, cursor: "auto" },
  label: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 12, fontWeight: "500" },
  activeLabel: { color: colors.routeViolet },
  emphasizedLabel: { fontWeight: "600" },
  count: {
    color: colors.mutedInk,
    fontFamily: fonts.body,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
});
