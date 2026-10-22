# Plano de contingência offline e sincronização

## Objetivo

Permitir que o sistema continue registrando operações durante uma indisponibilidade temporária do Supabase, preservando os lançamentos localmente e sincronizando-os quando a conexão voltar. Manter também backups independentes e recuperáveis.

**Status:** documento de arquitetura; não implementa ainda o modo offline, não executa backup real e não altera o Supabase.

## Arquitetura proposta

1. **Supabase como banco central:** continua sendo a fonte compartilhada entre computadores e usuários quando estiver disponível.
2. **Banco local do navegador:** IndexedDB guarda uma cópia operacional mínima e uma fila persistente de operações pendentes. Não usar GitHub como banco de dados.
3. **Fila de operações idempotentes:** cada criação/edição/exclusão recebe um identificador único, data, usuário, entidade, versão esperada e estado de sincronização. Repetir uma operação não pode criar duplicatas.
4. **Sincronizador:** ao recuperar a conexão, consulta o estado remoto, envia operações pendentes em ordem segura, confirma cada uma e atualiza a cópia local.
5. **Resolução de conflitos:** não sobrescrever silenciosamente mudanças concorrentes. Detectar divergência de versão e pedir reconciliação ou aplicar regras explicitamente testadas.
6. **Backups independentes:** exportações automáticas versionadas em armazenamento privado, com retenção e verificação de integridade. O backup deve ficar fora do repositório público e não depender do mesmo Supabase.
7. **Restauração testada:** documentar e testar restauração em ambiente separado antes de qualquer restauração em produção.

## Etapas obrigatórias

### Etapa 1 — Inventário e proteção
- Confirmar o esquema atual e o formato de `public.app_state`.
- Fazer exportação completa do banco e verificar que o arquivo pode ser lido.
- Confirmar políticas RLS para impedir gravações de usuários visitantes.
- Nunca armazenar chaves secretas, senhas, connection strings ou dados reais da empresa no GitHub público.

### Etapa 2 — Persistência local
- Criar módulo de armazenamento IndexedDB versionado.
- Guardar snapshot e fila de operações sem bloquear a interface.
- Informar claramente o estado: conectado, offline, sincronizando, pendências ou conflito.
- Não substituir o estado local por um snapshot remoto antigo enquanto houver alterações pendentes.

### Etapa 3 — Sincronização
- Definir operações idempotentes e identificadores únicos.
- Implementar pull/push incremental, confirmação de operações e tentativas com espera progressiva.
- Detectar conflito de versão; nunca descartar alterações pendentes silenciosamente.
- Lidar com sessão expirada e permissões negadas sem apagar dados locais.

### Etapa 4 — Backup e recuperação
- Automatizar backup fora do repositório público.
- Incluir dados e estrutura necessários, documentando limites de Auth, Storage e arquivos anexados.
- Manter versões e verificar integridade.
- Fazer um exercício de restauração em ambiente de teste e registrar o resultado.

### Etapa 5 — Validação antes de produção
- Testar offline, recarregamento do navegador, fechamento/reabertura, reconexão, sessão expirada, falha parcial, duplicidade e conflitos.
- Testar com dois usuários/dispositivos alterando os mesmos registros.
- Testar restauração em projeto Supabase separado.
- Só habilitar o modo offline após testes e aprovação explícita.

## Limitações e segurança

- Dados locais ficam no perfil do navegador/dispositivo e podem ser perdidos se o armazenamento do navegador for apagado, o dispositivo falhar ou o usuário limpar os dados. Por isso, não substituem backups independentes.
- Navegadores diferentes e computadores diferentes não compartilham automaticamente o IndexedDB.
- Um arquivo estático no GitHub não é um banco transacional nem oferece sincronização segura por si só.
- Não é seguro usar um arquivo JSON compartilhado como destino de gravação concorrente para vários usuários.
- O modo visitante deve ser protegido também por políticas RLS no servidor; esconder botões na interface não é autorização suficiente.
- Nenhum backup real ou alteração de banco foi executado por este documento.

## Critérios de conclusão

- [ ] Exportação completa real criada fora do GitHub público.
- [ ] Restauração validada em ambiente isolado.
- [ ] IndexedDB e fila persistente implementados.
- [ ] Sincronização idempotente e resolução de conflitos testadas.
- [ ] RLS validada com contas reais de edição e visitante.
- [ ] Testes automatizados e manuais aprovados.
- [ ] Plano de retorno à versão estável documentado.
