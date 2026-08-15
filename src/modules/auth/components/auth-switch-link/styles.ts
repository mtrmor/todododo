import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { color: colors.mutedInk, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  link: {
    minHeight: 44,
    justifyContent: "center",
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  linkPressed: { opacity: 0.6 },
  linkLabel: { color: colors.routeViolet, fontFamily: fonts.body, fontSize: 14, fontWeight: "600" },
});
