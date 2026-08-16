import { View } from "react-native";
import { styles } from "@/modules/task-collection/components/loading-rows/styles";
export function LoadingRows() {
  return (
    <View accessibilityLabel="Loading tasks" style={styles.container}>
      {Array.from({ length: 5 }, (_, index) => (
        <View key={index} style={[styles.row, { opacity: 1 - index * 0.12 }]} />
      ))}
    </View>
  );
}
