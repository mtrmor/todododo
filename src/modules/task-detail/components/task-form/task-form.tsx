import { CalendarBlank } from "phosphor-react-native";
import { ScrollView, TextInput, View } from "react-native";
import { colors } from "@/platform";
import { FormActions } from "@/modules/task-detail/components/form-actions/form-actions";
import { RequestError } from "@/modules/task-detail/components/request-error/request-error";
import { TaskField } from "@/modules/task-detail/components/task-field/task-field";
import type { useTaskDetailForm } from "@/modules/task-detail/hooks/use-task-detail-form";
import { styles } from "@/modules/task-detail/components/task-form/styles";

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
      {requestError ? <RequestError message={requestError} /> : null}
      <TaskField label="Title" error={fieldErrors.title} required>
        <TextInput
          accessibilityLabel="Task title"
          aria-invalid={Boolean(fieldErrors.title)}
          autoCapitalize="sentences"
          autoFocus={!editing}
          maxLength={240}
          onChangeText={(value) => updateField("title", value)}
          placeholder="What needs to move forward?"
          placeholderTextColor={colors.placeholder}
          ref={titleRef}
          returnKeyType="next"
          selectionColor={colors.routeViolet}
          style={[styles.input, fieldErrors.title && styles.inputError]}
          value={values.title}
        />
      </TaskField>
      <TaskField label="Notes" error={fieldErrors.notes} counter={`${values.notes.length} / 5,000`}>
        <TextInput
          accessibilityLabel="Task notes"
          aria-invalid={Boolean(fieldErrors.notes)}
          maxLength={5000}
          multiline
          onChangeText={(value) => updateField("notes", value)}
          placeholder="Context, links, or the definition of done"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.routeViolet}
          style={[styles.input, styles.notesInput, fieldErrors.notes && styles.inputError]}
          value={values.notes}
        />
      </TaskField>
      <TaskField label="Due date" error={fieldErrors.dueDate} hint="YYYY-MM-DD">
        <View style={styles.dateContainer}>
          <CalendarBlank aria-hidden color={colors.mutedInk} size={17} style={styles.dateIcon} />
          <TextInput
            accessibilityLabel="Due date, YYYY-MM-DD"
            aria-invalid={Boolean(fieldErrors.dueDate)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={(value) => updateField("dueDate", value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            selectionColor={colors.routeViolet}
            style={[styles.input, styles.dateInput, fieldErrors.dueDate && styles.inputError]}
            value={values.dueDate}
          />
        </View>
      </TaskField>
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
