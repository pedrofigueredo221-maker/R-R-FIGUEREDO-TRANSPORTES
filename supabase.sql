-- R&R Figueredo Transportes: configuração do estado financeiro compartilhado.
-- Execute no SQL Editor do Supabase.
-- Permite acesso SOMENTE a sessões autenticadas. Desative cadastro público no Supabase
-- e crie contas manualmente para pessoas autorizadas.
-- Este script não apaga nem substitui os dados se a linha id=1 já existir.

begin;

create table if not exists public.app_state (
  id integer primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

revoke all on table public.app_state from anon;
revoke all on table public.app_state from public;
grant usage on schema public to authenticated;
grant select, update on table public.app_state to authenticated;

drop policy if exists "public_read_app_state" on public.app_state;
drop policy if exists "public_insert_app_state" on public.app_state;
drop policy if exists "public_update_app_state" on public.app_state;
drop policy if exists "authenticated_read_app_state" on public.app_state;
drop policy if exists "authenticated_update_app_state" on public.app_state;
drop policy if exists "app_state_select_authenticated" on public.app_state;
drop policy if exists "app_state_insert_authenticated" on public.app_state;
drop policy if exists "app_state_update_authenticated" on public.app_state;

create policy "authenticated_read_app_state"
on public.app_state for select to authenticated
using (id = 1 and auth.uid() is not null);

create policy "authenticated_update_app_state"
on public.app_state for update to authenticated
using (id = 1 and auth.uid() is not null)
with check (id = 1 and auth.uid() is not null);

insert into public.app_state (id, data, version)
values (
  1,
  '{"freights":[],"expenses":[],"receivables":[],"employees":[],"trucks":[],"categories":["Combustível","Pedágio","Óleo e lubrificantes","Mecânico","Oficina","Pneus","Elétrica","Peças","Documentação","Seguro","Lavagem","Manutenção","Despesas gerais","Outros"]}'::jsonb,
  0
)
on conflict (id) do nothing;

commit;
