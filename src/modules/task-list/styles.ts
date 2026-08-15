import { StyleSheet } from "react-native";
import { colors } from "@/platform";
export const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: colors.paper },
  content: { width: "100%", maxWidth: 640, flex: 1 },
  contentCompact: { paddingHorizontal: 18, paddingTop: 24 },
  contentWide: { paddingHorizontal: 20, paddingTop: 42 },
  fill: { flex: 1 },
  listContent: { gap: 7, paddingBottom: 48 },
});
