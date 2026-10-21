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


## 2026-10-21 — Resumo financeiro do frete em três colunas

### Objetivo
Facilitar a leitura da prévia financeira ao cadastrar ou editar um frete, mantendo o estilo visual já aprovado.

### Alterações
- `styles.css`: resumo financeiro passa de duas para três colunas em telas maiores.
- `styles.css`: textos brancos do resumo aumentados em 4 px e colocados em negrito: rótulos de 13 para 17 px e valores de 14 para 18 px.
- `styles.css`: pequenos ajustes de espaçamento e alinhamento para melhorar a leitura dos rótulos e valores.
- `styles.css`: layout responsivo mantém duas colunas em telas médias e uma coluna em telas estreitas.
- `index.html`: versão do CSS atualizada para `v=31`, evitando cache antigo.

### O que foi preservado
- Todos os campos do cadastro de frete.
- Cores do resumo financeiro, incluindo custo total em vermelho e lucro estimado em verde.
- Fórmulas e lógica financeira; nenhum JavaScript foi alterado.

### Validação
Revisão das regras CSS e conferência dos arquivos. A aparência final ainda deve ser validada no navegador após mesclar o PR.



## 2026-10-21 — Perfil Visitante somente leitura

### Objetivo
Permitir que o e-mail `pedrofogofogop@gmail.com` consulte os dados sem poder criar, editar ou excluir informações, preservando `pedrofigueredo221@gmail.com` como conta administrativa.

### Alterações
- `config.js`: adiciona o usuário de login `VISITANTE` vinculado ao e-mail visitante.
- `sync.js`: identifica o perfil visitante pelo e-mail autenticado, evita migração/seed de dados locais para esse perfil e bloqueia qualquer tentativa de sincronização de escrita no cliente.
- `app.js` e `styles.css`: ocultam ações de alteração, mostram aviso de somente leitura e interceptam envios/cliques de mutação no navegador.
- `supabase-visitor-role.sql`: migração para permitir SELECT ao administrador e visitante, mas permitir INSERT/UPDATE somente ao administrador.
- `supabase.sql` e `supabase-login.sql`: atualizam as políticas de leitura para incluir o visitante.
- `index.html`: atualiza versões de cache dos arquivos alterados.

### Segurança e ativação obrigatória
- O bloqueio visual não é tratado como segurança: o banco precisa receber a migração `supabase-visitor-role.sql` para aplicar RLS no servidor.
- Criar manualmente o usuário `pedrofogofogop@gmail.com` em Supabase → Authentication → Users e definir/enviar uma senha. A integração GitHub não cria usuários do Supabase Auth nem envia convites.
- No login do site, informar `VISITANTE` como usuário e a senha criada para esse e-mail.
- Aplicar a migração SQL antes de liberar o login visitante.

### Validação
Revisão estática das alterações. Não foi possível testar autenticação real, RLS no projeto Supabase ou o fluxo visual no navegador nesta etapa. Testar leitura com visitante e confirmar que UPDATE/INSERT falham para ele e funcionam para a conta administrativa antes de uso real.


## 2026-10-21 — Ajuste do layout do frete e nome de acesso visitante

- O usuário de acesso somente leitura passa a se chamar `VISITANTES`, mantendo o e-mail alternativo configurado e a conta administrativa original.
- O resumo financeiro do cadastro de frete voltou para duas colunas em telas maiores e uma coluna em telas estreitas.
- O formulário de frete foi ampliado lateralmente e as quatro seções foram dispostas em duas colunas em telas largas; os campos editáveis usam três colunas por seção, com adaptação para tablets e celulares.
- Ajustados espaçamentos e tamanho dos rótulos para manter leitura e evitar excesso visual sem remover campos ou alterar fórmulas.
- A senha não é armazenada no código/repositório; deve ser definida na conta Supabase. Recomenda-se não usar senhas fracas.


## 2026-10-21 — Cadastro de frete em duas colunas por seção

- Reduzida a largura máxima do modal de frete de 1580 px para 1380 px, mantendo o formulário confortável e menos exagerado.
- Mantidas as quatro seções em duas colunas em telas largas.
- Cada seção passa a exibir dois campos por linha; nas duas seções lado a lado, ficam até quatro campos distribuídos na largura total.
- Ajustados espaçamentos, altura dos campos e preenchimentos internos para compactar o formulário sem remover informações.
- Em telas menores, as seções se empilham e os campos se adaptam; em celulares estreitos, o formulário usa uma coluna.
- Mantido o resumo financeiro em duas colunas, com textos brancos maiores e em negrito.
- Nenhuma fórmula ou regra de negócio foi alterada.

### Validação
Revisão estática dos arquivos. O perfil `VISITANTES` já foi confirmado pelo usuário como funcionando. O layout precisa ser conferido visualmente no navegador após a publicação; nenhuma validação visual automatizada foi realizada nesta alteração.


### Complemento da revisão — organização dos campos de combustível
- Ajustada a ordem visual dos campos na seção de combustível para exibir o gasto real e a estimativa lado a lado, sem alterar a ordem dos dados armazenados nem os cálculos.
- Atualizada a versão de cache do CSS para `v=35`.
