create table public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text not null default '',
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint tasks_title_length
    check (char_length(btrim(title)) between 1 and 240),
  constraint tasks_notes_length
    check (char_length(notes) <= 5000),
  constraint tasks_completion_consistency
    check (
      (completed = true and completed_at is not null)
      or (completed = false and completed_at is null)
    )
);

create index tasks_user_completed_created_idx
  on public.tasks (user_id, completed, created_at desc);

alter table public.tasks enable row level security;
alter table public.tasks replica identity full;

revoke all on table public.tasks from anon;
grant select, insert, update, delete on table public.tasks to authenticated;

create policy "Users can read their own tasks"
  on public.tasks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own tasks"
  on public.tasks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
  on public.tasks
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
  on public.tasks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create publication powersync for table public.tasks;
