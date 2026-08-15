import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: { gap: 4 },
  summaryError: {
    paddingHorizontal: 9,
    paddingBottom: 6,
    color: colors.warning,
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
  },
  signOutError: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
  },
  compactError: { minHeight: 32, alignItems: "center", justifyContent: "center" },
});
