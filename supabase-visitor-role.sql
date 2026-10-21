-- R&R Figueredo Transportes — Perfil Visitante somente leitura
-- Execute no SQL Editor do projeto Supabase EXISTENTE.
-- Não altera nem recria os dados da linha public.app_state.
-- Administrador: pedrofigueredo221@gmail.com
-- Visitante: pedrofogofogop@gmail.com

begin;
alter table public.app_state enable row level security;
revoke all on table public.app_state from anon;
revoke all on table public.app_state from public;
grant select, insert, update on table public.app_state to authenticated;

-- Remove todas as políticas anteriores para não deixar uma política permissiva antiga ativa.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'app_state'
  loop
    execute format('drop policy if exists %I on public.app_state', p.policyname);
  end loop;
end
$$;

create policy "authenticated_read_app_state"
on public.app_state for select to authenticated
using (
  id = 1 and lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'pedrofigueredo221@gmail.com',
    'pedrofogofogop@gmail.com'
  )
);

create policy "authenticated_insert_app_state"
on public.app_state for insert to authenticated
with check (
  id = 1 and lower(coalesce(auth.jwt() ->> 'email', '')) = 'pedrofigueredo221@gmail.com'
);

create policy "authenticated_update_app_state"
on public.app_state for update to authenticated
using (
  id = 1 and lower(coalesce(auth.jwt() ->> 'email', '')) = 'pedrofigueredo221@gmail.com'
)
with check (
  id = 1 and lower(coalesce(auth.jwt() ->> 'email', '')) = 'pedrofigueredo221@gmail.com'
);
commit;
