import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";

export const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderCurve: "continuous",
  },
  iconInverted: { backgroundColor: colors.routeViolet },
  iconDefault: { backgroundColor: colors.lavenderSelection },
  label: { fontFamily: fonts.heading, fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  labelInverted: { color: colors.paper },
  labelDefault: { color: colors.ink },
});
