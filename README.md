# R&R Figueredo Transportes — Gestão compartilhada de fretes

Aplicação web para acompanhar fretes, motoristas, caminhões, despesas, contas a receber, pagamentos e relatórios. A versão publicada usa GitHub Pages para a interface e Supabase Auth + banco de dados para login e sincronização entre dispositivos.

## Arquivos do projeto

- `index.html`: interface e formulário de login.
- `styles.css`: estilos e responsividade.
- `app.js`: telas, cadastros, cálculos, relatórios e armazenamento local/cache.
- `config.js`: URL/chave publicável do Supabase e nomes de usuário vinculados aos e-mails.
- `sync.js`: autenticação, recuperação de senha e sincronização de dados.
- `redefinir-senha.html`: tela para definir uma nova senha pelo link recebido.
- `supabase.sql` e `supabase-login.sql`: scripts de configuração do banco e das políticas RLS.
- `LEIA-ME-SUPABASE.txt`: guia rápido de configuração.

## Publicação

O site está publicado em GitHub Pages. Para baixar o projeto inteiro, use **Code → Download ZIP** no repositório. Para publicar alterações, envie os arquivos atualizados para a raiz da branch configurada em **Settings → Pages**.

## Configuração do Supabase

1. Em **Authentication → Users**, crie as contas das pessoas autorizadas.
2. Em **Authentication → Settings** (a nomenclatura pode variar), desative cadastro público/sign-ups se o sistema for privado. Crie novos usuários manualmente.
3. Em **Authentication → URL Configuration**, configure a URL principal do site e adicione como Redirect URL: `https://pedrofigueredo221-maker.github.io/RR-FIGUEREDO-TRANSPORTES/redefinir-senha.html`.
4. No SQL Editor, confira primeiro se há dados existentes em `public.app_state`. Faça backup antes de qualquer alteração.
5. Revise `supabase.sql` e execute-o somente se estiver de acordo com a política descrita abaixo. O script usa `ON CONFLICT DO NOTHING`, portanto não substitui a linha de dados existente.
6. Em `config.js`, adicione cada novo nome de usuário e o e-mail correspondente da conta Supabase em `USER_EMAILS`. O nome digitado na tela é um alias; a autenticação é feita pelo e-mail vinculado.
7. Publique os arquivos juntos e teste login, recuperação de senha e sincronização em dois navegadores antes de usar dados reais.

## Acesso e segurança

O banco mantém os dados compartilhados em uma linha `public.app_state` (id 1). As políticas incluídas permitem ler e atualizar essa linha a qualquer usuário autenticado. **Isso só é seguro se a criação de contas estiver restrita e forem criadas contas apenas para pessoas autorizadas.** Se o cadastro público estiver habilitado, qualquer pessoa que crie uma conta poderá acessar os dados compartilhados.

A chave publishable/anon é própria para uso no frontend; nunca publique a chave `service_role` nem senhas no repositório. As políticas RLS, e não o fato de o formulário pedir login, protegem os dados.

## Sincronização e migração

O `sync.js` usa controle de versão para evitar sobrescritas simples e mantém cache local de alterações pendentes. O computador antigo pode conter registros que ainda não foram enviados à nuvem. **Não limpe o armazenamento do navegador nem aceite importar registros sem conferir o conteúdo.** Faça backup do Supabase antes de importar dados antigos.

O banco atual armazena o estado do aplicativo em um único documento JSON. Para poucos usuários é simples de administrar, mas alterações simultâneas podem exigir testes cuidadosos; mantenha backups regulares.

## Checklist de testes

- Login correto e incorreto.
- Recuperação de senha e redefinição pelo link de e-mail.
- Criar e editar um frete, uma despesa e um recebimento.
- Confirmar que as mudanças aparecem em outro navegador/dispositivo.
- Verificar que a versão da linha `app_state` aumenta ao salvar.
- Confirmar que usuário não autenticado não consegue consultar o estado.
