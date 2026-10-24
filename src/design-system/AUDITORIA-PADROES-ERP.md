# Auditoria de padronização — ERP R&R Figueredo Transportes

**Data:** 23/10/2026. **Escopo:** inspeção estática da branch `main` e verificação da PR #84 ainda aberta. Não foram alterados dados, fórmulas ou telas protegidas. Os pontos abaixo precisam de validação visual e funcional antes de qualquer migração.

## Inventário de padrões

| Área | Implementação atual | Diagnóstico | Direção |
| --- | --- | --- | --- |
| Inclusão | Botões locais em `Fretes`, `Despesas` e `Cadastros`; componente `AddRecordButton` em PR #84 | **Em padronização** | Após aprovação da #84, usar componente único nas novas telas e conferir cada ação por perfil. |
| Atualização | `RefreshButton.jsx` utilizado no controlador comum e Balanço Geral | **Compartilhado** | Preservar a semântica de recarregar, ícone e estados de carregamento. |
| Filtros | Barra centralizada no `EditablePage.jsx`, período independente no Balanço Geral; `recordSearch.js` | **Parcial** | Extrair apresentação de filtros em componente, sem modificar busca, mês ou origem dos dados. |
| Limpar filtros | Botão dentro do JSX de `EditablePage.jsx` | **Centralizado só nas telas do controlador** | Criar botão visual reutilizável com callback da tela. |
| Formulários | `FreightForm`, `RecordForm`, `FormularioFuncionario` e campos locais | **Parcial** | Compartilhar estilos, acessibilidade, rótulos e estados, sem unificar regras de validação financeira por engano. |
| Modais | `FormDialog.jsx` e estruturas de diálogo em telas | **Parcial** | Verificar foco, fechamento por Escape, scroll, leitura e acessibilidade; migrar gradualmente para `FormDialog`. |
| Tabelas | `DataTable.jsx`, tabelas JSX próprias e CSS compartilhado | **Parcial** | Evoluir cabeçalhos, estado vazio, ordenação e células numéricas; duplo clique somente em registros individuais. |
| Ações por linha | `Actions` no `EditablePage.jsx`, botões próprios em outras telas | **Parcial** | Extrair componente de ações com permissões, rótulos e tamanhos consistentes. |
| Trajeto | `RouteDisplay.jsx` compartilhado | **Compartilhado** | Manter seta, espaçamento e acessibilidade coerentes. |
| Indicadores | `StatCard.jsx` e cards especializados no Balanço Geral | **Parcial** | Padronizar superfície e tipografia sem igualar indevidamente indicadores com significados diferentes. |
| Feedback | `showError`, avisos locais e `empty-state` | **Parcial** | Padronizar estados de erro, vazio, salvando e sucesso, sem declarar sucesso antes do banco confirmar. |
| Formatação | `src/lib/formatters.js` + funções locais `number`/`money` | **Parcial** | Reutilizar formatação de moeda e data; **não** confundir apresentação com cálculo ou arredondamento financeiro. |
| CSS | `screens.css`, `corporate-table-headings.css`, estilos por tela e `styles.css` | **Sobreposições possíveis** | Inventariar especificidade e media queries antes de remover regras; não modificar estilos de Login ou Menu Lateral. |

## Gaps e riscos a priorizar

1. **Ações e permissões (alta):** botões de editar, excluir, pagar e receber precisam de aparência coerente, mas autorização real continua dependendo das regras de acesso e do Supabase; ocultar botão não é segurança.
2. **Confirmação de gravação (alta):** padronizar feedback de salvamento sem criar falsos positivos; alterações em persistência devem ter PR e testes próprios.
3. **Formulários e campos obrigatórios (alta):** preservar campos existentes em criar/editar, destacar vazios e não perder valores legados; revisar fluxos por tela antes de extrair componente.
4. **Filtros (média):** padronizar apresentação, mas preservar combinação de busca/período e resultados para não afetar relatórios.
5. **Tabelas (média):** há tabelas JSX locais apesar de `DataTable`; avaliar compatibilidade com ordenação, responsividade e ações antes de substituir.
6. **CSS (média):** múltiplos estilos compartilhados e por tela exigem testes desktop/celular para evitar conflitos de cascata.
7. **Acessibilidade (média):** padronizar `aria-label`, `type="button"`, foco e teclas, especialmente em modais e ações apenas com ícones.

## Ordem de execução proposta

**Etapa 1 — PR #84:** concluir/validar `AddRecordButton` e nova barra de filtros, sem duplicar alterações em outra PR.

**Etapa 2 — Botões secundários e feedback:** criar componentes de apresentação para Limpar filtros, Cancelar e ações de linha; manter callbacks e autorização em cada tela. Uma PR pequena, testes por fluxo.

**Etapa 3 — Tabelas e filtros:** padronizar renderização e CSS em telas compatíveis, com validação de busca, ordenação, duplo clique e responsividade. Não alterar consultas ou cálculos.

**Etapa 4 — Formulários e modais:** unificar apenas elementos visuais seguros; conferir paridade de campos e proteção de dados em cada tela.

**Etapa 5 — CSS e documentação:** remover duplicações comprovadas, consolidar tokens de cores e espaçamento, revisar breakpoints. Login e Menu Lateral só com autorização explícita.

## Critérios obrigatórios de aceitação

- A PR visual não altera `src/domain/`, migrações, RLS, rotinas de persistência, fórmulas de comissão, bônus, pedágio, custos ou recebimentos.
- Nenhum dado é alterado, excluído ou migrado por uma padronização visual.
- Login e Menu Lateral continuam congelados; qualquer impacto direto ou indireto exige autorização.
- O usuário Visitante não ganha permissão de gravação por mudanças de interface.
- Validar build/CI e cenários de criação, edição, filtros e leitura no navegador antes de merge.
- Sempre branch e PR detalhada, sem merge automático.

**Limitação:** revisão estática; não equivale a teste de navegador ou auditoria do banco de produção.
