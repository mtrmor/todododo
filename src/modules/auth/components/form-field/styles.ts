import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";

export const styles = StyleSheet.create({
  container: { gap: 7 },
  label: { color: colors.ink, fontFamily: fonts.body, fontSize: 13, fontWeight: "600" },
  inputContainer: { position: "relative", justifyContent: "center" },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    outlineColor: colors.focusRing,
    outlineOffset: 1,
  },
  inputWithAction: { paddingRight: 50 },
  inputError: { borderColor: colors.danger },
  trailingAction: {
    position: "absolute",
    right: 2,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  trailingActionPressed: { opacity: 0.62 },
  error: { color: colors.danger, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
});
