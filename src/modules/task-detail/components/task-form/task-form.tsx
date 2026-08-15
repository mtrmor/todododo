import { CalendarBlank, WarningCircle } from "phosphor-react-native";
import { ScrollView } from "react-native";

import { FormActions } from "@/modules/task-detail/components/form-actions/form-actions";
import type { useTaskDetailForm } from "@/modules/task-detail/hooks/use-task-detail-form";
import { styles } from "@/modules/task-detail/components/task-form/styles";
import { NoticeBanner, TextField } from "@/platform/ui";

type Form = ReturnType<typeof useTaskDetailForm>;
type Props = Pick<
  Form,
  | "confirmation"
  | "narrow"
  | "editing"
  | "saving"
  | "deleting"
  | "canSave"
  | "values"
  | "fieldErrors"
  | "requestError"
  | "titleRef"
  | "updateField"
  | "requestClose"
  | "showConfirmation"
  | "save"
>;
export function TaskForm({
  confirmation,
  narrow,
  editing,
  saving,
  deleting,
  canSave,
  values,
  fieldErrors,
  requestError,
  titleRef,
  updateField,
  requestClose,
  showConfirmation,
  save,
}: Props) {
  return (
    <ScrollView
      accessibilityElementsHidden={confirmation !== null}
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, narrow ? styles.contentNarrow : styles.contentWide]}
      importantForAccessibility={confirmation ? "no-hide-descendants" : "auto"}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {requestError ? (
        <NoticeBanner icon={WarningCircle} message={requestError} tone="error" />
      ) : null}
      <TextField
        accessibilityLabel="Task title"
        autoCapitalize="sentences"
        autoFocus={!editing}
        error={fieldErrors.title}
        inputRef={titleRef}
        label="Title"
        maxLength={240}
        onChangeText={(value) => updateField("title", value)}
        placeholder="What needs to move forward?"
        required
        returnKeyType="next"
        value={values.title}
      />
      <TextField
        accessibilityLabel="Task notes"
        counter={`${values.notes.length} / 5,000`}
        error={fieldErrors.notes}
        inputStyle={styles.notesInput}
        label="Notes"
        maxLength={5000}
        multiline
        onChangeText={(value) => updateField("notes", value)}
        placeholder="Context, links, or the definition of done"
        value={values.notes}
      />
      <TextField
        accessibilityLabel="Due date, YYYY-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
        error={fieldErrors.dueDate}
        hint="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        label="Due date"
        leadingIcon={CalendarBlank}
        maxLength={10}
        onChangeText={(value) => updateField("dueDate", value)}
        placeholder="YYYY-MM-DD"
        returnKeyType="done"
        value={values.dueDate}
      />
      <FormActions
        editing={editing}
        narrow={narrow}
        saving={saving}
        deleting={deleting}
        canSave={canSave}
        onDelete={() => showConfirmation("delete")}
        onCancel={requestClose}
        onSave={() => void save()}
      />
    </ScrollView>
  );
}
