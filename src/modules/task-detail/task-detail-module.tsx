import { KeyboardAvoidingView, Modal, Pressable, View } from "react-native";
import { ConfirmationLayer } from "@/modules/task-detail/components/confirmation-layer/confirmation-layer";
import { DialogHeader } from "@/modules/task-detail/components/dialog-header/dialog-header";
import { LoadingState } from "@/modules/task-detail/components/loading-state/loading-state";
import { TaskForm } from "@/modules/task-detail/components/task-form/task-form";
import { useTaskDetailForm } from "@/modules/task-detail/hooks/use-task-detail-form";
import { styles } from "@/modules/task-detail/styles";

export function TaskDetailModule() {
  const form = useTaskDetailForm();
  return (
    <Modal
      accessibilityViewIsModal
      animationType="none"
      onRequestClose={form.handleModalRequestClose}
      presentationStyle="overFullScreen"
      transparent
      visible={form.visible}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={[styles.backdrop, form.narrow ? styles.backdropNarrow : styles.backdropWide]}>
          {!form.narrow ? (
            <Pressable
              accessibilityElementsHidden={form.confirmation !== null}
              accessibilityLabel="Close task details"
              accessibilityRole="button"
              importantForAccessibility={form.confirmation ? "no-hide-descendants" : "auto"}
              onPress={form.requestClose}
              style={styles.dismissArea}
            />
          ) : null}
          <View
            nativeID="task-detail-dialog"
            style={[
              styles.dialog,
              form.narrow ? styles.dialogNarrow : styles.dialogWide,
              form.narrow
                ? { height: form.height }
                : { maxHeight: Math.min(760, form.height - 48) },
            ]}
          >
            <DialogHeader
              busy={form.saving || form.deleting}
              confirmationVisible={form.confirmation !== null}
              editing={form.editing}
              narrow={form.narrow}
              onClose={form.requestClose}
            />
            {form.loading ? <LoadingState /> : <TaskForm {...form} />}
            {form.confirmation ? (
              <ConfirmationLayer
                busy={form.deleting}
                kind={form.confirmation}
                onCancel={form.dismissConfirmation}
                onConfirm={form.confirm}
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
