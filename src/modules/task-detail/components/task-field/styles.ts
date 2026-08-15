import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: { gap: 7 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: colors.ink, fontFamily: fonts.body, fontSize: 13, fontWeight: "600" },
  hint: {
    color: colors.placeholder,
    fontFamily: fonts.body,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
  error: { color: colors.danger, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
});
