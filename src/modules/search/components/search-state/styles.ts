import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingLabel: { paddingTop: 10, color: colors.mutedInk, fontFamily: fonts.body, fontSize: 12 },
  empty: { alignItems: "center", gap: 8, paddingTop: 78 },
  icon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: colors.lavenderSelection,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    paddingTop: 5,
  },
  description: {
    maxWidth: 300,
    color: colors.mutedInk,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
