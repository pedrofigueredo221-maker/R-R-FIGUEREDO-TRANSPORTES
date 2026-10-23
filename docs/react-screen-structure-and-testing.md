# Estrutura das telas React e roteiro de validação

A aplicação tem uma única interface de gestão em React. A página de recuperação de senha também é renderizada em React, mas é uma entrada separada para que os links de e-mail do Supabase continuem funcionando.

## Organização do código

- `react-app/src/App.jsx`: autenticação, sessão, navegação e coordenação geral.
- `react-app/src/EditablePage.jsx`: fluxo de edição compartilhado entre telas.
- `react-app/src/screens/`: fretes, despesas, contas, cadastros, relatórios e visão geral.
- `react-app/src/components/`: componentes reutilizáveis, como cartões e tabelas.
- `react-app/src/domain/`: cálculos financeiros e regras de recebíveis, com testes.
- `react-app/src/lib/formatters.js`: formatação de moeda e datas.
- `react-app/src/styles.css`: estilos globais, layout comum, botões, campos e formulários.
- `react-app/src/styles/screens.css`: regras específicas das telas e layouts responsivos.
- `react-app/src/PasswordReset.jsx`: validação do link de recuperação e alteração de senha.
- `react-app/reset-main.jsx`: ponto de entrada da página de recuperação.
- `vite.config.js`: build das duas páginas React e cópia dos recursos compartilhados.

## Convenções de apresentação

1. Cada componente visual deve ter um arquivo principal de estilos responsável por sua aparência.
2. Regras específicas de tela ficam em `styles/screens.css`; estilos globais não devem redefinir o mesmo componente sem uma razão clara.
3. Breakpoints devem ser explícitos e organizados por finalidade. Evitar `!important` para vencer regras anteriores.
4. Resumos financeiros e cartões devem ter uma regra base e ajustes mobile pontuais, sem blocos repetidos no final do arquivo.
5. Componentes compartilhados devem ser reutilizados em vez de copiar o mesmo markup/estilo para cada tela.
6. Antes de remover regras CSS, comparar a tela em desktop, tablet e celular para confirmar que a cascata resultante mantém a aparência desejada.

## Ajustes de layout desta auditoria

- Resumo financeiro de frete centralizado em uma única seção CSS, sem versões claras/grafite concorrentes e sem `!important`.
- Formulário de frete com duas colunas no layout base e uma coluna em telas estreitas.
- Modal de cadastro com uma única definição de desktop e uma única regra mobile, removendo regras que alternavam alinhamento central/inferior.
- Estilos de erro duplicados consolidados.
- CSS formatado em blocos legíveis para facilitar a inspeção e manutenção.
- Total de custos no resumo React calculado por `freightCost`, incluindo comissão, bônus, pedágio, combustível real e outros custos.

## Roteiro de teste manual

1. Entrar e sair; atualizar a página e verificar a restauração da sessão.
2. Conferir a visão geral, faturamento, lucro estimado, recebíveis e contas a pagar.
3. Criar, editar e excluir um frete de teste; conferir os cálculos do resumo.
4. Conferir comissão percentual/fixa, desconto geral e opção de descontar pedágio da base.
5. Conferir estimativa e gasto real de combustível, outros custos e bônus.
6. Criar despesa à vista e parcelada; registrar pagamentos parciais e totais.
7. Conferir cadastros de funcionários e caminhões, inclusive modal em telas estreitas.
8. Conferir relatórios, filtros e valores financeiros.
9. Entrar como visitante e confirmar que não consegue gravar; validar também as permissões RLS com uma conta de teste.
10. Abrir duas sessões de teste e conferir a detecção de conflito de gravação.
11. Testar a recuperação de senha com um e-mail de teste e confirmar a volta ao login.
12. Conferir desktop, tablet e celular, inclusive rolagem horizontal das tabelas e foco por teclado.

## Validação antes de produção

Execute `node scripts/check-project.mjs`, `npm test` e `npm run build`. Depois teste os fluxos reais com contas de teste. Nenhuma validação estática substitui a conferência visual no navegador nem o teste de autenticação e RLS no projeto Supabase.
