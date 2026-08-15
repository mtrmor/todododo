import { StyleSheet } from "react-native";
import { colors, fonts } from "@/platform";
export const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
    paddingLeft: 13,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
  },
  offline: { borderColor: colors.softLine, backgroundColor: colors.railFog },
  error: { borderColor: colors.dangerLine, backgroundColor: colors.dangerSurface },
  message: { flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  offlineMessage: { color: colors.mutedInk },
  errorMessage: { color: colors.danger },
  retry: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    outlineColor: colors.focusRing,
  },
  retryPressed: { opacity: 0.55 },
});
