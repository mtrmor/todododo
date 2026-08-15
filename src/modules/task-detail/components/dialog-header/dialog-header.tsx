import { NotePencil, X } from "phosphor-react-native";
import { Text, View } from "react-native";

import { colors } from "@/platform";
import { styles } from "@/modules/task-detail/components/dialog-header/styles";
import { IconButton } from "@/platform/ui";
export function DialogHeader({
  editing,
  narrow,
  busy,
  confirmationVisible,
  onClose,
}: {
  editing: boolean;
  narrow: boolean;
  busy: boolean;
  confirmationVisible: boolean;
  onClose: () => void;
}) {
  return (
    <View
      accessibilityElementsHidden={confirmationVisible}
      importantForAccessibility={confirmationVisible ? "no-hide-descendants" : "auto"}
      style={[styles.container, narrow ? styles.narrow : styles.wide]}
    >
      <View style={styles.icon}>
        <NotePencil aria-hidden color={colors.routeViolet} size={20} weight="duotone" />
      </View>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {editing ? "Task details" : "New task"}
        </Text>
        <Text style={styles.subtitle}>
          {editing ? "Make the next step clearer." : "Add one clear thing to your route."}
        </Text>
      </View>
      <IconButton disabled={busy} icon={X} label="Close task details" onPress={onClose} />
    </View>
  );
}
