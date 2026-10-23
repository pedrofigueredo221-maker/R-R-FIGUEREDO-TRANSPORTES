# R&R Figueredo Transportes
## Documentação completa do projeto

Aplicação web de gestão da R&R Figueredo Transportes, desenvolvida em React, com autenticação e persistência no Supabase. Este é o documento central do repositório: reúne instalação, arquitetura, funcionalidades, configuração, segurança, backups, testes e publicação.

## Sumário
- [Visão geral](#visão-geral)
- [Requisitos e instalação](#requisitos-e-instalação)
- [Comandos disponíveis](#comandos-disponíveis)
- [Modo demonstração](#modo-demonstração)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Funcionalidades e arquitetura](#funcionalidades-e-arquitetura)
- [Configuração do Supabase](#configuração-do-supabase)
- [Segurança e permissões](#segurança-e-permissões)
- [Backup e recuperação](#backup-e-recuperação)
- [Testes](#testes)
- [Publicação](#publicação)
- [Manutenção](#manutenção)
- [Limitações conhecidas](#limitações-conhecidas)
- [Solução de problemas](#solução-de-problemas)

## Visão geral

O sistema centraliza o acompanhamento gerencial de fretes, faturamento, lucro estimado, despesas, contas a receber, contas a pagar, cadastros de funcionários e caminhões e relatórios. Não deve ser considerado um sistema contábil/fiscal oficial sem validação específica.

A interface atual é React. A página principal e a página de recuperação de senha são duas entradas da mesma aplicação, não implementações independentes.

## Requisitos e instalação

- Node.js 22 ou superior e npm.
- Git para clonar/atualizar o repositório.
- Supabase para autenticação e persistência quando não estiver usando o modo demonstração.
- PowerShell, Supabase CLI e Docker Desktop para o procedimento de backup descrito adiante.

Na raiz do projeto, execute:

```powershell
node --version
npm --version
npm install
npm run dev
```

Abra no navegador o endereço local informado pelo Vite.

## Comandos disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite. |
| `npm run build` | Compila as entradas React para `dist-react/`. |
| `npm run preview` | Serve a compilação local para inspeção. |
| `npm test` | Executa testes automatizados com o runner nativo do Node.js. |
| `node scripts/check-project.mjs` | Verifica a estrutura esperada do repositório. |
| `powershell -ExecutionPolicy Bypass -File .\scripts\testar-react.ps1` | Ajuda a iniciar o ambiente local no Windows. |

Validação local recomendada:

```powershell
node scripts/check-project.mjs
npm test
npm run build
npm run preview
```

## Modo demonstração

Acrescente `?demo=1` ao endereço local, por exemplo `http://localhost:5173/?demo=1`. O modo usa dados fictícios, não cria cliente Supabase e mantém as alterações no armazenamento local do navegador. É útil para testar visualmente navegação e formulários.

O modo demonstração não valida autenticação real, políticas RLS nem sincronização entre computadores. Sem `?demo=1`, a aplicação pode ler ou gravar dados do Supabase configurado, conforme a sessão e as permissões.

## Estrutura do projeto

```text
/
├── index.html                         # Entrada principal
├── redefinir-senha.html               # Entrada para recuperação de senha
├── reset-main.jsx                     # Inicialização da recuperação
├── vite.config.js                     # Build e configuração Vite
├── package.json                       # Dependências e comandos
├── src/
│   ├── main.jsx                       # Inicialização React
│   ├── App.jsx                        # Autenticação, sessão e navegação
│   ├── EditablePage.jsx               # Fluxo compartilhado de edição
│   ├── PasswordReset.jsx              # Recuperação/alteração de senha
│   ├── screens/                       # Telas funcionais
│   ├── components/                    # Componentes reutilizáveis
│   ├── domain/                        # Regras de negócio e testes
│   ├── lib/                           # Utilitários compartilhados
│   ├── demo/                          # Dados fictícios
│   └── styles/                        # Estilos por finalidade
├── banco-de-dados/supabase/
│   ├── app-config.js                  # Configuração publicável do cliente
│   ├── supabase.sql                   # Estrutura e políticas da aplicação
│   ├── supabase-visitor-role.sql      # Políticas do perfil visitante
│   └── backup-supabase.ps1             # Backup lógico local
├── supabase/migrations/               # Migrações versionadas
├── scripts/                            # Verificações e suporte local
├── .github/workflows/
│   ├── react-build.yml                # Validação automatizada
│   └── deploy-react.yml               # Publicação manual protegida
└── README.md                          # Documentação central
```

A listagem destaca os caminhos principais; arquivos internos podem ser adicionados conforme o projeto evolui.

### Convenções de arquitetura

- Coloque cálculos independentes da interface em `src/domain/` e mantenha testes correspondentes.
- Telas ficam em `src/screens/`; elementos usados por várias telas devem ser componentes em `src/components/`.
- Mantenha estilos globais em `src/styles.css` e regras específicas em `src/styles/screens.css`.
- Reutilize regras financeiras existentes; não copie fórmulas para vários componentes.
- O modo demonstração depende dos dados em `src/demo/`; não remova esses arquivos sem substituir explicitamente o comportamento.
- Antes de excluir um arquivo, procure suas importações e referências em scripts, workflows e configuração.

## Funcionalidades e arquitetura

O sistema cobre painel gerencial, fretes, despesas, recebimentos, pagamentos, cadastro de funcionários e caminhões e relatórios/consultas. A prévia financeira do frete depende das funções de domínio e pode considerar comissão, bônus, pedágio, combustível real e demais custos definidos pelo código.

Contas a pagar e despesas possuem fluxos relacionados; revise essa integração antes de alterar componentes. A disponibilidade de escrita pode variar por tela e permissão. A interface não deve ser usada como única barreira de segurança.

A aplicação usa atualmente o registro compartilhado `public.app_state`, um documento JSON com controle otimista de versão. Isso ajuda a detectar gravações concorrentes, mas não constitui modo offline completo nem substitui um banco normalizado por registro.

## Configuração do Supabase

Arquivos principais:
- `banco-de-dados/supabase/app-config.js`: URL do projeto, chave publicável e mapeamento de usuários.
- `banco-de-dados/supabase/supabase.sql`: tabela compartilhada e políticas de acesso.
- `banco-de-dados/supabase/supabase-visitor-role.sql`: regras do perfil visitante.
- `supabase/migrations/20261022_app_state_write_roles.sql`: migração de permissões de escrita.
- `banco-de-dados/supabase/backup-supabase.ps1`: script de backup lógico.

Procedimento:
1. No painel Supabase, confirme o projeto e os usuários em **Authentication → Users**.
2. Confira o mapeamento de usuários em `app-config.js` e sua correspondência com as políticas RLS.
3. Em **Authentication → URL Configuration**, adicione a URL publicada terminada em `/redefinir-senha.html` às Redirect URLs.
4. Rode testes e build localmente.
5. Use contas de teste para validar login, recuperação de senha, leitura, escrita e perfil visitante.
6. Revise todo SQL e confirme o projeto de destino antes de executar qualquer instrução no SQL Editor.

## Segurança e permissões

- A chave publicável/anon pode ser usada no navegador; nunca inclua `service_role`, senhas, tokens privados ou connection strings no código ou commits.
- A segurança real depende de políticas **Row Level Security (RLS)** aplicadas no banco. Ocultar botões não impede chamadas diretas à API.
- O perfil visitante deve poder consultar, mas não gravar. Confirme com uma sessão visitante que INSERT/UPDATE/DELETE são recusados pelo Supabase.
- A migração `20261022_app_state_write_roles.sql` configura permissões explícitas de escrita. Leia o arquivo inteiro antes de executá-lo e conceda escrita somente às contas autorizadas; não conceda escrita ao visitante.
- Faça backup restaurável e teste em ambiente separado antes de alterar produção.
- Alterar arquivos no GitHub não executa SQL nem altera automaticamente os dados do Supabase.

## Backup e recuperação

O backup lógico deve ser executado somente em computador autorizado. Na raiz do projeto, abra PowerShell:

```powershell
$env:SUPABASE_DB_URL = Read-Host "Cole a connection string PostgreSQL do Supabase"
.\banco-de-dados\supabase\backup-supabase.ps1
Remove-Item Env:SUPABASE_DB_URL
```

O procedimento requer Supabase CLI e Docker Desktop. O ZIP é salvo em `backups/local/`, diretório ignorado pelo Git. Obtenha a connection string no painel Supabase em **Connect**; codifique caracteres especiais da senha na URL.

**Limitações:** o dump lógico padrão não inclui schemas gerenciados como `auth` e `storage`, nem arquivos binários do Storage. Faça cópia separada desses objetos quando usados. Esse backup não é uma cópia integral de todo o projeto Supabase.

Após gerar:
1. Confirme que o arquivo ZIP foi criado sem erros.
2. Guarde uma segunda cópia em local privado separado, idealmente protegido/criptografado.
3. Teste a restauração em um projeto separado.
4. Nunca restaure em produção sem conferir o destino.

Não comite backups reais. Se uma connection string for exposta, altere a credencial do banco no painel Supabase.

## Testes

### Automatizados

Antes de abrir ou aprovar uma pull request, execute:

```powershell
node scripts/check-project.mjs
npm test
npm run build
```

O workflow `.github/workflows/react-build.yml` verifica a estrutura, os testes e a compilação conforme os gatilhos configurados no GitHub Actions.

### Roteiro manual

1. Entrar, sair e atualizar a página; confirmar que o login não é ignorado indevidamente.
2. Conferir painel, faturamento, lucro estimado, recebíveis e contas a pagar.
3. Criar, editar e excluir um frete de teste; conferir a prévia financeira.
4. Conferir comissões, descontos, pedágio, combustível estimado/real, bônus e outros custos.
5. Criar despesas à vista e parceladas; registrar pagamentos parciais e totais.
6. Conferir cadastros de funcionários e caminhões.
7. Conferir relatórios, filtros e valores.
8. Testar visitante e confirmar que a escrita é recusada pelo banco.
9. Testar duas sessões para conferir conflitos de gravação.
10. Testar recuperação de senha com e-mail de teste.
11. Verificar desktop, tablet e celular, incluindo modais, tabelas e navegação por teclado.

Build e testes automatizados não substituem teste visual no navegador nem validação real de autenticação e RLS.

## Publicação

O workflow `.github/workflows/deploy-react.yml` publica `dist-react/` no GitHub Pages quando iniciado manualmente e com a confirmação `confirm_publish`. Essa confirmação é uma barreira intencional; não torne a publicação automática apenas para facilitar a documentação.

Antes de publicar:
1. Faça backup e confirme que a restauração foi testada.
2. Revise RLS e permissões no projeto Supabase correto.
3. Execute verificações, testes e build.
4. Teste login, recuperação de senha, visitante e operações financeiras com contas de teste.
5. Confirme branch, artefato e destino.
6. Inicie o workflow e confirme a publicação somente depois dessas verificações.

Não presuma que mesclar uma pull request publica automaticamente o site.

## Manutenção

- Faça alterações em branches e use pull requests para revisão.
- Separe alterações documentais de mudanças funcionais e de banco.
- Mantenha testes de regras financeiras em `src/domain/`.
- Não remova SQL, migrações, testes, dados de demonstração ou scripts só porque não aparecem na interface.
- Atualize este README quando mudar estrutura, comandos ou procedimentos.
- Nunca declare testes aprovados se eles não foram executados.
- Mantenha dados reais, backups e segredos fora do Git.

## Limitações conhecidas

O sistema atual não implementa modo offline completo. O registro compartilhado é um documento JSON com controle de versão, não uma estrutura normalizada com sincronização independente por registro. A autenticação, permissões RLS, gravações e interface precisam ser testadas no Supabase real com contas de teste antes de uma publicação segura.

Registros de alterações antigas podem mencionar arquivos da versão HTML/JavaScript anterior, como `app.js`, `sync.js`, `styles.css` e `config.js`. Essas referências são históricas, não instruções para recriar a aplicação antiga. Este README descreve a estrutura atual conhecida, mas não confirma por si só o estado da implantação pública.

## Solução de problemas

**Node.js não é reconhecido:** instale Node.js 22 ou superior, reabra o PowerShell e confira `node --version` e `npm --version`.

**O projeto não inicia:** confirme que o terminal está na raiz do repositório, execute `npm install` e depois `npm run dev`.

**A recuperação de senha retorna erro de URL:** confira a URL publicada terminada em `/redefinir-senha.html` em Supabase → Authentication → URL Configuration → Redirect URLs.

**Visitante consegue gravar:** ocultar botões não é segurança. Revise as políticas RLS e permissões no banco com contas de teste; não altere produção sem backup e revisão.

**A publicação não reflete a alteração:** confira o resultado do workflow de deploy, a branch e o artefato publicado; depois verifique cache do navegador. Mesclar PR não implica necessariamente publicação.

**O backup parece incompleto:** o dump lógico não inclui `auth`, `storage` ou objetos binários do Storage. Planeje backups complementares e teste a restauração.
