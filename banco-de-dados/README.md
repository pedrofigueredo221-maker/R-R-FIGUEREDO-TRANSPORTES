# Banco de dados

Esta pasta centraliza os scripts SQL relacionados ao banco do sistema.

- `supabase.sql`: configuração inicial da tabela `public.app_state` e políticas de acesso.
- `supabase-visitor-role.sql`: políticas para o perfil visitante com acesso somente de leitura.

## Importante

Os scripts não são executados automaticamente pelo site ou pelo GitHub. Antes de executar qualquer script, leia o conteúdo, confira o projeto Supabase correto e faça backup dos dados. A movimentação dos arquivos para esta pasta não altera o banco de produção.

Não armazene aqui senhas, chaves administrativas ou dados reais exportados do banco.
