# Auditoria integral — R&R Figueredo Transportes
**Data:** 24/10/2026 · **Base:** `main` · **Natureza:** revisão estática não destrutiva e ajustes pontuais em branch isolada.

## Escopo e inventário
- Árvore Git recursiva consultada: **89 entradas**, não truncada; **64 arquivos versionados** (contagem derivada da lista de arquivos obtida na consulta).
- Pastas e áreas inventariadas: `.github/workflows`, `banco-de-dados/supabase`, `imagens`, `scripts`, `security`, `src/components`, `src/demo`, `src/design-system`, `src/domain`, `src/lib`, `src/screens`, `src/styles`, `supabase/migrations`, além de arquivos da raiz.
- Inspeção detalhada de módulos centrais: `App.jsx`, `EditablePage.jsx`, `Cadastros.jsx`, `Relatorios.jsx`, `PainelInicial.jsx`, `BalanceDetailDialog.jsx`, componentes de período, estilos compartilhados, fórmulas de frete, testes financeiros, políticas SQL e workflow de publicação.
- GitHub Actions consultado: o último check de proteção do Login consultado estava **aprovado**; o último deploy consultado estava **em andamento**. Esses estados podem mudar depois desta auditoria.
- **Limitação importante:** inventário integral da árvore não equivale a testes de execução de cada arquivo; não houve login real, acesso ao banco de produção, execução local de navegador nem restauração de backup. Não declarar validação integral de comportamento.

## Achados e classificação
### A1 — vínculo motorista/caminhão pode ser apagado involuntariamente (alto)
O formulário do funcionário mostrava o caminhão encontrado em `trucks[].driverId` como valor derivado, mas `saveRecord` lia apenas `form.truckId`. Em edição de motorista antigo, `form.truckId` poderia estar indefinido e o salvamento removia o vínculo mesmo sem alteração no seletor. **Corrigido nesta PR**: ausência da propriedade mantém vínculo existente; string vazia explícita continua desvinculando.

### A2 — regras CSS duplicadas no filtro de período (médio)
`src/styles/period-range-filter.css` continha declarações repetidas e conflitantes para largura 150/132px, fonte 12/14/16px, distância 10/8/4px e regras responsivas. **Consolidado nesta PR** num conjunto único: 132px, 16px, gap 4px, altura 42px e alinhamento dos botões, sem atingir Login ou Menu Lateral. **Risco residual:** em certos navegadores, o calendário nativo pode ocupar largura demais; exige conferência visual antes do merge.

### A3 — duplicação de lógica de intervalo de datas (médio, pendente)
`EditablePage.jsx`, `Relatorios.jsx`, `PainelInicial.jsx` e `BalanceDetailDialog.jsx` implementam individualmente `inRange`, com semânticas diferentes quando um dos campos está vazio. Recomenda-se extrair utilitário com testes antes de unificar, evitando mudança silenciosa no balanço financeiro.

### A4 — relatórios de recebimento e despesa merecem conciliação (alto, pendente)
Em `Relatorios.jsx`, `Recebido de clientes` soma `freight.received` dos fretes cuja **data da viagem** está no período; recebimentos de viagens anteriores realizados dentro do período podem não aparecer. O painel de despesas usa a data de criação para saldos em aberto, enquanto pagamentos são filtrados pela data efetiva. Requer definição contábil explícita antes de qualquer correção; **nenhuma fórmula financeira alterada**.

### A5 — identidade visual e responsividade (médio, pendente)
Há regras históricas de `input[type=month]` e vários blocos de sobrescrita em `balanco-geral.css`, apesar do filtro atual ser diário. O cabeçalho de tabelas está padronizado em `corporate-table-headings.css`, mas modais, relatórios e telas estreitas devem passar por revisão visual de 320px, 375px, tablet e desktop. Remover legado apenas após teste de regressão.

### A6 — segurança Supabase e backups (alto, validação externa pendente)
Há SQLs com modelos distintos de controle de escrita (`supabase-visitor-role.sql` baseado em e-mail e migração `20261022_app_state_write_roles.sql` baseada em UUID/permissão). Não presumir qual está aplicado em produção. Confirmar políticas efetivas e permissões de Visitante diretamente no Supabase, além de backup e teste de restauração, antes de qualquer migração.

### A7 — proteção de telas congeladas (crítico, preservado)
A integridade do Login depende do verificador e da referência em `security/login-baseline.json`; não modificar esse trecho, a baseline ou o script sem autorização explícita. Menu Lateral também permanece congelado. Esta PR não toca nesses componentes, na autenticação ou nas políticas.

## Ajustes desta PR
1. Preservar `truck.driverId` ao editar motorista sem alterar o caminhão.
2. Consolidar CSS compartilhado de datas para reduzir duplicidades sem mudar os parâmetros visuais aprovados.
3. Registrar inventário, achados, riscos, limitações e recomendações neste relatório.

## Checklist de validação antes da aprovação
- [ ] GitHub Actions: proteção do Login aprovada.
- [ ] GitHub Actions: testes `npm test`, auditoria estática e build React aprovados.
- [ ] Conferir adicionar/editar motorista mantendo vínculo; alterar caminhão; escolher Não vinculado.
- [ ] Conferir datas 16px, campos 132px e intervalo 4px em Balanço Geral, Fretes, Despesas, Contas e Relatórios.
- [ ] Testar visual desktop e celular; ícone nativo de calendário sem corte.
- [ ] Confirmar que Visitante não escreve **via RLS**; verificar backup restaurável fora do repositório.

## Regras de segurança
Nenhum merge, push direto na main, mudança automática de banco ou edição de Login/Menu Lateral. Todos os ajustes aguardam aprovação na PR.
