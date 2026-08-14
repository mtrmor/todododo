begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(34);

select extensions.ok(
  to_regclass('public.tasks') is not null,
  'tasks table exists'
);

select extensions.is(
  (
    select count(*)::bigint
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname in (
        'tasks_title_length',
        'tasks_notes_length',
        'tasks_completion_consistency'
      )
  ),
  3::bigint,
  'all task validation constraints exist'
);

select extensions.ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'tasks'
      and indexname = 'tasks_user_completed_created_idx'
  ),
  'task list index exists'
);

select extensions.ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'tasks'
      and indexname = 'tasks_user_created_id_idx'
  ),
  'task search pagination index exists'
);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.tasks'::regclass),
  'row level security is enabled'
);

select extensions.is(
  (select relreplident::text from pg_class where oid = 'public.tasks'::regclass),
  'd',
  'replica identity is default'
);

select extensions.ok(
  not exists (
    select 1
    from pg_publication
    where pubname = 'powersync'
  ),
  'PowerSync publication is removed'
);

select extensions.is(
  (select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'tasks'),
  4::bigint,
  'tasks has one policy per CRUD operation'
);

select extensions.ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tasks'
      and cmd = 'UPDATE'
      and qual is not null
      and with_check is not null
  ),
  'update policy has both using and with check clauses'
);

select extensions.ok(
  has_table_privilege('authenticated', 'public.tasks', 'select')
    and has_table_privilege('authenticated', 'public.tasks', 'insert')
    and has_table_privilege('authenticated', 'public.tasks', 'update')
    and has_table_privilege('authenticated', 'public.tasks', 'delete'),
  'authenticated has explicit Data API CRUD grants'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.tasks', 'select')
    and not has_table_privilege('anon', 'public.tasks', 'insert')
    and not has_table_privilege('anon', 'public.tasks', 'update')
    and not has_table_privilege('anon', 'public.tasks', 'delete'),
  'anon has no task table privileges'
);

select extensions.ok(
  to_regprocedure('public.search_tasks(text,timestamptz,uuid,integer)') is not null,
  'task search function exists'
);

select extensions.ok(
  not (
    select prosecdef
    from pg_proc
    where oid = 'public.search_tasks(text,timestamptz,uuid,integer)'::regprocedure
  ),
  'task search function runs as security invoker'
);

select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.search_tasks(text,timestamptz,uuid,integer)',
    'execute'
  ),
  'authenticated can execute task search'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.search_tasks(text,timestamptz,uuid,integer)',
    'execute'
  ),
  'anon cannot execute task search'
);

-- Keep the suite deterministic when it runs against a developer database that
-- already contains data. These fixture removals are rolled back with the test.
delete from public.tasks
where id in (
  '99999999-9999-4999-8999-999999999999',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'ffffffff-ffff-4fff-8fff-ffffffffffff'
);

delete from auth.users
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'owner-b@example.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select extensions.lives_ok(
  $$
    insert into public.tasks (id, user_id, title)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Owner A task'
    )
  $$,
  'a user can insert their own task'
);

select extensions.lives_ok(
  $$
    insert into public.tasks (
      id,
      user_id,
      title,
      notes,
      completed,
      completed_at,
      created_at,
      updated_at
    )
    values
      (
        'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        '11111111-1111-4111-8111-111111111111',
        'Literal 100%_match',
        '',
        false,
        null,
        '2026-01-03 12:00:00+00',
        '2026-01-03 12:00:00+00'
      ),
      (
        'ffffffff-ffff-4fff-8fff-ffffffffffff',
        '11111111-1111-4111-8111-111111111111',
        'Notes match',
        'Needle in the notes',
        false,
        null,
        '2026-01-02 12:00:00+00',
        '2026-01-02 12:00:00+00'
      ),
      (
        '99999999-9999-4999-8999-999999999999',
        '11111111-1111-4111-8111-111111111111',
        'Completed needle',
        '',
        true,
        '2026-01-01 12:00:00+00',
        '2026-01-01 12:00:00+00',
        '2026-01-01 12:00:00+00'
      )
  $$,
  'a user can create searchable tasks'
);

select extensions.throws_ok(
  $$
    insert into public.tasks (id, user_id, title)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '22222222-2222-4222-8222-222222222222',
      'Cross-user task'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "tasks"',
  'a user cannot insert a task for another user'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select extensions.is(
  (select count(*)::bigint from public.tasks),
  0::bigint,
  'user B cannot read user A tasks'
);

select extensions.is(
  (
    select count(*)::bigint
    from public.search_tasks('needle', null, null, 51)
  ),
  0::bigint,
  'user B cannot search user A tasks'
);

select extensions.lives_ok(
  $$
    update public.tasks
    set title = 'Changed by B'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $$,
  'a cross-user update is safely filtered out'
);

select extensions.lives_ok(
  $$
    delete from public.tasks
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $$,
  'a cross-user delete is safely filtered out'
);

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select extensions.is(
  (
    select count(*)::bigint
    from public.search_tasks('NEEDLE', null, null, 51)
  ),
  2::bigint,
  'search is case-insensitive and includes completed tasks'
);

select extensions.is(
  (
    select count(*)::bigint
    from public.search_tasks('%_', null, null, 51)
  ),
  1::bigint,
  'search treats percent and underscore as literal characters'
);

select extensions.is(
  (
    select id::text
    from public.search_tasks('needle', null, null, 1)
  ),
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'the first search page uses descending keyset order'
);

select extensions.is(
  (
    select id::text
    from public.search_tasks(
      'needle',
      '2026-01-02 12:00:00+00',
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      1
    )
  ),
  '99999999-9999-4999-8999-999999999999',
  'the next search page resumes after the complete cursor'
);

select extensions.is(
  (select title from public.tasks where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'Owner A task',
  'user A task survived user B update and delete attempts unchanged'
);

select extensions.throws_ok(
  $$
    update public.tasks
    set completed = true, completed_at = null
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $$,
  '23514',
  'new row for relation "tasks" violates check constraint "tasks_completion_consistency"',
  'completed and completed_at must stay consistent'
);

select extensions.throws_ok(
  $$
    insert into public.tasks (id, user_id, title)
    values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      '11111111-1111-4111-8111-111111111111',
      '   '
    )
  $$,
  '23514',
  'new row for relation "tasks" violates check constraint "tasks_title_length"',
  'blank trimmed titles are rejected'
);

select extensions.throws_ok(
  $$
    insert into public.tasks (id, user_id, title, notes)
    values (
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      '11111111-1111-4111-8111-111111111111',
      'Too much detail',
      repeat('n', 5001)
    )
  $$,
  '23514',
  'new row for relation "tasks" violates check constraint "tasks_notes_length"',
  'notes longer than 5000 characters are rejected'
);

select extensions.lives_ok(
  $$
    update public.tasks
    set completed = true,
        completed_at = now(),
        updated_at = now()
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $$,
  'a consistent completion update succeeds'
);

select extensions.ok(
  (select completed from public.tasks where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'completion is stored for the owner'
);

select extensions.lives_ok(
  $$
    delete from public.tasks
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $$,
  'a user can delete their own task'
);

select extensions.is(
  (select count(*)::bigint from public.tasks),
  3::bigint,
  'only the selected owner task is deleted'
);

select * from extensions.finish();
rollback;
