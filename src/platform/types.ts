export type SafeUser = Readonly<{
  id: string;
  email: string | null;
}>;

export type {
  GetTasksOptions,
  RequestOptions,
  TaskDraft,
  TaskPage,
  TaskRecord,
  TaskSummary,
} from "@/domain/tasks";
