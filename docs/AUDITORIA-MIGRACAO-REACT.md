# Auditoria de preservação e migração para React

## Estado verificado em 22/10/2026

A migração completa ainda **não está pronta**. O sistema de produção continua sendo o HTML/JavaScript da raiz. A aplicação em `react-app/` era apenas uma página de orientação técnica; ela ainda não substitui as telas ou fluxos antigos.

Esta auditoria é uma referência de preservação. Nenhuma tela de produção, regra financeira, arquivo de sincronização, configuração Supabase ou dado foi alterado nesta etapa.

## Inventário do sistema legado

| Arquivo | Tamanho aproximado | Responsabilidade observada |
|---|---:|---|
| `index.html` | 40 KB / 739 linhas | Login, navegação e estrutura das telas, formulários e diálogos |
| `app.js` | 70 KB / 394 linhas | Estado local, cadastros, telas, cálculos financeiros, relatórios e importação/exportação |
| `styles.css` | 67 KB / 1.009 linhas | Layouts, formulários, tabelas, modais, responsividade e estados visuais |
| `sync.js` | 24 KB / 979 linhas | Supabase Auth, perfil visitante, cache, sincronização, mesclagem e recuperação |
| `config.js` | 378 bytes | URL/chave publicável do Supabase e e-mails de papéis |
| `redefinir-senha.html` | 5 KB / 188 linhas | Fluxo separado de recuperação/definição de senha |

A entrada HTML carrega as bibliotecas XLSX, Tesseract e Supabase antes dos arquivos da aplicação. A ordem desses scripts é uma dependência que precisa ser mantida durante a migração.

## Funcionalidades que precisam ser preservadas

- Login com Supabase Auth, mensagens de erro e recuperação de senha.
- Perfil Visitante somente leitura, sem remover a conta administrativa.
- Carregamento dos dados da nuvem, cache local, sincronização periódica, tratamento de alterações pendentes e mesclagem de dados legados.
- Painel com indicadores, fretes recentes, contas próximas do vencimento e visão por categoria.
- Cadastro, edição, exclusão, filtros e pesquisa de fretes.
- Cálculo de comissão percentual ou fixa; descontos gerais; pedágio opcionalmente descontado da base; bônus fora da base; combustível estimado e real; custo e lucro estimado.
- Registro e acompanhamento de recebimentos parciais de clientes.
- Despesas, categorias, fornecedores, caminhões, descontos/adicionais, parcelamento e pagamentos parciais por parcela.
- Contas a receber e contas a pagar com filtros por situação e mês.
- Cadastro de funcionários e caminhões, ativação/desativação, vínculos e ações em lote.
- Relatórios por período e motorista e exportação CSV.
- Modelo/importação de planilhas, prévia/validação de dados e leitura auxiliar por foto/OCR.
- Autocompletar cidades, ordenação de tabelas, diálogos, notificações e layouts responsivos.
- Tela separada para redefinição de senha e identidade visual/logotipo.

## Regras financeiras de referência

As funções legadas foram encontradas em `app.js` e foram reproduzidas sem alteração em `react-app/src/domain/freightCalculations.js` para iniciar a migração com testes:

- Base da comissão = valor do frete menos descontos gerais; subtrai também o pedágio apenas quando `deductToll` está marcado; a base mínima é zero.
- Comissão fixa é um valor; comissão percentual é calculada sobre a base.
- Bônus é separado da base da comissão.
- A fórmula legada de custo soma comissão, bônus, pedágio, combustível real e outros custos.
- A fórmula legada de lucro subtrai descontos, pedágio, combustível real, comissão, bônus e outros custos do valor do frete.
- A função legada `freightNet` tem sua própria fórmula e foi mantida literalmente, sem “corrigir” ou unificar regras por conta própria.

O módulo novo ainda não está conectado às telas e não substitui as funções legadas. Isso evita uma alteração financeira invisível antes de comparar os resultados em cenários reais.

## Verificações estáticas realizadas

- Foram identificados 193 atributos `id` no HTML principal, todos únicos.
- Os formulários encontrados incluem login, funcionário, caminhão, categoria, frete, despesa e pagamento.
- Foram identificados os sete painéis principais: dashboard, fretes, despesas, contas a receber, contas a pagar, cadastros e relatórios.
- Existe uma referência em `app.js` a `ocrRawText` que não aparece como ID literal no HTML; pode ser elemento criado dinamicamente e precisa ser validado no fluxo de OCR.
- Não foram executados login real, chamadas ao Supabase, importação XLSX, OCR, testes de navegador ou build de produção nesta auditoria.
- As políticas SQL foram lidas estaticamente, mas não foram executadas nem testadas no projeto Supabase real.

## Critérios obrigatórios antes de considerar a migração concluída

1. Migrar todas as telas e formulários para componentes React sem remover recursos do legado.
2. Separar domínio financeiro, componentes, formulários, relatórios, autenticação e persistência em módulos pequenos.
3. Integrar a camada de dados React à API Supabase existente, mantendo compatibilidade com os dados e o cache atuais.
4. Comparar os cálculos antigos e novos com casos de teste representativos e dados de exemplo sem sobrescrever dados reais.
5. Validar login, redefinição de senha, perfil visitante, sincronização, recuperação de conexão e prevenção de gravações por visitante.
6. Verificar cada tela em computador e celular, incluindo os ajustes visuais já solicitados.
7. Testar importação/exportação, OCR, filtros, pagamentos parciais, parcelas e CRUD de cadastros.
8. Executar testes automatizados e build de produção; revisar erros de console e caminhos dos assets.
9. Só depois da validação, trocar a entrada publicada para React. Manter uma rota/plano de retorno para o HTML antigo até a aprovação.

## Limite desta etapa

Esta branch inicia a migração segura das regras financeiras e adiciona testes de regressão, sem alterar a aplicação legada. Ela **não representa uma migração completa nem comprova funcionamento em navegador ou Supabase**.
