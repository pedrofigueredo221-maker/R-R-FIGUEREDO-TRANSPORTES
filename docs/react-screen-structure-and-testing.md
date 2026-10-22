# Migração React: telas, layout e roteiro de validação

Esta branch é uma etapa empilhada sobre a PR #18. O CI do projeto deve compilar a versão React e executar os testes automatizados nesta PR. A PR #18 precisa ser aceita antes de esta branch poder ser integrada à `main`; não mesclar esta branch diretamente na `main`.

## Organização

- `react-app/src/screens/OverviewPage.jsx`: visão geral e indicadores mensais.
- `react-app/src/screens/FreightsPage.jsx`: ponto de entrada da área de fretes.
- `react-app/src/screens/FreightForm.jsx`: formulário especializado de fretes e resumo financeiro ao vivo.
- `react-app/src/screens/ExpensesPage.jsx`: ponto de entrada de despesas e manutenção.
- `react-app/src/screens/ReceivablesPage.jsx`: ponto de entrada de contas a receber.
- `react-app/src/screens/PayablesPage.jsx`: ponto de entrada de contas a pagar.
- `react-app/src/screens/ReportsPage.jsx`: relatórios gerenciais.
- `react-app/src/screens/CadastrosPage.jsx`: ponto de entrada dos cadastros.
- `react-app/src/components/DataTable.jsx` e `StatCard.jsx`: componentes reutilizáveis.
- `react-app/src/lib/formatters.js`: formatação de valores e datas.
- `react-app/src/styles.css`: estilos base existentes.
- `react-app/src/styles/screens.css`: refinamentos responsivos e estilos específicos do React.

Para preservar as operações já migradas, o estado compartilhado e algumas rotinas de edição continuam centralizados em `EditablePage.jsx nesta etapa. A separação da camada de apresentação foi iniciada; a extração completa de toda a lógica de formulário em hooks/serviços independentes é uma etapa posterior, após validação funcional.

## Ajustes de interface incluídos

- Formulário de frete com grade de três colunas em telas largas e adaptação para telas menores.
- Gasto estimado de combustível ao lado do gasto real; estimativa calculada por litros × preço do diesel.
- Resumo financeiro em duas colunas, com valores brancos em negrito e maior destaque.
- Checkbox de desconto de pedágio compacto e alinhado, com explicação da regra.
- Destaque verde para saldo a receber e vermelho para saldo a pagar.
- Ajustes de foco por teclado, espaçamento dos campos, navegação lateral e tabelas com rolagem horizontal em telas estreitas.
- O salvamento usa apenas as colunas `data` e `version` de `public.app_state`, compatíveis com o esquema documentado; não presume a existência de `updated_at`.

## Testes manuais necessários antes de produção

1. Entrar e sair; atualizar a página e verificar a restauração da sessão.
2. Conferir a visão geral, faturamento, lucro estimado, recebíveis e contas a pagar.
3. Criar, editar e excluir um frete sem recebimentos; conferir que o histórico com recebimentos não pode ser apagado pela tela.
4. Conferir base e comissão com e sem a opção de descontar pedágio.
5. Conferir gasto estimado versus gasto real de combustível.
6. Criar despesa à vista e parcelada; registrar pagamentos parciais e totais.
7. Conferir cadastros de funcionários, caminhões e categorias, incluindo bloqueio de exclusão de categoria vinculada a despesas.
8. Testar os relatórios por mês, os filtros e os valores financeiros.
9. Entrar como visitante e confirmar que não consegue executar ações pela interface; após o SQL de permissões ser aplicado, testar também escrita direta no Supabase.
10. Abrir duas sessões em computadores diferentes, editar o mesmo estado e verificar se o conflito é sinalizado sem sobrescrever silenciosamente a última gravação.
11. Testar em largura de desktop, tablet e celular.

## Limitações que permanecem

- A interface React ainda usa `public.app_state` como um único documento JSON.
- Modo offline completo, servidor local compartilhado e sincronização posterior ainda não estão integrados. A PR #20 contém um protótipo isolado de armazenamento local, não conectado ao sistema.
- Nenhum backup real foi executado por esta branch e nenhuma migração SQL foi executada no banco.
- Não publicar em produção antes de backup restaurável, configuração de permissões e testes com contas reais.
