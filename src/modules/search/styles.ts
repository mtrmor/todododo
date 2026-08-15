import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: colors.paper },
  content: { width: "100%", maxWidth: 640, flex: 1 },
  contentCompact: { paddingHorizontal: 18, paddingTop: 24 },
  contentWide: { paddingHorizontal: 20, paddingTop: 42 },
  header: { gap: 18, paddingBottom: 14 },
  addAction: { alignSelf: "flex-start", marginBottom: 8 },
  title: { color: colors.ink, fontFamily: fonts.heading, fontWeight: "700", letterSpacing: -0.9 },
  titleCompact: { fontSize: 27, lineHeight: 34 },
  titleWide: { fontSize: 30, lineHeight: 38 },
  fill: { flex: 1 },
  screenState: { flex: 1 },
  listContent: { gap: 7, paddingBottom: 48 },
  paginationAction: { marginTop: 4 },
  resultCount: {
    paddingHorizontal: 2,
    paddingBottom: 4,
    color: colors.mutedInk,
    fontFamily: fonts.body,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
