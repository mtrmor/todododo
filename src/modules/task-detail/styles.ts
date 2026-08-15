import { StyleSheet } from "react-native";
import { colors, shadows } from "@/platform";
export const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  backdrop: { flex: 1 },
  backdropNarrow: {
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: colors.paper,
  },
  backdropWide: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(29,26,43,0.26)",
    padding: 24,
  },
  dismissArea: { position: "absolute", inset: 0, cursor: "auto" },
  dialog: { width: "100%", overflow: "hidden", backgroundColor: colors.paper },
  dialogNarrow: { borderWidth: 0, borderRadius: 0 },
  dialogWide: {
    maxWidth: 560,
    borderWidth: 1,
    borderColor: colors.softLine,
    borderRadius: 20,
    borderCurve: "continuous",
    boxShadow: shadows.floating,
  },
  loadingState: { minHeight: 340 },
});
