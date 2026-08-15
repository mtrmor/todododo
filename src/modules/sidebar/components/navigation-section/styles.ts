import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: { gap: 4 },
  workspace: {
    paddingTop: 16,
    paddingBottom: 5,
    paddingHorizontal: 8,
    color: colors.placeholder,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
