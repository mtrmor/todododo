import { FloppyDisk, Trash } from "phosphor-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { colors } from "@/platform";
import { styles } from "@/modules/task-detail/components/form-actions/styles";
type Props = {
  editing: boolean;
  narrow: boolean;
  saving: boolean;
  deleting: boolean;
  canSave: boolean;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
};
export function FormActions({
  editing,
  narrow,
  saving,
  deleting,
  canSave,
  onDelete,
  onCancel,
  onSave,
}: Props) {
  const busy = saving || deleting;
  const disabled = busy || !canSave;
  return (
    <View style={[styles.container, narrow ? styles.containerNarrow : styles.containerWide]}>
      {editing ? (
        <Pressable
          accessibilityLabel="Delete task"
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.delete,
            pressed && styles.deletePressed,
            disabled && styles.disabled,
          ]}
        >
          <Trash aria-hidden color={colors.danger} size={17} />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      ) : (
        <View />
      )}
      <View style={[styles.primaryActions, narrow && styles.primaryActionsNarrow]}>
        <Pressable
          accessibilityLabel="Cancel task changes"
          accessibilityRole="button"
          disabled={busy}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cancel,
            pressed && styles.cancelPressed,
            busy && styles.cursorDisabled,
          ]}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Save task"
          accessibilityRole="button"
          disabled={disabled}
          onPress={onSave}
          style={({ pressed }) => [
            styles.save,
            !narrow && styles.saveWide,
            pressed && styles.savePressed,
            disabled && styles.saveDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.paper} size="small" />
          ) : (
            <>
              <FloppyDisk aria-hidden color={colors.paper} size={17} weight="bold" />
              <Text style={styles.saveLabel}>Save task</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
