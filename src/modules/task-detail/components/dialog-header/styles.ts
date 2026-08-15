import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.softLine,
  },
  narrow: { paddingHorizontal: 18 },
  wide: { paddingHorizontal: 22 },
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderCurve: "continuous",
    backgroundColor: colors.lavenderSelection,
  },
  copy: { flex: 1, gap: 2 },
  title: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: { color: colors.mutedInk, fontFamily: fonts.body, fontSize: 11 },
});
