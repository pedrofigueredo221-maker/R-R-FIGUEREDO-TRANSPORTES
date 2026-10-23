# Auditoria técnica e visual — R&R Figueredo Transportes

**Data:** 22/10/2026 (horário de Brasília)  
**Base analisada:** branch `main`, incluindo as PRs #37, #38 e #39 já mescladas.  
**Branch desta revisão:** `audit/revisao-extrema-2026-10-22`

## Escopo efetivamente verificado

- Entrada legada: `index.html`, `styles.css`, `app.js`, `sync.js`, `js/core/utils.js`, `js/core/startup.js` e configuração pública do Supabase.
- Entrada React: `react-app/index.html`, `react-app/src/main.jsx`, `react-app/src/App.jsx`, `react-app/src/EditablePage.jsx`, telas de fretes/cadastros/visão geral, `react-app/src/screens/FreightForm.jsx`, `react-app/src/domain/freightCalculations.js`, `react-app/src/styles.css` e `react-app/src/styles/screens.css`.
- Configuração de build/teste: `package.json`, `vite.config.js`, `.gitignore` e README.
- Histórico recente de pull requests e estado de CI reportado para o commit de merge da PR #39.

> **Limite importante:** esta é uma auditoria estática de arquivos acessíveis pela integração do GitHub. Não houve execução local do build, renderização real no navegador, inspeção visual por screenshot, autenticação real no Supabase nem validação de políticas RLS. O clone local não pôde ser obtido neste ambiente por indisponibilidade de rede. Portanto, este documento não declara o sistema inteiro aprovado em produção.

## Achados prioritários

### P1 — Resumo financeiro apresentava critérios diferentes entre implementações

- No React, o indicador “Custos totais da viagem” somava custos operacionais e bônus, mas deixava de fora a comissão, apesar de a função de domínio `freightCost` incluir comissão, bônus, pedágio, combustível real e outros custos.
- Na versão legada, o resumo classificava o desconto como parte do custo total, embora o lucro já o subtraísse. Isso tornava o significado do indicador “Custos totais” menos claro.
- **Correção aplicada nesta branch:** o React passa a usar a função central `freightCost`; o resumo legado passa a separar desconto de custos. A fórmula do lucro legado foi preservada matematicamente.

### P1 — CSS acumulado e sobrescritas são uma causa plausível de divergência visual

Levantamento estático dos arquivos atuais:

- `styles.css`: aproximadamente 92,8 KB, 1.258 linhas, 1.047 blocos de regras CSS, 144 ocorrências de `!important`.
- O seletor `#freightDialog .freight-calculations-grid` aparece 13 vezes; `#freightDialog .freight-calculation-item` aparece 10 vezes; seletores relacionados aos valores e rótulos também se repetem.
- Na versão React, `styles.css` e `styles/screens.css` definem estilos para o mesmo resumo financeiro. Há múltiplas regras para `.freight-editor .freight-summary`, `.freight-summary-grid` e `.freight-summary-item`, inclusive regras claras e grafite em momentos diferentes da cascata.
- **Conclusão:** não é seguro continuar acrescentando “camadas finais” indefinidamente. A próxima etapa de refatoração visual deve consolidar cada componente em uma única fonte de estilo, remover regras antigas após comparar o resultado e validar os tamanhos desktop/mobile. Essa consolidação ampla não foi feita às cegas nesta alteração porque a validação visual no navegador não está disponível aqui.

### P1 — Há duas entradas de aplicação com implementações diferentes

- `index.html` carrega a aplicação legada via `app.js` e `sync.js`.
- `react-app/index.html` inicia a aplicação React, compilada pelo Vite para `dist-react`.
- As duas versões possuem markup, estilos e parte das regras de negócio próprias. Uma correção em React não garante que a página publicada via entrada legada mude, e vice-versa.
- **Ação necessária antes de uma refatoração maior:** confirmar qual artefato está publicado no GitHub Pages e escolher a implementação oficial. Não remover a versão legada nem alterar o fluxo de publicação sem essa confirmação.

### P2 — Cobertura automatizada era insuficiente para as regras financeiras

- O script `npm test` usa `node --test`, mas não havia um conjunto de testes financeiros localizado no caminho convencional consultado.
- **Correção aplicada nesta branch:** adicionada uma suíte de testes unitários para as regras centrais de comissão, custo, lucro e tratamento de valores ausentes. Sete casos passaram em um harness isolado com Node.js; como o checkout completo e as dependências não puderam ser baixados neste ambiente, a execução de `npm test` no repositório real e a confirmação no CI continuam pendentes.

### P2 — Validação automatizada do merge não foi comprovada

- A consulta de status e de execuções de workflow para o commit de merge da PR #39 não retornou verificações.
- Isso não prova que nunca houve testes em outro commit; significa que não foi possível comprovar um resultado de CI para aquele commit através das consultas disponíveis.

## Mudanças feitas nesta branch

1. Corrige a composição do indicador de custos na versão legada sem alterar o resultado matemático do lucro estimado.
2. Usa a função de domínio `freightCost` no resumo React para incluir comissão e demais custos já modelados.
3. Adiciona testes unitários para as regras financeiras centrais.

## Plano restante antes de considerar o projeto aprovado

1. Instalar dependências em ambiente com acesso ao npm e executar `npm test` e `npm run build`.
2. Corrigir toda falha de sintaxe, build ou teste e anexar evidência do CI.
3. Executar a versão efetivamente publicada e comparar a tela de frete com a prévia aprovada em desktop e celular.
4. Consolidar as regras CSS do resumo financeiro e, depois, das telas de cadastro, menu, dashboard, tabelas e modais; remover duplicações com teste visual de regressão.
5. Conferir responsividade em larguras pequenas, overflow horizontal, foco de teclado, labels, estados vazios/erro/carregamento e consistência dos textos em português.
6. Revisar todos os fluxos de gravação/edição/exclusão e a integridade de fretes, recebimentos, parcelas e cadastros.
7. Validar no projeto Supabase as políticas RLS e permissões reais; não realizar escrita, migração ou alteração de dados de produção durante esta auditoria.
8. Inventariar todos os arquivos e pastas do repositório, identificar arquivos obsoletos/duplicados e propor renomeações somente quando todas as referências puderem ser atualizadas com segurança.

## Estado ao final desta etapa

- [x] Revisão estática de arquivos centrais e histórico recente.
- [x] Problema de divergência do custo total identificado e corrigido na branch.
- [x] Testes unitários financeiros adicionados.
- [x] Sete testes unitários executados com Node.js em um harness isolado equivalente ao módulo de cálculo; execução de `npm test` no checkout completo ainda pendente.
- [ ] Build React executado.
- [ ] Comparação visual real no navegador.
- [ ] Auditoria de todas as pastas e referências concluída.
- [ ] Validação das políticas RLS no Supabase.
