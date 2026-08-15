import { StyleSheet } from "react-native";

import { colors } from "@/platform";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.railFog },
  scrollContent: { flexGrow: 1 },
  layout: { flex: 1, minHeight: 760, flexDirection: "row" },
  layoutCompact: { minHeight: 700, flexDirection: "column" },
  routePanel: {
    width: "42%",
    minWidth: 390,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: 54,
    paddingVertical: 48,
    backgroundColor: colors.ink,
  },
  routeCopy: { maxWidth: 400, gap: 28 },
  routeHeadingGroup: { gap: 13 },
  routeSteps: { gap: 11 },
  formPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    paddingVertical: 54,
    backgroundColor: colors.paper,
  },
  formPanelCompact: { paddingHorizontal: 20, paddingVertical: 28 },
  formContainer: { width: "100%", maxWidth: 420, gap: 31 },
  formHeadingGroup: { gap: 9 },
  formFields: { gap: 18 },
  submitAction: { width: "100%" },
});
