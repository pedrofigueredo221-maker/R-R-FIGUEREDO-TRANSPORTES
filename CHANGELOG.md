# Histórico de alterações — R&R Figueredo Transportes

## 2026-10-21 — Correção da tela após atualizar

**Pull Request:** corrigir restauração da tela após atualização.

### Problema
Ao atualizar a página, o Supabase podia encontrar uma sessão salva e abrir o sistema automaticamente, mesmo quando a tela anterior era o login.

### Alterações
- `sync.js`: registra em `sessionStorage` qual tela estava aberta (login ou sistema autenticado).
- `sync.js`: ao iniciar, restaura o painel somente se a última tela desta aba era o sistema autenticado e ainda existe uma sessão válida.
- `sync.js`: se a última tela era o login, mantém o login após atualizar.
- `index.html`: atualiza a versão de cache do script de sincronização para carregar a correção.

### Comportamento esperado
- Login aberto + atualizar: continua no login.
- Sistema autenticado aberto + atualizar: continua no sistema, se a sessão ainda for válida.
- Sair: a sessão é encerrada e o login permanece aberto.
- O estado da tela é separado por aba e sobrevive a atualizações nessa mesma aba.

### Validação
A alteração foi conferida por correspondência dos trechos de código e revisão lógica. Não foi realizado teste visual automatizado no navegador; validar os dois fluxos no site após mesclar o PR.
