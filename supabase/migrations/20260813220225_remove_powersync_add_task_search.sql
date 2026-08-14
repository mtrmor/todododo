drop publication if exists powersync;

alter table public.tasks replica identity default;

create index tasks_user_created_id_idx
  on public.tasks (user_id, created_at desc, id desc);

create or replace function public.search_tasks(
  search_query text,
  cursor_created_at timestamptz default null,
  cursor_id uuid default null,
  page_size integer default 51
)
returns setof public.tasks
language sql
stable
security invoker
set search_path = ''
as $$
  select tasks.*
  from public.tasks
  where tasks.user_id = (select auth.uid())
    and nullif(btrim(search_query), '') is not null
    and (
      strpos(lower(tasks.title), lower(btrim(search_query))) > 0
      or strpos(lower(tasks.notes), lower(btrim(search_query))) > 0
    )
    and (
      (cursor_created_at is null and cursor_id is null)
      or (
        cursor_created_at is not null
        and cursor_id is not null
        and (tasks.created_at, tasks.id) < (cursor_created_at, cursor_id)
      )
    )
  order by tasks.created_at desc, tasks.id desc
  limit least(greatest(coalesce(page_size, 51), 1), 51);
$$;

revoke all on function public.search_tasks(text, timestamptz, uuid, integer)
  from public, anon, service_role;
grant execute on function public.search_tasks(text, timestamptz, uuid, integer)
  to authenticated;
