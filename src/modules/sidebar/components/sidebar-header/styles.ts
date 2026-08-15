import { StyleSheet } from "react-native";
import { colors, fonts, shadows } from "@/platform";
export const styles = StyleSheet.create({
  header: { minHeight: 44, flexDirection: "row", alignItems: "center" },
  headerExpanded: { justifyContent: "space-between", paddingHorizontal: 4 },
  headerCompact: { justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  icon: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderCurve: "continuous",
    backgroundColor: colors.routeViolet,
    boxShadow: shadows.subtle,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  closePressed: { opacity: 0.58 },
});
