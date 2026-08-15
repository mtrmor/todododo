import { StyleSheet } from "react-native";
import { colors } from "@/platform";
export const styles = StyleSheet.create({
  container: { gap: 7 },
  row: {
    height: 65,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: colors.railFog,
  },
});
