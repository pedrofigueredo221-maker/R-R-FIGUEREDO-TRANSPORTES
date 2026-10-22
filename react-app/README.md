# Área de migração React

Esta pasta contém o início isolado da migração para React.

## Executar localmente

Requer Node.js 18 ou superior.

1. Na pasta raiz do repositório, execute `npm install`.
2. Execute `npm run dev`.
3. Abra o endereço local informado pelo Vite.

## Segurança da migração

- O sistema legado continua sendo servido pelo `index.html` da raiz.
- A entrada React fica em `react-app/index.html` e é construída separadamente.
- O build é gerado em `dist-react/`, sem limpar ou substituir os arquivos da raiz.
- Esta etapa não conecta o React ao banco e não altera os dados.
- Não copie credenciais privadas para os arquivos React.

A próxima etapa deve migrar um componente pequeno e isolado do sistema atual, depois de confirmar como ele depende dos elementos HTML e das funções legadas.
