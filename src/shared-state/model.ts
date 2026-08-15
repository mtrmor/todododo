import type { TaskRecord, TaskSummary } from "@/domain/tasks";

export type {
  GetTasksOptions,
  RequestOptions,
  TaskDraft,
  TaskPage,
  TaskRecord,
  TaskSummary,
} from "@/domain/tasks";

export type TaskCollectionStatus =
  | "idle"
  | "loading"
  | "refreshing"
  | "loading-more"
  | "ready"
  | "error";

export type TaskCollection = Readonly<{
  ids: readonly string[];
  nextCursor: string | null;
  status: TaskCollectionStatus;
  error: string | null;
  offline: boolean;
}>;

export type TaskMutationKind = "complete" | "update" | "delete";

export type TaskSummaryState = Readonly<{
  data: TaskSummary;
  status: "idle" | "loading" | "refreshing" | "ready" | "error";
  error: string | null;
  offline: boolean;
}>;

export type TasksSnapshot = Readonly<{
  byId: Readonly<Record<string, TaskRecord>>;
  collections: Readonly<Record<string, TaskCollection>>;
  summary: TaskSummaryState;
  pendingById: Readonly<Record<string, TaskMutationKind>>;
}>;

export type TaskCollectionView = Readonly<{
  tasks: readonly TaskRecord[];
  nextCursor: string | null;
  status: TaskCollectionStatus;
  error: string | null;
  offline: boolean;
}>;

export type TaskSummaryView = TaskSummaryState;

export const INBOX_COLLECTION_KEY = "inbox";

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function searchCollectionKey(query: string): string {
  return `search:${normalizeSearchQuery(query)}`;
}
