# Banco de dados

Os arquivos específicos do Supabase ficam centralizados em [`supabase/`](./supabase/).

Essa organização inclui scripts SQL, configurações públicas carregadas pelo site, documentação e o script de backup. Os scripts SQL **não** são executados automaticamente pelo site ou pelo GitHub.

Antes de executar qualquer SQL, confira o projeto Supabase correto, leia o script e faça um backup. Mover arquivos no repositório não modifica o banco de produção.

Não armazene senhas, chaves administrativas (`service_role`), connection strings ou dumps reais no Git.
