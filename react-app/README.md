# Aplicação React

Este diretório contém a interface única do sistema R&R Figueredo Transportes.

## Desenvolvimento
Na raiz do repositório, execute `npm install` e depois `npm run dev`.

## Páginas
- `index.html`: sistema de gestão.
- `redefinir-senha.html`: fluxo de recuperação de senha, também renderizado em React.

## Código
- `src/App.jsx`: autenticação e navegação.
- `src/screens/`: telas do sistema.
- `src/components/`: componentes reutilizáveis.
- `src/domain/`: regras de negócio e testes.
- `src/styles.css`: estilos globais e componentes comuns.
- `src/styles/screens.css`: estilos específicos de telas.

Os dados continuam no Supabase configurado em `banco-de-dados/supabase/app-config.js`. Não altere tabelas, políticas ou dados de produção como parte de uma refatoração visual.
