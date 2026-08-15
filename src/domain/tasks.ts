export type TaskRecord = Readonly<{
  id: string;
  title: string;
  notes: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}>;

export type TaskDraft = Readonly<{
  title: string;
  notes: string;
  dueDate: string | null;
}>;

export type TaskPage = Readonly<{
  items: readonly TaskRecord[];
  nextCursor: string | null;
}>;

export type TaskSummary = Readonly<{
  open: number;
  total: number;
  completed: number;
}>;

export type GetTasksOptions = Readonly<{
  query?: string;
  cursor?: string | null;
  limit?: number;
  signal?: AbortSignal;
}>;

export type RequestOptions = Readonly<{
  signal?: AbortSignal;
}>;
