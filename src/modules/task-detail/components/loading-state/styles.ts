import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: { minHeight: 340, alignItems: "center", justifyContent: "center", gap: 12 },
  label: { color: colors.mutedInk, fontFamily: fonts.body, fontSize: 12 },
});
