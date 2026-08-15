import { useEffect, useEffectEvent, useRef, useState } from "react";
import { TextInput, useWindowDimensions } from "react-native";

import { getErrorMessage, type TaskDraft } from "@/platform";
import { useTaskDetailController } from "@/modules/task-detail/task-detail-controller-context";
import { useTask, useTaskDialog, useTaskDialogActions } from "@/shared-state";

export type FormValues = { title: string; notes: string; dueDate: string };
export type FieldErrors = Partial<Record<keyof FormValues, string>>;
export type ConfirmationKind = "discard" | "delete" | null;
const EMPTY_FORM: FormValues = { title: "", notes: "", dueDate: "" };

export function useTaskDetailForm() {
  const taskDetailController = useTaskDetailController();
  const { closeTask } = useTaskDialogActions();
  const { width, height } = useWindowDimensions();
  const taskDialog = useTaskDialog();
  const titleRef = useRef<TextInput>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const confirmationTriggerRef = useRef<HTMLElement | null>(null);
  const requestIdRef = useRef(0);
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
  const cachedTask = useTask(taskId);
  const narrow = width < 640;
  const canSave = !editing || loadedTaskId === taskId;
  const dirty =
    values.title !== baseline.title ||
    values.notes !== baseline.notes ||
    values.dueDate !== baseline.dueDate;

  useEffect(() => {
    if (visible && typeof document !== "undefined") {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }
  }, [visible]);
  useEffect(() => {
    if (!visible || loading) {
      return;
    }

    const timeout = setTimeout(() => titleRef.current?.focus(), 30);
    return () => clearTimeout(timeout);
  }, [loading, taskId, visible]);
  useEffect(() => {
    if (!visible) {
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [visible]);
  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      return;
    }

    const activeContainerId = confirmation ? "task-detail-confirmation" : "task-detail-dialog";
    const focusSelector =
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
    const focusFirst = window.setTimeout(() => {
      if (!confirmation) {
        return;
      }

      document
        .getElementById(activeContainerId)
        ?.querySelector<HTMLElement>(focusSelector)
        ?.focus();
    }, 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const container = document.getElementById(activeContainerId);

      if (!container) {
        return;
      }

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusSelector)).filter(
        (element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0,
      );

      if (focusable.length === 0) {
        return;
      }

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

  const loadDialogTask = useEffectEvent((dialog: typeof taskDialog) => {
    const requestId = ++requestIdRef.current;
    setFieldErrors({});
    setRequestError(null);
    setConfirmation(null);
    confirmationTriggerRef.current = null;
    setLoadedTaskId(null);
    setValues(EMPTY_FORM);
    setBaseline(EMPTY_FORM);

    if (!dialog || dialog.mode === "create") {
      setLoading(false);
      return;
    }

    const applyTask = (task: NonNullable<typeof cachedTask>) => {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const nextValues: FormValues = {
        title: task.title,
        notes: task.notes,
        dueDate: task.dueDate ?? "",
      };
      setValues(nextValues);
      setBaseline(nextValues);
      setLoadedTaskId(dialog.taskId);
    };

    if (cachedTask) {
      applyTask(cachedTask);
      setLoading(false);
      return;
    }

    setLoading(true);
    void taskDetailController
      .load(dialog.taskId)
      .then(applyTask)
      .catch((error) => {
        if (requestId === requestIdRef.current) {
          setRequestError(getErrorMessage(error, "This task could not be opened."));
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  });
  useEffect(() => {
    const timeout = setTimeout(() => loadDialogTask(taskDialog), 0);
    return () => {
      clearTimeout(timeout);
      requestIdRef.current += 1;
      taskDetailController.cancelLoad();
    };
  }, [taskDetailController, taskDialog]);

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
        if (trigger.isConnected) {
          trigger.focus();
        }
      }, 0);
    }
  }
  function requestClose() {
    if (saving || deleting) {
      return;
    }

    if (dirty) {
      showConfirmation("discard");
    } else {
      closeTask();
    }
  }
  function handleModalRequestClose() {
    if (confirmation) {
      if (!deleting) {
        dismissConfirmation();
      }

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
    const dueDate = values.dueDate.trim();

    if (!title) {
      nextErrors.title = "Add a task title.";
    } else if (title.length > 240) {
      nextErrors.title = "Keep the title to 240 characters.";
    }

    if (values.notes.length > 5000) {
      nextErrors.notes = "Keep notes to 5,000 characters.";
    }

    if (dueDate && !isValidIsoDate(dueDate)) {
      nextErrors.dueDate = "Use a real date in YYYY-MM-DD format.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }
  async function save() {
    if (saving || !canSave || !validate()) {
      return;
    }

    setSaving(true);
    setRequestError(null);
    const draft: TaskDraft = {
      title: values.title.trim(),
      notes: values.notes,
      dueDate: values.dueDate.trim() || null,
    };
    try {
      if (taskId) {
        await taskDetailController.update(taskId, draft);
      } else {
        await taskDetailController.create(draft);
      }

      closeTask();
    } catch (error) {
      setRequestError(getErrorMessage(error, "The task could not be saved."));
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!taskId || deleting) {
      return;
    }

    setDeleting(true);
    setRequestError(null);
    try {
      await taskDetailController.delete(taskId);
      closeTask();
    } catch (error) {
      dismissConfirmation();
      setRequestError(getErrorMessage(error, "The task could not be deleted."));
    } finally {
      setDeleting(false);
    }
  }
  function confirm() {
    if (confirmation === "delete") {
      void remove();
    } else {
      confirmationTriggerRef.current = null;
      closeTask();
    }
  }

  return {
    visible,
    editing,
    narrow,
    height,
    loading,
    saving,
    deleting,
    canSave,
    confirmation,
    values,
    fieldErrors,
    requestError,
    titleRef,
    updateField,
    requestClose,
    handleModalRequestClose,
    showConfirmation,
    dismissConfirmation,
    save,
    confirm,
  };
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
