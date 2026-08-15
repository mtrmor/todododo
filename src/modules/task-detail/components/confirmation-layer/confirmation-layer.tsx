import { Check, Trash, WarningCircle } from "phosphor-react-native";
import { Text, View } from "react-native";

import { colors } from "@/platform";
import type { ConfirmationKind } from "@/modules/task-detail/hooks/use-task-detail-form";
import { styles } from "@/modules/task-detail/components/confirmation-layer/styles";
import { Button } from "@/platform/ui";
export function ConfirmationLayer({
  kind,
  busy,
  onCancel,
  onConfirm,
}: {
  kind: Exclude<ConfirmationKind, null>;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const deleting = kind === "delete";
  return (
    <View
      accessibilityViewIsModal
      aria-labelledby="task-detail-confirmation-title"
      aria-modal
      nativeID="task-detail-confirmation"
      role="alertdialog"
      style={styles.overlay}
    >
      <View style={styles.dialog}>
        <View style={styles.header}>
          <View style={[styles.icon, deleting ? styles.deleteIcon : styles.discardIcon]}>
            {deleting ? (
              <Trash aria-hidden color={colors.danger} size={19} weight="duotone" />
            ) : (
              <WarningCircle aria-hidden color={colors.routeViolet} size={20} weight="duotone" />
            )}
          </View>
          <View style={styles.copy}>
            <Text nativeID="task-detail-confirmation-title" style={styles.title}>
              {deleting ? "Delete this task?" : "Discard your changes?"}
            </Text>
            <Text selectable style={styles.description}>
              {deleting
                ? "This permanently removes the task from your route."
                : "The changes in this form will not be saved."}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Button
            accessibilityLabel="Keep editing"
            disabled={busy}
            onPress={onCancel}
            variant="secondary"
          >
            Keep editing
          </Button>
          <Button
            accessibilityLabel={deleting ? "Delete task permanently" : "Discard changes"}
            disabled={busy}
            icon={Check}
            loading={busy}
            onPress={onConfirm}
            style={styles.confirm}
            variant={deleting ? "danger" : "primary"}
          >
            {deleting ? "Delete" : "Discard"}
          </Button>
        </View>
      </View>
    </View>
  );
}
