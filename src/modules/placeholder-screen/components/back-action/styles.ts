import { StyleSheet } from "react-native";

import { colors, fonts } from "@/platform";

export const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: colors.routeViolet,
    cursor: "pointer",
    outlineColor: colors.focusRing,
    outlineOffset: 2,
  },
  buttonPressed: { backgroundColor: colors.routeVioletPressed },
  label: { color: colors.paper, fontFamily: fonts.body, fontSize: 14, fontWeight: "600" },
});
