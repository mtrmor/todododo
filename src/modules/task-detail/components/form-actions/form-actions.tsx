import { FloppyDisk, Trash } from "phosphor-react-native";
import { View } from "react-native";

import { styles } from "@/modules/task-detail/components/form-actions/styles";
import { Button } from "@/platform/ui";
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
        <Button
          disabled={disabled}
          icon={Trash}
          onPress={onDelete}
          style={styles.delete}
          variant="dangerOutline"
        >
          Delete
        </Button>
      ) : (
        <View />
      )}
      <View style={[styles.primaryActions, narrow && styles.primaryActionsNarrow]}>
        <Button
          accessibilityLabel="Cancel task changes"
          disabled={busy}
          onPress={onCancel}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          disabled={disabled}
          icon={FloppyDisk}
          loading={saving}
          onPress={onSave}
          style={!narrow ? styles.saveWide : undefined}
        >
          Save task
        </Button>
      </View>
    </View>
  );
}
