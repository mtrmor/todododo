import {
  CalendarBlank,
  Check,
  FloppyDisk,
  NotePencil,
  Trash,
  WarningCircle,
  X,
} from "phosphor-react-native";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import {
  colors,
  createTask,
  deleteTask,
  fonts,
  getErrorMessage,
  getTask,
  shadows,
  updateTask,
  type TaskDraft,
} from "@/core";
import {
  closeTask,
  getServerSnapshot,
  getSnapshot,
  markTasksChanged,
  subscribe,
} from "@/shared-state";

type FormValues = {
  title: string;
  notes: string;
  dueDate: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;
type ConfirmationKind = "discard" | "delete" | null;

const EMPTY_FORM: FormValues = { title: "", notes: "", dueDate: "" };

export function TaskDetailModule() {
  const { width, height } = useWindowDimensions();
  const { taskDialog } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const titleRef = useRef<TextInput>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const confirmationTriggerRef = useRef<HTMLElement | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedTaskId, setLoadedTaskId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationKind>(null);

  const visible = taskDialog !== null;
  const editing = taskDialog?.mode === "edit";
  const taskId = editing ? taskDialog.taskId : null;
  const narrow = width < 640;
  const canSave = !editing || loadedTaskId === taskId;
  const dirty =
    values.title !== baseline.title ||
    values.notes !== baseline.notes ||
    values.dueDate !== baseline.dueDate;

  useEffect(() => {
    if (!visible) return;
    if (typeof document !== "undefined") {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || loading) return;
    const timeout = setTimeout(() => titleRef.current?.focus(), 30);
    return () => clearTimeout(timeout);
  }, [loading, taskId, visible]);

  useEffect(() => {
    if (visible) return;
    previouslyFocusedRef.current?.focus?.();
    previouslyFocusedRef.current = null;
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof document === "undefined") return;

    const activeContainerId = confirmation
      ? "task-detail-confirmation"
      : "task-detail-dialog";
    const focusSelector =
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

    const focusFirst = window.setTimeout(() => {
      if (!confirmation) return;
      const container = document.getElementById(activeContainerId);
      const first = container?.querySelector<HTMLElement>(focusSelector);
      first?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const container = document.getElementById(activeContainerId);
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(focusSelector),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") && element.getClientRects().length > 0,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusFirst);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmation, visible]);

  useEffect(() => {
    fetchControllerRef.current?.abort();
    const timeout = setTimeout(() => {
      setFieldErrors({});
      setRequestError(null);
      setConfirmation(null);
      confirmationTriggerRef.current = null;
      setLoadedTaskId(null);
      setValues(EMPTY_FORM);
      setBaseline(EMPTY_FORM);

      if (!taskDialog || taskDialog.mode === "create") {
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      fetchControllerRef.current = controller;
      setLoading(true);

      void getTask(taskDialog.taskId, { signal: controller.signal })
        .then((task) => {
          const nextValues: FormValues = {
            title: task.title,
            notes: task.notes,
            dueDate: task.dueDate ?? "",
          };
          setValues(nextValues);
          setBaseline(nextValues);
          setLoadedTaskId(taskDialog.taskId);
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            setRequestError(getErrorMessage(error, "This task could not be opened."));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);

    return () => {
      clearTimeout(timeout);
      fetchControllerRef.current?.abort();
    };
  }, [taskDialog]);

  function showConfirmation(kind: Exclude<ConfirmationKind, null>) {
    if (typeof document !== "undefined") {
      confirmationTriggerRef.current = document.activeElement as HTMLElement | null;
    }
    setConfirmation(kind);
  }

  function dismissConfirmation() {
    const trigger = confirmationTriggerRef.current;
    confirmationTriggerRef.current = null;
    setConfirmation(null);

    if (typeof window !== "undefined" && trigger) {
      window.setTimeout(() => {
        if (trigger.isConnected) trigger.focus();
      }, 0);
    }
  }

  function requestClose() {
    if (saving || deleting) return;
    if (dirty) {
      showConfirmation("discard");
      return;
    }
    closeTask();
  }

  function handleModalRequestClose() {
    if (confirmation) {
      if (!deleting) dismissConfirmation();
      return;
    }
    requestClose();
  }

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function validate() {
    const nextErrors: FieldErrors = {};
    const title = values.title.trim();
    const notes = values.notes;
    const dueDate = values.dueDate.trim();

    if (!title) nextErrors.title = "Add a task title.";
    else if (title.length > 240) nextErrors.title = "Keep the title to 240 characters.";

    if (notes.length > 5000) nextErrors.notes = "Keep notes to 5,000 characters.";

    if (dueDate && !isValidIsoDate(dueDate)) {
      nextErrors.dueDate = "Use a real date in YYYY-MM-DD format.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function save() {
    if (saving || !canSave || !validate()) return;
    setSaving(true);
    setRequestError(null);

    const draft: TaskDraft = {
      title: values.title.trim(),
      notes: values.notes,
      dueDate: values.dueDate.trim() || null,
    };

    try {
      if (taskId) await updateTask(taskId, draft);
      else await createTask(draft);
      markTasksChanged();
      closeTask();
    } catch (error) {
      setRequestError(getErrorMessage(error, "The task could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!taskId || deleting) return;
    setDeleting(true);
    setRequestError(null);
    try {
      await deleteTask(taskId);
      markTasksChanged();
      closeTask();
    } catch (error) {
      dismissConfirmation();
      setRequestError(getErrorMessage(error, "The task could not be deleted."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      accessibilityViewIsModal
      animationType="none"
      onRequestClose={handleModalRequestClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            alignItems: narrow ? "stretch" : "center",
            justifyContent: narrow ? "flex-start" : "center",
            backgroundColor: narrow ? colors.paper : "rgba(29,26,43,0.26)",
            padding: narrow ? 0 : 24,
          }}
        >
          {!narrow ? (
            <Pressable
              accessibilityElementsHidden={confirmation !== null}
              accessibilityLabel="Close task details"
              accessibilityRole="button"
              importantForAccessibility={confirmation ? "no-hide-descendants" : "auto"}
              onPress={requestClose}
              style={{ position: "absolute", inset: 0, cursor: "auto" }}
            />
          ) : null}

          <View
            nativeID="task-detail-dialog"
            style={{
              width: "100%",
              maxWidth: narrow ? undefined : 560,
              height: narrow ? height : undefined,
              maxHeight: narrow ? undefined : Math.min(760, height - 48),
              overflow: "hidden",
              borderWidth: narrow ? 0 : 1,
              borderColor: colors.softLine,
              borderRadius: narrow ? 0 : 20,
              borderCurve: "continuous",
              backgroundColor: colors.paper,
              boxShadow: narrow ? undefined : shadows.floating,
            }}
          >
            <View
              accessibilityElementsHidden={confirmation !== null}
              importantForAccessibility={confirmation ? "no-hide-descendants" : "auto"}
              style={{
                minHeight: 68,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: narrow ? 18 : 22,
                borderBottomWidth: 1,
                borderBottomColor: colors.softLine,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 11,
                  borderCurve: "continuous",
                  backgroundColor: colors.lavenderSelection,
                }}
              >
                <NotePencil
                  aria-hidden
                  color={colors.routeViolet}
                  size={20}
                  weight="duotone"
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  accessibilityRole="header"
                  style={{
                    color: colors.ink,
                    fontFamily: fonts.heading,
                    fontSize: 18,
                    fontWeight: "700",
                    letterSpacing: -0.3,
                  }}
                >
                  {editing ? "Task details" : "New task"}
                </Text>
                <Text
                  style={{
                    color: colors.mutedInk,
                    fontFamily: fonts.body,
                    fontSize: 11,
                  }}
                >
                  {editing ? "Make the next step clearer." : "Add one clear thing to your route."}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close task details"
                accessibilityRole="button"
                disabled={saving || deleting}
                onPress={requestClose}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  opacity: pressed ? 0.55 : 1,
                  cursor: saving || deleting ? "auto" : "pointer",
                  outlineColor: colors.focusRing,
                })}
              >
                <X aria-hidden color={colors.mutedInk} size={20} />
              </Pressable>
            </View>

            {loading ? (
              <View style={{ minHeight: 340, alignItems: "center", justifyContent: "center", gap: 12 }}>
                <ActivityIndicator color={colors.routeViolet} size="small" />
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ color: colors.mutedInk, fontFamily: fonts.body, fontSize: 12 }}
                >
                  Opening task…
                </Text>
              </View>
            ) : (
              <ScrollView
                accessibilityElementsHidden={confirmation !== null}
                automaticallyAdjustKeyboardInsets
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{
                  gap: 19,
                  paddingHorizontal: narrow ? 18 : 22,
                  paddingTop: 22,
                  paddingBottom: 26,
                }}
                importantForAccessibility={confirmation ? "no-hide-descendants" : "auto"}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {requestError ? (
                  <View
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                    style={{
                      minHeight: 48,
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 9,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.dangerLine,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      backgroundColor: colors.dangerSurface,
                    }}
                  >
                    <WarningCircle aria-hidden color={colors.danger} size={18} weight="fill" />
                    <Text
                      selectable
                      style={{
                        flex: 1,
                        color: colors.danger,
                        fontFamily: fonts.body,
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                    >
                      {requestError}
                    </Text>
                  </View>
                ) : null}

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
                    style={inputStyle(Boolean(fieldErrors.title))}
                    value={values.title}
                  />
                </TaskField>

                <TaskField
                  label="Notes"
                  error={fieldErrors.notes}
                  counter={`${values.notes.length} / 5,000`}
                >
                  <TextInput
                    accessibilityLabel="Task notes"
                    aria-invalid={Boolean(fieldErrors.notes)}
                    maxLength={5000}
                    multiline
                    onChangeText={(value) => updateField("notes", value)}
                    placeholder="Context, links, or the definition of done"
                    placeholderTextColor={colors.placeholder}
                    selectionColor={colors.routeViolet}
                    style={[
                      inputStyle(Boolean(fieldErrors.notes)),
                      { minHeight: 148, paddingTop: 13, textAlignVertical: "top" },
                    ]}
                    value={values.notes}
                  />
                </TaskField>

                <TaskField
                  label="Due date"
                  error={fieldErrors.dueDate}
                  hint="YYYY-MM-DD"
                >
                  <View style={{ position: "relative", justifyContent: "center" }}>
                    <CalendarBlank
                      aria-hidden
                      color={colors.mutedInk}
                      size={17}
                      style={{ position: "absolute", left: 14, zIndex: 1 }}
                    />
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
                      style={[inputStyle(Boolean(fieldErrors.dueDate)), { paddingLeft: 42 }]}
                      value={values.dueDate}
                    />
                  </View>
                </TaskField>

                <View
                  style={{
                    flexDirection: narrow ? "column-reverse" : "row",
                    alignItems: narrow ? "stretch" : "center",
                    justifyContent: "space-between",
                    gap: 10,
                    paddingTop: 4,
                  }}
                >
                  {editing ? (
                    <Pressable
                      accessibilityLabel="Delete task"
                      accessibilityRole="button"
                      disabled={saving || deleting || !canSave}
                      onPress={() => showConfirmation("delete")}
                      style={({ pressed }) => ({
                        minHeight: 44,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingHorizontal: 14,
                        borderWidth: 1,
                        borderColor: colors.dangerLine,
                        borderRadius: 11,
                        borderCurve: "continuous",
                        backgroundColor: pressed ? colors.dangerSurface : colors.paper,
                        opacity: saving || deleting || !canSave ? 0.55 : 1,
                        cursor: saving || deleting || !canSave ? "auto" : "pointer",
                        outlineColor: colors.focusRing,
                      })}
                    >
                      <Trash aria-hidden color={colors.danger} size={17} />
                      <Text
                        style={{
                          color: colors.danger,
                          fontFamily: fonts.body,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        Delete
                      </Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}

                  <View
                    style={{
                      flexDirection: narrow ? "column-reverse" : "row",
                      alignItems: "stretch",
                      gap: 9,
                    }}
                  >
                    <Pressable
                      accessibilityLabel="Cancel task changes"
                      accessibilityRole="button"
                      disabled={saving || deleting}
                      onPress={requestClose}
                      style={({ pressed }) => ({
                        minHeight: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderColor: colors.softLine,
                        borderRadius: 11,
                        borderCurve: "continuous",
                        backgroundColor: pressed ? colors.railFog : colors.paper,
                        cursor: saving || deleting ? "auto" : "pointer",
                        outlineColor: colors.focusRing,
                      })}
                    >
                      <Text
                        style={{
                          color: colors.ink,
                          fontFamily: fonts.body,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Save task"
                      accessibilityRole="button"
                      disabled={saving || deleting || !canSave}
                      onPress={() => void save()}
                      style={({ pressed }) => ({
                        minHeight: 44,
                        minWidth: narrow ? undefined : 126,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingHorizontal: 18,
                        borderRadius: 11,
                        borderCurve: "continuous",
                        backgroundColor: pressed ? colors.routeVioletPressed : colors.routeViolet,
                        opacity: saving || deleting || !canSave ? 0.65 : 1,
                        cursor: saving || deleting || !canSave ? "auto" : "pointer",
                        outlineColor: colors.focusRing,
                        outlineOffset: 2,
                      })}
                    >
                      {saving ? (
                        <ActivityIndicator color={colors.paper} size="small" />
                      ) : (
                        <>
                          <FloppyDisk aria-hidden color={colors.paper} size={17} weight="bold" />
                          <Text
                            style={{
                              color: colors.paper,
                              fontFamily: fonts.body,
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            Save task
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            )}

            {confirmation ? (
              <ConfirmationLayer
                busy={deleting}
                kind={confirmation}
                onCancel={dismissConfirmation}
                onConfirm={() => {
                  if (confirmation === "delete") {
                    void remove();
                  } else {
                    confirmationTriggerRef.current = null;
                    closeTask();
                  }
                }}
              />
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TaskField({
  label,
  children,
  error,
  hint,
  counter,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  counter?: string;
  required?: boolean;
}) {
  return (
    <View style={{ gap: 7 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.body,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {label}{required ? " (required)" : ""}
        </Text>
        {counter || hint ? (
          <Text
            style={{
              color: colors.placeholder,
              fontFamily: fonts.body,
              fontSize: 10,
              fontVariant: ["tabular-nums"],
            }}
          >
            {counter ?? hint}
          </Text>
        ) : null}
      </View>
      {children}
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          selectable
          style={{
            color: colors.danger,
            fontFamily: fonts.body,
            fontSize: 11,
            lineHeight: 16,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function ConfirmationLayer({
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
  const deletingTask = kind === "delete";

  return (
    <View
      accessibilityViewIsModal
      aria-labelledby="task-detail-confirmation-title"
      aria-modal
      nativeID="task-detail-confirmation"
      role="alertdialog"
      style={{
        position: "absolute",
        inset: 0,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(29,26,43,0.34)",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 390,
          gap: 18,
          padding: 22,
          borderWidth: 1,
          borderColor: colors.softLine,
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: colors.paper,
          boxShadow: shadows.floating,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View
            style={{
              width: 38,
              height: 38,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              borderCurve: "continuous",
              backgroundColor: deletingTask ? colors.dangerSurface : colors.lavenderSelection,
            }}
          >
            {deletingTask ? (
              <Trash aria-hidden color={colors.danger} size={19} weight="duotone" />
            ) : (
              <WarningCircle aria-hidden color={colors.routeViolet} size={20} weight="duotone" />
            )}
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text
              nativeID="task-detail-confirmation-title"
              style={{
                color: colors.ink,
                fontFamily: fonts.heading,
                fontSize: 17,
                fontWeight: "700",
              }}
            >
              {deletingTask ? "Delete this task?" : "Discard your changes?"}
            </Text>
            <Text
              selectable
              style={{
                color: colors.mutedInk,
                fontFamily: fonts.body,
                fontSize: 13,
                lineHeight: 19,
              }}
            >
              {deletingTask
                ? "This permanently removes the task from your route."
                : "The changes in this form will not be saved."}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 9 }}>
          <Pressable
            accessibilityLabel="Keep editing"
            accessibilityRole="button"
            disabled={busy}
            onPress={onCancel}
            style={({ pressed }) => ({
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 15,
              borderWidth: 1,
              borderColor: colors.softLine,
              borderRadius: 11,
              borderCurve: "continuous",
              backgroundColor: pressed ? colors.railFog : colors.paper,
              cursor: busy ? "auto" : "pointer",
              outlineColor: colors.focusRing,
            })}
          >
            <Text
              style={{
                color: colors.ink,
                fontFamily: fonts.body,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Keep editing
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={deletingTask ? "Delete task permanently" : "Discard changes"}
            accessibilityRole="button"
            disabled={busy}
            onPress={onConfirm}
            style={({ pressed }) => ({
              minHeight: 44,
              minWidth: 116,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              paddingHorizontal: 15,
              borderRadius: 11,
              borderCurve: "continuous",
              backgroundColor: deletingTask
                ? pressed
                  ? colors.danger
                  : colors.danger
                : pressed
                  ? colors.routeVioletPressed
                  : colors.routeViolet,
              opacity: busy ? 0.65 : 1,
              cursor: busy ? "auto" : "pointer",
              outlineColor: colors.focusRing,
              outlineOffset: 2,
            })}
          >
            {busy ? (
              <ActivityIndicator color={colors.paper} size="small" />
            ) : (
              <>
                <Check aria-hidden color={colors.paper} size={16} weight="bold" />
                <Text
                  style={{
                    color: colors.paper,
                    fontFamily: fonts.body,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {deletingTask ? "Delete" : "Discard"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function inputStyle(hasError: boolean) {
  return {
    minHeight: 48,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: hasError ? colors.danger : colors.softLine,
    borderRadius: 11,
    borderCurve: "continuous" as const,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14,
    outlineColor: colors.focusRing,
    outlineOffset: 1,
  };
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
