-- Execute no SQL Editor do Supabase.
-- Atenção: as políticas abaixo deixam TODOS os visitantes anônimos lerem e alterarem
-- o registro financeiro completo. Use somente se aceitar conscientemente esse risco.
create table if not exists public.app_state (
  id integer primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

grant select, insert, update on public.app_state to anon;

drop policy if exists "public_read_app_state" on public.app_state;
create policy "public_read_app_state"
on public.app_state for select to anon using (id = 1);

drop policy if exists "public_insert_app_state" on public.app_state;
create policy "public_insert_app_state"
on public.app_state for insert to anon with check (id = 1);

drop policy if exists "public_update_app_state" on public.app_state;
create policy "public_update_app_state"
on public.app_state for update to anon using (id = 1) with check (id = 1);

-- Cria o registro inicial, sem apagar um registro existente.
insert into public.app_state (id, data, version)
values (1, '{"freights":[],"expenses":[],"receivables":[],"employees":[],"trucks":[],"categories":["Combustível","Pedágio","Óleo e lubrificantes","Mecânico","Oficina","Pneus","Elétrica","Peças","Documentação","Seguro","Lavagem","Manutenção","Despesas gerais","Outros"]}'::jsonb, 0)
on conflict (id) do nothing;
