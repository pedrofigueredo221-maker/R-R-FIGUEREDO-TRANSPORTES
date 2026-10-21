# Relatório de revisão — 21/10/2026

Repositório revisado: https://github.com/pedrofigueredo221-maker/RR-FIGUEREDO-TRANSPORTES

## Arquivos conferidos
- `index.html`: os elementos de login esperados por `sync.js` existem; as bibliotecas Supabase e os scripts locais são carregados na ordem correta.
- `app.js`: o armazenamento local é mantido e a função de salvar chama `cloud.save()`, integrando os lançamentos à sincronização.
- `sync.js`: usa `.maybeSingle()` ao consultar `app_state`, apresenta erro se a linha não estiver visível, preserva sessão e contém login, recuperação de senha, cache local, migração e sincronização por versão.
- `config.js`: URL e chave publicável estão configuradas; o alias `RAFAEL` aponta para o e-mail de autenticação indicado.
- `redefinir-senha.html`: contém lógica de sessão/recuperação e atualização de senha.
- `styles.css`: contém estilos para login e estado da sincronização.
- `supabase.sql`, `supabase-login.sql`, `README.md` e `LEIA-ME-SUPABASE.txt`: corrigidos para refletir o acesso compartilhado e as precauções de segurança.

## Correções realizadas nesta branch
1. Os dois scripts SQL não limitam mais a política a um único e-mail. A política passa a permitir acesso à linha id=1 a qualquer usuário autenticado.
2. Os scripts removem políticas antigas conhecidas, inclusive regras antigas abertas a visitantes anônimos, revogam privilégios de `anon` e `public`, e preservam a linha existente com `ON CONFLICT DO NOTHING`.
3. A documentação foi atualizada para descrever login, recuperação de senha e sincronização em nuvem.
4. A documentação avisa para desativar cadastro público, pois qualquer conta autenticada pode acessar os dados compartilhados com essa política.

## Atenção antes de usar
- Esta revisão de arquivos não é um teste end-to-end com credenciais reais; o login, o envio de e-mail e a sincronização precisam ser testados no navegador.
- Não execute scripts SQL sem fazer backup e ler as políticas que serão substituídas.
- Não apague o armazenamento local do computador de casa: ele pode conter registros ainda não enviados à nuvem.
- O aplicativo guarda os registros em um único JSON na tabela `app_state`. Para uso financeiro real, faça backups e teste conflitos de edição em dois dispositivos.
- A chave publicável pode estar no frontend; nunca inclua `service_role` ou senhas no repositório.
