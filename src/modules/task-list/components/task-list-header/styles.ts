import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: { gap: 7, paddingHorizontal: 2, paddingBottom: 22 },
  title: { color: colors.ink, fontFamily: fonts.heading, fontWeight: "700", letterSpacing: -0.9 },
  titleCompact: { fontSize: 27, lineHeight: 34 },
  titleWide: { fontSize: 30, lineHeight: 38 },
  meta: {
    color: colors.mutedInk,
    fontFamily: fonts.body,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
