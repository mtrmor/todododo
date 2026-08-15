import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  routeTitle: {
    color: colors.paper,
    fontFamily: fonts.heading,
    fontSize: 43,
    fontWeight: "700",
    letterSpacing: -1.7,
    lineHeight: 49,
  },
  routeDescription: {
    maxWidth: 350,
    color: colors.inkOnDarkMuted,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
  },
  routeFooter: { color: colors.inkOnDarkMuted, fontFamily: fonts.body, fontSize: 12 },
  formTitle: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.9,
    lineHeight: 42,
  },
  compactTitle: {
    color: colors.ink,
    fontFamily: fonts.heading,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.9,
    lineHeight: 38,
  },
  formDescription: { color: colors.mutedInk, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
});
