-- R&R Figueredo Transportes: configuração segura do estado compartilhado.
-- Execute no SQL Editor do Supabase.
-- A política limita leitura e alteração à conta autorizada.
-- Confirme o e-mail abaixo com o usuário criado em Authentication > Users.
-- Este script não apaga nem substitui o registro financeiro existente.

create table if not exists public.app_state (
  id integer primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Remova permissões e políticas abertas a visitantes anônimos.
revoke all on table public.app_state from anon;
revoke all on table public.app_state from public;
grant select, update on table public.app_state to authenticated;

drop policy if exists "public_read_app_state" on public.app_state;
drop policy if exists "public_insert_app_state" on public.app_state;
drop policy if exists "public_update_app_state" on public.app_state;
drop policy if exists "authenticated_read_app_state" on public.app_state;
drop policy if exists "authenticated_update_app_state" on public.app_state;

create policy "authenticated_read_app_state"
on public.app_state
for select to authenticated
using (
  id = 1
  and (auth.jwt() ->> 'email') = 'pedrofigueredo221@gmail.com'
);

create policy "authenticated_update_app_state"
on public.app_state
for update to authenticated
using (
  id = 1
  and (auth.jwt() ->> 'email') = 'pedrofigueredo221@gmail.com'
)
with check (
  id = 1
  and (auth.jwt() ->> 'email') = 'pedrofigueredo221@gmail.com'
);

-- Cria o registro inicial somente se ainda não existir.
insert into public.app_state (id, data, version)
values (
  1,
  '{"freights":[],"expenses":[],"receivables":[],"employees":[],"trucks":[],"categories":["Combustível","Pedágio","Óleo e lubrificantes","Mecânico","Oficina","Pneus","Elétrica","Peças","Documentação","Seguro","Lavagem","Manutenção","Despesas gerais","Outros"]}'::jsonb,
  0
)
on conflict (id) do nothing;
