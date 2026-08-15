import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  content: { gap: 19, paddingTop: 22, paddingBottom: 26 },
  contentNarrow: { paddingHorizontal: 18 },
  contentWide: { paddingHorizontal: 22 },
  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: 11,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    outlineColor: colors.focusRing,
    outlineOffset: 1,
  },
  inputError: { borderColor: colors.danger },
  notesInput: { minHeight: 148, paddingTop: 13, textAlignVertical: "top" },
  dateContainer: { position: "relative", justifyContent: "center" },
  dateIcon: { position: "absolute", left: 14, zIndex: 1 },
  dateInput: { paddingLeft: 42 },
});
