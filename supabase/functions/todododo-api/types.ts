export type SafeUser = Readonly<{
  id: string;
  email: string | null;
}>;

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

export type TaskCursor = Readonly<{
  createdAt: string;
  id: string;
}>;

export type TaskPage = Readonly<{
  items: readonly TaskRecord[];
  nextCursor: string | null;
}>;

export type TaskSummary = Readonly<{
  open: number;
  completed: number;
  total: number;
}>;

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  notes: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};
