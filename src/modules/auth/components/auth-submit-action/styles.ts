import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: colors.routeViolet,
    cursor: "pointer",
    outlineColor: colors.focusRing,
    outlineOffset: 2,
  },
  pressed: { backgroundColor: colors.routeVioletPressed },
  disabled: { opacity: 0.72, cursor: "auto" },
  label: { color: colors.paper, fontFamily: fonts.body, fontSize: 14, fontWeight: "600" },
});
