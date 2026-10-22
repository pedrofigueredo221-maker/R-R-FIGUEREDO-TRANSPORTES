-- R&R Figueredo Transportes
-- Restrict writes to public.app_state to explicitly authorized users.
-- Review and run manually in Supabase SQL Editor ONLY after creating and validating a backup.
-- This file is not executed automatically by GitHub or the React application.

begin;

create table if not exists public.app_state_write_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  can_write boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.app_state_write_access enable row level security;
revoke all on table public.app_state_write_access from anon;
revoke all on table public.app_state_write_access from public;
revoke all on table public.app_state_write_access from authenticated;

create or replace function public.current_user_can_write_app_state()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.app_state_write_access access_row
    where access_row.user_id = auth.uid()
      and access_row.can_write = true
  );
$$;

revoke all on function public.current_user_can_write_app_state() from public;
grant execute on function public.current_user_can_write_app_state() to authenticated;

alter table public.app_state enable row level security;
revoke all on table public.app_state from anon;
revoke all on table public.app_state from public;
grant usage on schema public to authenticated;
grant select, insert, update on table public.app_state to authenticated;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_state'
  loop
    execute format('drop policy if exists %I on public.app_state', policy_row.policyname);
  end loop;
end $$;

create policy app_state_select_authenticated
on public.app_state
for select
to authenticated
using (auth.uid() is not null);

create policy app_state_insert_authorized
on public.app_state
for insert
to authenticated
with check (id = 1 and public.current_user_can_write_app_state());

create policy app_state_update_authorized
on public.app_state
for update
to authenticated
using (id = 1 and public.current_user_can_write_app_state())
with check (id = 1 and public.current_user_can_write_app_state());

commit;

-- IMPORTANT: this migration intentionally grants write access to NOBODY by default.
-- After confirming a valid backup and choosing the intended writer account, run a
-- separate statement in the SQL Editor, replacing the placeholder with that
-- account's login email. Do NOT grant access to the visitor account:
--
-- insert into public.app_state_write_access (user_id, can_write)
-- select id, true
-- from auth.users
-- where lower(email) = lower('REPLACE_WITH_AUTHORIZED_LOGIN_EMAIL')
-- on conflict (user_id) do update set can_write = excluded.can_write;
--
-- Verify the intended account was granted access and the visitor was not.
-- The React UI's read-only mode is not a security boundary; RLS is.
