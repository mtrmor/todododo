import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  container: { gap: 10, paddingTop: 4 },
  containerNarrow: { flexDirection: "column-reverse", alignItems: "stretch" },
  containerWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  delete: { alignSelf: "flex-start" },
  primaryActions: { flexDirection: "row", alignItems: "stretch", gap: 9 },
  primaryActionsNarrow: { flexDirection: "column-reverse" },
  saveWide: { minWidth: 126 },
});
