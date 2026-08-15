import { StyleSheet } from "react-native";
import { colors } from "@/platform";

export const styles = StyleSheet.create({
  sidebar: { height: "100%", backgroundColor: colors.railFog },
  sidebarBorder: { borderRightWidth: 1, borderRightColor: colors.softLine },
  content: {
    minHeight: "100%",
    justifyContent: "space-between",
    gap: 24,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
  },
  contentCompact: { paddingHorizontal: 10 },
  primaryContent: { gap: 16 },
});
