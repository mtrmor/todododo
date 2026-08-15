import { ListChecks, Plus } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/task-list/components/empty-state/styles";
export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <ListChecks aria-hidden color={colors.routeViolet} size={25} weight="duotone" />
      </View>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Your route is clear
        </Text>
        <Text selectable style={styles.description}>
          Add the next thing you want to move forward.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Create your first task"
        accessibilityRole="button"
        onPress={onCreate}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Plus aria-hidden color={colors.paper} size={16} weight="bold" />
        <Text style={styles.buttonLabel}>Create a task</Text>
      </Pressable>
    </View>
  );
}
