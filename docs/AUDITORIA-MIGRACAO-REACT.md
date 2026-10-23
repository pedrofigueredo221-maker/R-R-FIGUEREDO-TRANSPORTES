# Auditoria de arquitetura — aplicação React única

## Estado desta refatoração

O objetivo é manter uma única interface de aplicação: React. A versão HTML/JavaScript antiga foi identificada como uma segunda implementação que aumentava o risco de alterações divergentes e dificultava saber qual CSS controlava a tela publicada.

## Estrutura mantida

- `react-app/index.html`: entrada do sistema.
- `react-app/redefinir-senha.html`: entrada adicional para recuperação de senha, renderizada por React.
- `react-app/src/App.jsx`: autenticação, sessão e navegação.
- `react-app/src/EditablePage.jsx`: coordenação dos fluxos de edição.
- `react-app/src/screens/`: telas por domínio funcional.
- `react-app/src/components/`: componentes reaproveitáveis.
- `react-app/src/domain/`: cálculos e regras de negócio testáveis.
- `react-app/src/styles.css`: estilos globais, botões, campos e estrutura comum.
- `react-app/src/styles/screens.css`: layout e estilos específicos de tela.
- `banco-de-dados/supabase/app-config.js`: configuração publicável compartilhada pelo build.

## Achados de duplicidade visual

1. O resumo financeiro de frete possuía regras em dois arquivos CSS e múltiplos blocos de substituição.
2. Havia estilos claros antigos e estilos grafite finais para os mesmos seletores.
3. Regras mobile reescreviam a grade do resumo e uma regra com `!important` anulava os breakpoints anteriores.
4. O CSS global React estava minificado em grande parte, tornando a leitura e a manutenção difíceis.
5. A raiz do repositório continha a aplicação legada completa em paralelo com a entrada React.
6. Os fluxos de verificação e publicação ainda dependiam de arquivos da implementação legada.

## Alterações aplicadas nesta branch

- Reformatado o CSS React principal em regras legíveis.
- Removidas declarações repetidas e conflitantes do resumo financeiro em `styles.css`.
- Consolidado o resumo financeiro em uma única seção identificada de `styles/screens.css`, com um breakpoint mobile explícito.
- Corrigido o total de custos exibido no resumo React para usar a função de domínio `freightCost`, incluindo comissão, bônus, pedágio, combustível real e outros custos.
- Implementado o fluxo de recuperação de senha como página React adicional, preservando a URL pública `redefinir-senha.html`.
- Atualizados os workflows para validar sintaxe de configuração, estrutura React, testes e build sem depender da versão antiga.
- Substituída a auditoria estática dos IDs do HTML antigo por verificações da estrutura React.
- Preparada a remoção dos pontos de entrada, CSS, sincronização e configuração que pertenciam à aplicação legada.

## Limites de validação

A revisão de código não equivale a uma validação visual em navegador. É necessário que o workflow execute `npm test` e `npm run build`; depois, conferir em desktop e celular o painel, formulários, resumo financeiro, menu responsivo, login e recuperação de senha. A autenticação e o controle de permissões devem ser testados com contas de teste antes da publicação.

Nenhum dado, tabela ou política do Supabase foi alterado por esta refatoração. A configuração pública continua sendo fornecida por `banco-de-dados/supabase/app-config.js`.
