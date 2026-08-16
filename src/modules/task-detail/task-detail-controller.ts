import { createTask, deleteTask, getTask, updateTask } from "@/platform/api/tasks";
import type { TaskDraft, TaskRecord, TaskSummary } from "@/domain/tasks";
import type { TaskInvalidationBus, TasksStore } from "@/shared-state/internal";

type TaskDetailApi = Readonly<{
  getTask: typeof getTask;
  createTask: typeof createTask;
  updateTask: typeof updateTask;
  deleteTask: typeof deleteTask;
}>;

function addToSummary(summary: TaskSummary, task: TaskRecord): TaskSummary {
  return {
    total: summary.total + 1,
    open: summary.open + (task.completed ? 0 : 1),
    completed: summary.completed + (task.completed ? 1 : 0),
  };
}

function removeFromSummary(summary: TaskSummary, task: TaskRecord): TaskSummary {
  return {
    total: Math.max(0, summary.total - 1),
    open: Math.max(0, summary.open - (task.completed ? 0 : 1)),
    completed: Math.max(0, summary.completed - (task.completed ? 1 : 0)),
  };
}

export class TaskDetailController {
  #request: { taskId: string; controller: AbortController; promise: Promise<TaskRecord> } | null =
    null;

  constructor(
    private readonly store: TasksStore,
    private readonly invalidationBus: TaskInvalidationBus,
    private readonly api: TaskDetailApi = { getTask, createTask, updateTask, deleteTask },
  ) {}

  load(taskId: string, force = false): Promise<TaskRecord> {
    const normalizedId = taskId.trim();
    const cached = this.store.getTask(normalizedId);

    if (cached && !force) {
      return Promise.resolve(cached);
    }

    if (this.#request?.taskId === normalizedId) {
      return this.#request.promise;
    }

    this.cancelLoad();
    const controller = new AbortController();
    const promise = this.api
      .getTask(normalizedId, { signal: controller.signal })
      .then((task) => {
        if (!controller.signal.aborted) {
          this.store.upsertTask(task);
          this.store.setDetail(task);
        }

        return task;
      })
      .finally(() => {
        if (this.#request?.promise === promise) {
          this.#request = null;
        }
      });
    this.#request = { taskId: normalizedId, controller, promise };
    return promise;
  }

  cancelLoad(): void {
    this.#request?.controller.abort();
    this.#request = null;
  }

  async create(draft: TaskDraft): Promise<TaskRecord> {
    const task = await this.api.createTask(draft);

    this.store.prependToInbox(task);
    const summary = this.store.getSummary();

    if (summary.status !== "idle") {
      this.store.setSummary(addToSummary(summary.data, task));
    }

    this.invalidationBus.publish();

    return task;
  }

  async update(taskId: string, draft: TaskDraft): Promise<TaskRecord> {
    this.store.setPending(taskId, "update");
    try {
      const task = await this.api.updateTask(taskId, draft);

      this.store.upsertTask(task);
      this.invalidationBus.publish();

      return task;
    } finally {
      this.store.setPending(taskId, null);
    }
  }

  async delete(taskId: string): Promise<void> {
    const previous = this.store.getTask(taskId);
    this.store.setPending(taskId, "delete");
    try {
      await this.api.deleteTask(taskId);

      this.store.removeTask(taskId);
      const summary = this.store.getSummary();

      if (previous && summary.status !== "idle") {
        this.store.setSummary(removeFromSummary(summary.data, previous));
      }

      this.invalidationBus.publish();
    } finally {
      this.store.setPending(taskId, null);
    }
  }
}
