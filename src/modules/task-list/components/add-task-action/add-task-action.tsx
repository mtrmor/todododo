import { Plus } from "phosphor-react-native";
import { Pressable, Text } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/task-list/components/add-task-action/styles";
export function AddTaskAction({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Add task"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Plus aria-hidden color={colors.routeViolet} size={17} weight="bold" />
      <Text style={styles.label}>Add task</Text>
    </Pressable>
  );
}
