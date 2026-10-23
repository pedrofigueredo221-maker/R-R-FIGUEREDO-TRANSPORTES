-- DIAGNÓSTICO SOMENTE LEITURA. Execute no SQL Editor do projeto correto.
-- Não exporta dados pessoais e não altera tabelas, políticas ou usuários.
select current_database() as banco, current_timestamp as verificado_em;
select c.relname as tabela, c.relrowsecurity as rls_ativo, c.relforcerowsecurity as rls_forcado
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('app_state','app_state_write_access');
select schemaname, tablename, policyname, roles, cmd, permissive,
       qual as condicao_leitura, with_check as condicao_gravacao
from pg_policies
where schemaname='public' and tablename in ('app_state','app_state_write_access')
order by tablename, policyname;
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name='app_state'
order by grantee, privilege_type;
select id, version, updated_at, jsonb_typeof(data) as tipo_dados,
       jsonb_typeof(data->'freights') as tipo_fretes,
       jsonb_array_length(case when jsonb_typeof(data->'freights')='array' then data->'freights' else '[]'::jsonb end) as qtd_fretes,
       jsonb_array_length(case when jsonb_typeof(data->'expenses')='array' then data->'expenses' else '[]'::jsonb end) as qtd_despesas,
       jsonb_array_length(case when jsonb_typeof(data->'receivables')='array' then data->'receivables' else '[]'::jsonb end) as qtd_recebiveis,
       jsonb_array_length(case when jsonb_typeof(data->'employees')='array' then data->'employees' else '[]'::jsonb end) as qtd_funcionarios,
       jsonb_array_length(case when jsonb_typeof(data->'trucks')='array' then data->'trucks' else '[]'::jsonb end) as qtd_caminhoes
from public.app_state where id=1;
-- Não compartilhe publicamente resultados que revelem contas, políticas ou detalhes internos.
