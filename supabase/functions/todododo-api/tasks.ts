import type { SupabaseClient } from '@supabase/supabase-js';

import { HttpError } from './http.ts';
import { type CreateTaskInput, encodeCursor, type UpdateTaskInput } from './validation.ts';
import type { TaskCursor, TaskPage, TaskRecord, TaskRow, TaskSummary } from './types.ts';

const TASK_COLUMNS = 'id,user_id,title,notes,due_date,completed,created_at,updated_at,completed_at';

type DatabaseError = {
  code?: string;
};

function throwDatabaseError(error: DatabaseError | null): never {
  if (error?.code === '42501') {
    throw new HttpError(403, 'forbidden', 'The operation is not allowed.');
  }

  if (
    error?.code === '23505' ||
    error?.code === '23514' ||
    error?.code === '22P02'
  ) {
    throw new HttpError(400, 'validation_error', 'Task data is invalid.');
  }

  throw new HttpError(
    500,
    'database_error',
    'The task request could not be completed.',
  );
}

function toTaskRecord(row: TaskRow): TaskRecord {
  return Object.freeze({
    id: row.id,
    title: row.title,
    notes: row.notes,
    dueDate: row.due_date,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  });
}

function toPage(rows: TaskRow[], requestedSize: number): TaskPage {
  const hasNextPage = rows.length > requestedSize;
  const visibleRows = hasNextPage ? rows.slice(0, requestedSize) : rows;
  const last = visibleRows.at(-1);
  const nextCursor = hasNextPage && last
    ? encodeCursor({ createdAt: last.created_at, id: last.id })
    : null;

  return Object.freeze({
    items: Object.freeze(visibleRows.map(toTaskRecord)),
    nextCursor,
  });
}

export async function listTasks(
  client: SupabaseClient,
  cursor: TaskCursor | null,
  pageSize: number,
): Promise<TaskPage> {
  let query = client
    .from('tasks')
    .select(TASK_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize + 1);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throwDatabaseError(error);
  }

  return toPage((data ?? []) as TaskRow[], pageSize);
}

export async function searchTasks(
  client: SupabaseClient,
  searchQuery: string,
  cursor: TaskCursor | null,
  pageSize: number,
): Promise<TaskPage> {
  if (!searchQuery) {
    return Object.freeze({ items: Object.freeze([]), nextCursor: null });
  }

  const { data, error } = await client.rpc('search_tasks', {
    search_query: searchQuery,
    cursor_created_at: cursor?.createdAt ?? null,
    cursor_id: cursor?.id ?? null,
    page_size: pageSize + 1,
  });

  if (error) {
    throwDatabaseError(error);
  }

  return toPage((data ?? []) as TaskRow[], pageSize);
}

export async function taskSummary(
  client: SupabaseClient,
): Promise<TaskSummary> {
  const [totalResult, completedResult] = await Promise.all([
    client.from('tasks').select('id', { count: 'exact', head: true }),
    client
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('completed', true),
  ]);

  if (totalResult.error) {
    throwDatabaseError(totalResult.error);
  }

  if (completedResult.error) {
    throwDatabaseError(completedResult.error);
  }

  const total = totalResult.count ?? 0;
  const completed = completedResult.count ?? 0;
  return Object.freeze({ open: total - completed, completed, total });
}

export async function getTask(
  client: SupabaseClient,
  taskId: string,
): Promise<TaskRecord> {
  const { data, error } = await client
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw new HttpError(404, 'not_found', 'Task not found.');
  }

  return toTaskRecord(data as TaskRow);
}

export async function createTask(
  client: SupabaseClient,
  userId: string,
  input: CreateTaskInput,
): Promise<TaskRecord> {
  const { data, error } = await client
    .from('tasks')
    .insert({
      id: input.id,
      user_id: userId,
      title: input.title,
      notes: input.notes,
      due_date: input.dueDate,
      completed: false,
      completed_at: null,
    })
    .select(TASK_COLUMNS)
    .single();

  if (error) {
    throwDatabaseError(error);
  }

  return toTaskRecord(data as TaskRow);
}

export async function updateTask(
  client: SupabaseClient,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskRecord> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.title !== undefined) {
    update.title = input.title;
  }

  if (input.notes !== undefined) {
    update.notes = input.notes;
  }

  if (input.dueDate !== undefined) {
    update.due_date = input.dueDate;
  }

  if (input.completed !== undefined) {
    update.completed = input.completed;
    update.completed_at = input.completed ? new Date().toISOString() : null;
  }

  const { data, error } = await client
    .from('tasks')
    .update(update)
    .eq('id', taskId)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw new HttpError(404, 'not_found', 'Task not found.');
  }

  return toTaskRecord(data as TaskRow);
}

export async function deleteTask(
  client: SupabaseClient,
  taskId: string,
): Promise<void> {
  const { data, error } = await client
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .select('id')
    .maybeSingle();

  if (error) {
    throwDatabaseError(error);
  }

  if (!data) {
    throw new HttpError(404, 'not_found', 'Task not found.');
  }
}
