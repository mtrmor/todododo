import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";

export const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 11 },
  icon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderCurve: "continuous",
  },
  iconActive: { backgroundColor: colors.routeViolet },
  iconInactive: { backgroundColor: colors.inkRaised },
  label: { color: colors.paper, fontFamily: fonts.body, fontSize: 14, fontWeight: "500" },
});
