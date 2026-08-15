import { ApiError } from "@/platform/api/api-error";
import { requestJson } from "@/platform/api/request";
import type {
  GetTasksOptions,
  RequestOptions,
  TaskDraft,
  TaskPage,
  TaskRecord,
  TaskSummary,
} from "@/platform/types";

function taskPath(taskId: string): string {
  if (!taskId.trim()) {
    throw new ApiError("A task id is required", {
      status: 0,
      code: "INVALID_TASK_ID",
    });
  }

  return `/api/v1/tasks/${encodeURIComponent(taskId)}`;
}

export function getTasks(options: GetTasksOptions = {}): Promise<TaskPage> {
  const params = new URLSearchParams();
  const query = options.query?.trim();

  if (query) {
    params.set("q", query);
  }

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }

  const search = params.toString();
  return requestJson<TaskPage>(`/api/v1/tasks${search ? `?${search}` : ""}`, {
    signal: options.signal,
  });
}

export function getTask(taskId: string, options: RequestOptions = {}): Promise<TaskRecord> {
  return requestJson<TaskRecord>(taskPath(taskId), { signal: options.signal });
}

export function getTaskSummary(options: RequestOptions = {}): Promise<TaskSummary> {
  return requestJson<TaskSummary>("/api/v1/tasks/summary", {
    signal: options.signal,
  });
}

export function createTask(draft: TaskDraft, options: RequestOptions = {}): Promise<TaskRecord> {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new ApiError("This device cannot create secure task identifiers", {
      status: 0,
      code: "UUID_UNAVAILABLE",
    });
  }

  return requestJson<TaskRecord>("/api/v1/tasks", {
    method: "POST",
    body: { id: globalThis.crypto.randomUUID(), ...draft },
    signal: options.signal,
  });
}

export function updateTask(
  taskId: string,
  draft: TaskDraft,
  options: RequestOptions = {},
): Promise<TaskRecord> {
  return requestJson<TaskRecord>(taskPath(taskId), {
    method: "PATCH",
    body: draft,
    signal: options.signal,
  });
}

export function setTaskCompleted(
  taskId: string,
  completed: boolean,
  options: RequestOptions = {},
): Promise<TaskRecord> {
  return requestJson<TaskRecord>(taskPath(taskId), {
    method: "PATCH",
    body: { completed },
    signal: options.signal,
  });
}

export async function deleteTask(taskId: string, options: RequestOptions = {}): Promise<void> {
  await requestJson(taskPath(taskId), {
    method: "DELETE",
    body: {},
    signal: options.signal,
  });
}
