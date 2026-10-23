# Auditoria de persistência e segurança — 23/10/2026

**Escopo:** leitura do código da branch `main` após PR #78. **Sem acesso ao banco em produção, sessões reais, logs de Supabase, dumps locais ou dados privados.** Portanto, os itens abaixo são achados de código, não certificação do ambiente de produção.

## Achados e riscos

| Prioridade | Evidência | Risco / ação recomendada |
| --- | --- | --- |
| Alta | `src/App.jsx` grava todo o JSON em `public.app_state`, linha id=1 | Uma operação afeta todo o estado. Limite de escala, recuperação granular e auditoria por lançamento. Planejar normalização gradual com migração e rollback, sem mexer nos dados atuais. |
| Alta | `backup-supabase.ps1` só executa quando alguém fornece `SUPABASE_DB_URL` e roda o script | **Não existe comprovação de backup automático nem arquivo espelho atualizado a cada gravação.** O ZIP é local, gerado sob demanda e ignorado pelo Git. |
| Alta | Políticas distintas em `supabase.sql`, `supabase-visitor-role.sql` e migração `20261022_app_state_write_roles.sql` | Os scripts descrevem modelos diferentes de autorização (e-mail vs. UUID/permissão). **Não é possível saber qual está aplicado em produção.** Executar apenas o diagnóstico de leitura e reconciliar depois de backup e aprovação. |
| Alta | `app_state_select_authenticated` da migração autoriza qualquer usuário autenticado a ler o estado | Se esta migração estiver aplicada, uma conta autenticada não autorizada poderá ler o JSON financeiro. Restringir leitura a usuários explicitamente aprovados, após verificar contas reais e políticas efetivas. |
| Média | `saveData` usa `version` na condição do UPDATE | Boa proteção contra gravação concorrente entre clientes, mas duas ações iniciadas simultaneamente no mesmo cliente podem disputar a versão; testar operações rápidas e estado da UI após conflito. |
| Média | `loadData` recarrega a cada 15 segundos e ao voltar à aba | Possível atualização do estado enquanto há formulário aberto; proteção por versão evita sobrescrita, mas pode frustrar edição. Testar em dois dispositivos. |
| Média | O cliente usa chave publicável e autenticação Supabase | Normal para frontend, **não substitui RLS**. Validar no banco com administrador, visitante, outro autenticado e anônimo. |
| Média | `app_state` contém coleções em JSON e `saveData` usa valores recebidos do formulário | Validação de estrutura no cliente não impede alteração direta via API por usuário com escrita. Considerar validação de esquema e trilha de auditoria no banco, mediante migração planejada. |
| Média | O backup lógico exclui objetos gerenciados de auth/storage e arquivos binários do Storage | A restauração integral de usuários, credenciais e arquivos não é garantida por esse ZIP. Documentar recuperação e testar restauração em ambiente isolado. |
| Baixa | `?demo=1` salva somente no localStorage | Não é backup do ambiente real. Não misturar dados fictícios com produção. |

## Fluxo de gravação observado
1. Após autenticação, lê `public.app_state` id=1, campos `data` e `version`.
2. Ao salvar, compara versão da tela com versão atual e faz UPDATE com filtro por id e versão.
3. Se nenhuma linha foi atualizada, recarrega e informa conflito. O cliente não deve declarar sucesso sem confirmação.
4. Não foi encontrado nesse fluxo um mecanismo de exportação automática para arquivo a cada gravação.

## Verificações adicionadas nesta PR
- `node scripts/auditar-persistencia.mjs`: checagem estática, sem conexão e sem alterações.
- `auditoria-seguranca-somente-leitura.sql`: consulta de RLS, grants, versão e **contagens**, sem revelar JSON financeiro.
- `validar-backup.ps1 -Arquivo <caminho-privado.zip>`: verifica arquivos esperados e referência a app_state no dump; não restaura dados.

## Plano recomendado antes de qualquer alteração de produção
1. Criar backup manual e cópia privada externa; validar o ZIP e testar restauração **em projeto isolado**, sem apontar para produção.
2. Executar diagnóstico SQL somente leitura e registrar resultado em local privado.
3. Testar acesso RLS com administrador, visitante, conta autenticada não autorizada e usuário anônimo.
4. Simular dois navegadores editando o mesmo registro e falha de rede durante gravação.
5. Definir retenção, frequência e destino privado dos backups automáticos; **não versionar dados reais ou credenciais no GitHub**.
6. Planejar mudanças de RLS, triggers, normalização ou replicação somente em PR separada, com aprovação explícita e plano de rollback.

**Nenhum SQL de alteração é executado por esta PR. Nenhuma cópia de dados reais foi criada ou prometida.**
