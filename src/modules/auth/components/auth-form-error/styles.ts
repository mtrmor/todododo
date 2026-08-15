import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.dangerLine,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: colors.dangerSurface,
  },
  message: { flex: 1, color: colors.danger, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
});
