import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  muted: { opacity: 0.6 },
  disabled: { cursor: "auto" },
  label: { color: colors.routeViolet, fontFamily: fonts.body, fontSize: 13, fontWeight: "600" },
});
