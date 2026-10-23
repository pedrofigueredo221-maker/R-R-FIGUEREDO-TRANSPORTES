# R&R Figueredo Transportes — Sistema de gestão

Aplicação web React para acompanhar fretes, despesas, recebimentos, pagamentos, cadastros e relatórios da transportadora.

## Executar localmente

Requisitos: Node.js 22 ou superior.

1. Abra um terminal na raiz do repositório.
2. Execute `npm install`.
3. Execute `npm run dev`.
4. Abra o endereço local informado pelo Vite.

Para gerar a versão de publicação, execute `npm run build`. O site compilado é criado em `dist-react/`.

## Estrutura do projeto

- `react-app/index.html`: entrada principal da aplicação.
- `react-app/reset-main.jsx` e `react-app/redefinir-senha.html`: fluxo React de recuperação de senha.
- `react-app/src/App.jsx`: autenticação, navegação e coordenação geral.
- `react-app/src/screens/`: telas organizadas por assunto.
- `react-app/src/components/`: componentes reutilizáveis.
- `react-app/src/domain/`: regras de negócio e testes financeiros.
- `react-app/src/styles.css`: estilos globais e componentes comuns.
- `react-app/src/styles/screens.css`: estilos específicos das telas.
- `banco-de-dados/supabase/app-config.js`: configuração publicável usada pelo navegador.
- `vite.config.js`: build React, imagens e configuração Supabase para desenvolvimento/publicação.

O projeto mantém apenas uma aplicação principal: React. Scripts antigos que inicializavam a versão HTML/JavaScript foram removidos para evitar dois pontos de entrada e estilos concorrentes.

## Testes e validação

- `npm test`: executa os testes automatizados das regras de negócio.
- `npm run build`: verifica se as duas páginas React compilam para publicação.
- `node scripts/check-project.mjs`: verifica arquivos de entrada, configuração e ausência dos arquivos legados removidos.

A compilação e os testes automatizados não substituem testes manuais de login, recuperação de senha, permissões de visitante e operações financeiras com usuários de teste. Nunca use chaves administrativas do Supabase no navegador ou no repositório.
