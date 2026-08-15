import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    alignSelf: "flex-start",
    paddingHorizontal: 2,
    marginBottom: 8,
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  pressed: { opacity: 0.6 },
  label: { color: colors.routeViolet, fontFamily: fonts.body, fontSize: 13, fontWeight: "600" },
});
