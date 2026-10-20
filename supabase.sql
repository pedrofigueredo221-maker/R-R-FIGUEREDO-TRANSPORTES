-- Rode este script UMA vez em Supabase → SQL Editor → New query → Run
create table if not exists public.app_state (
  id         int primary key check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  version    int not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.app_state (id) values (1) on conflict do nothing;

alter table public.app_state enable row level security;

drop policy if exists "logados leem"      on public.app_state;
drop policy if exists "logados atualizam" on public.app_state;

create policy "logados leem"      on public.app_state for select to authenticated using (true);
create policy "logados atualizam" on public.app_state for update to authenticated using (true) with check (true);
-- Sem política para "anon": quem não fez login não lê nem grava nada.
