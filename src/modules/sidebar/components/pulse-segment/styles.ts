import { StyleSheet } from "react-native";
import { colors } from "@/platform";
export const styles = StyleSheet.create({
  segment: { flex: 1, height: 3, borderRadius: 999 },
  active: { backgroundColor: colors.routeViolet },
  inactive: { backgroundColor: colors.placeholder },
});
