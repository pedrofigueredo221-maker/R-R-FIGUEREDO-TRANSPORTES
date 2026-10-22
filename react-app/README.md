# Versão React — migração gradual

A aplicação React é construída separadamente da versão estável em HTML. A raiz do repositório continua sendo a versão publicada até que as telas e fluxos tenham sido migrados e validados.

## Executar localmente
Requer Node.js 18 ou superior.
1. Na raiz do repositório, execute `npm install`.
2. Execute `npm run dev`.
3. Abra o endereço informado pelo Vite.

## Escopo desta etapa
- Login pelo Supabase Auth e restauração da sessão ao atualizar.
- Leitura do registro compartilhado `public.app_state`, sem criar, editar ou sobrescrever dados.
- Painel com faturamento mensal, lucro estimado, valores a receber, contas a pagar e fretes recentes.
- Identificação do perfil visitante como somente leitura.
- Demais telas sinalizadas como em migração; os formulários antigos continuam sendo a referência funcional.

## Segurança
A chave publicável do Supabase é destinada ao cliente; nunca adicionar `service_role` ou senha de banco. A proteção dos dados depende das políticas RLS. Não inclua backups reais nem dados de clientes no GitHub.

## Validação pendente
Executar `npm run build` e testar o login e as políticas RLS no projeto Supabase real com usuário autorizado e visitante. Esta etapa não substitui testes reais de autenticação/permissões.
