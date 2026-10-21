-- Execute no SQL Editor do Supabase DEPOIS de criar o usuário em Authentication > Users.
-- Restringe leitura/alteração da tabela aos usuários autenticados.
-- Não apaga nem altera o registro financeiro existente.

create table if not exists public.app_state (
  id integer primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Remover as políticas anônimas criadas anteriormente.
drop policy if exists "public_read_app_state" on public.app_state;
drop policy if exists "public_insert_app_state" on public.app_state;
drop policy if exists "public_update_app_state" on public.app_state;

-- Remover permissões concedidas a visitantes anônimos.
revoke all on table public.app_state from anon;
grant select, insert, update on table public.app_state to authenticated;

-- Restrinja ao e-mail autorizado cadastrado em Supabase > Authentication > Users.
-- Confirme que este e-mail também corresponde ao mapeamento RAFAEL em config.js.
drop policy if exists "authenticated_read_app_state" on public.app_state;
create policy "authenticated_read_app_state" on public.app_state
  for select to authenticated
  using (id = 1 and (auth.jwt() ->> 'email') = 'pedrofigueredo221@gmail.com');

drop policy if exists "authenticated_insert_app_state" on public.app_state;
drop policy if exists "authenticated_update_app_state" on public.app_state;
create policy "authenticated_insert_app_state"
on public.app_state
for insert to authenticated
with check (
  id = 1
  and (auth.jwt() ->> 'email') = 'pedrofigueredo221@gmail.com'
);

create policy "authenticated_update_app_state" on public.app_state
  for update to authenticated
  using (id = 1 and (auth.jwt() ->> 'email') = 'pedrofigueredo221@gmail.com')
  with check (id = 1 and (auth.jwt() ->> 'email') = 'pedrofigueredo221@gmail.com');

-- Mantém a criação inicial idempotente: se a linha já existe, não sobrescreve os dados.
insert into public.app_state (id, data, version)
values (1, '{"freights":[],"expenses":[],"receivables":[],"employees":[],"trucks":[],"categories":["Combustível","Pedágio","Óleo e lubrificantes","Mecânico","Oficina","Pneus","Elétrica","Peças","Documentação","Seguro","Lavagem","Manutenção","Despesas gerais","Outros"]}'::jsonb, 0)
on conflict (id) do nothing;
