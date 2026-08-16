import { ExternalStore } from "@/shared-state/external-store";

export type TaskDialog =
  | null
  | Readonly<{ mode: "create" }>
  | Readonly<{ mode: "edit"; taskId: string }>;

export type UiSnapshot = Readonly<{ taskDialog: TaskDialog }>;

const SERVER_UI_SNAPSHOT: UiSnapshot = { taskDialog: null };

export class UiStore extends ExternalStore<UiSnapshot> {
  constructor() {
    super(SERVER_UI_SNAPSHOT);
  }

  openCreateTask(): void {
    if (this.getSnapshot().taskDialog?.mode === "create") {
      return;
    }

    this.update((draft) => {
      draft.taskDialog = { mode: "create" };
    });
  }

  openTask(taskId: string): void {
    const normalizedTaskId = taskId.trim();

    if (!normalizedTaskId) {
      return;
    }

    const dialog = this.getSnapshot().taskDialog;

    if (dialog?.mode === "edit" && dialog.taskId === normalizedTaskId) {
      return;
    }

    this.update((draft) => {
      draft.taskDialog = { mode: "edit", taskId: normalizedTaskId };
    });
  }

  closeTask(): void {
    if (this.getSnapshot().taskDialog !== null) {
      this.update((draft) => {
        draft.taskDialog = null;
      });
    }
  }

  resetForTests(): void {
    this.resetSnapshot();
    this.clearListenersForTests();
  }
}
