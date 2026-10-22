# Habilitar gravações na versão React com segurança

A nova interface React inclui formulários para fretes, despesas, recebimentos, pagamentos e cadastros. As gravações usam comparação de versão no registro `public.app_state`: se outro computador salvar primeiro, a gravação concorrente é recusada e os dados são recarregados para evitar sobrescrita silenciosa.

## Antes de habilitar

1. **Faça um backup real e teste a restauração.** Ainda não foi executado backup do banco real nesta etapa.
2. Abra o arquivo `supabase/migrations/20261022_app_state_write_roles.sql` e revise-o.
3. No projeto Supabase existente, execute o SQL pelo SQL Editor. Ele remove as políticas antigas de escrita e cria uma tabela de permissões explícitas.
4. O SQL deixa todos os usuários sem permissão de escrita por padrão. Conceda `can_write = true` somente à conta autorizada usando a consulta comentada no fim do arquivo, substituindo o e-mail de exemplo pelo login autorizado. **Não conceda essa permissão à conta visitante.**
5. Teste primeiro com a conta de escrita e depois com a conta visitante. O visitante deve conseguir consultar, mas tentativas de escrita diretas no Supabase devem falhar.
6. Confirme que as leituras do registro `app_state` funcionam para as contas autorizadas.

## Limites conhecidos

- Esta versão React já grava no Supabase usando controle otimista por `version`; ela **não** implementa ainda modo offline completo.
- A base `app_state` continua sendo um único documento JSON. O controle de versão evita sobrescritas concorrentes, mas não substitui tabelas normalizadas nem reconciliação offline por registro.
- Em conflito, o sistema recarrega os dados e pede que o usuário confira a alteração antes de tentar de novo.
- O relatório continua em consulta nesta etapa.
- Ainda é necessário validar autenticação, permissões, formulários e fluxo financeiro no Supabase real antes de trocar a versão publicada.
- Não foi alterada a base de produção, não foi executado SQL e nenhum backup real foi gerado por esta PR.

## Publicação

O build automatizado verifica se o projeto React compila. O site público ainda não foi trocado para a saída compilada React. Não mude a origem de publicação do GitHub Pages até terminar a validação e preparar o plano de retorno à versão HTML anterior.
