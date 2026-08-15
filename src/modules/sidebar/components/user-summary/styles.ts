import { StyleSheet } from "react-native";
import { colors, fonts, shadows } from "@/platform";
export const styles = StyleSheet.create({
  container: { gap: 10 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 5 },
  avatar: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.softLine,
  },
  avatarLabel: {
    color: colors.routeViolet,
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: "700",
  },
  email: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 12, fontWeight: "600" },
  progressCard: {
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    boxShadow: shadows.subtle,
  },
  progressCopy: { gap: 2 },
  progressTitle: { color: colors.ink, fontFamily: fonts.body, fontSize: 11, fontWeight: "600" },
  progressMeta: {
    color: colors.mutedInk,
    fontFamily: fonts.body,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
});
