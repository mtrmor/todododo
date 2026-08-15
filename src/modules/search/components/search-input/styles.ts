import { StyleSheet } from "react-native";
import { colors, fonts, shadows } from "@/platform";
export const styles = StyleSheet.create({
  container: { position: "relative", justifyContent: "center" },
  searchIcon: { position: "absolute", left: 14, zIndex: 1 },
  input: {
    minHeight: 48,
    paddingLeft: 43,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    boxShadow: shadows.subtle,
    outlineColor: colors.focusRing,
    outlineOffset: 1,
  },
  inputWithClear: { paddingRight: 50 },
  clear: {
    position: "absolute",
    right: 2,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  clearPressed: { opacity: 0.58 },
});
