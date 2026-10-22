# Arquitetura local-primeiro para vários computadores

## Decisão

Para a R&R Figueredo Transportes, o banco operacional principal deve ser um serviço local na rede da empresa, e não um arquivo JSON no GitHub nem o IndexedDB isolado de cada navegador.

- **Banco local central (principal):** um servidor dentro da empresa, acessível aos computadores autorizados pela rede local. Ele centraliza gravações, transações, validação de versões e cópias de segurança locais.
- **Cache offline por dispositivo:** IndexedDB mantém uma cópia local e uma fila persistente de operações pendentes quando um computador perde a conexão com o servidor local.
- **Supabase (réplica/backup externo):** recebe alterações confirmadas pelo serviço local quando a internet estiver disponível. Deve existir política de reconciliação explícita; não pode ser uma cópia cega do estado completo.
- **Backup independente:** exportações versionadas e verificadas em armazenamento privado, separado tanto do repositório público quanto da única instância Supabase.

## Por que não fazer de cada navegador o banco principal?

IndexedDB é separado por navegador e computador. Dois dispositivos offline podem alterar o mesmo frete sem conhecer a alteração do outro. Ao reconectar, a aplicação precisa identificar conflitos, preservar ambas as versões e impedir duplicações. Um JSON compartilhado por vários computadores também não fornece transações seguras nem bloqueio concorrente.

## Fases de implementação

1. **Proteção e inventário:** exportar e validar um backup real antes de qualquer migração; confirmar políticas RLS, incluindo o perfil visitante. Não executar migrações na base de produção sem aprovação.
2. **Serviço local:** criar uma API autenticada na rede interna e escolher um banco transacional suportado (por exemplo, PostgreSQL local ou SQLite atrás de um único serviço). O navegador não deve abrir/editar diretamente o arquivo do banco.
3. **Cache e fila offline:** usar IndexedDB por dispositivo para snapshot, operações com IDs idempotentes, ordem e estado de sincronização.
4. **Sincronização:** servidor local como coordenador; Supabase recebe alterações por protocolo versionado. Conflitos devem ser exibidos ou resolvidos por regra explícita, nunca sobrescritos silenciosamente.
5. **Backups e restauração:** cópia local, cópia externa independente, retenção e teste de restauração em ambiente isolado.
6. **Piloto:** validar com dois computadores e contas diferentes, incluindo internet desligada, servidor local indisponível, reconexão, edição simultânea, sessão expirada e recuperação de backup.
7. **Ativação:** somente depois de backup restaurável, testes aprovados e plano de retorno validado. A versão publicada atual permanece inalterada até lá.

## Limites desta etapa

O módulo `offline/local-store.js` é apenas a camada de persistência local por navegador para servir de base à próxima fase. Ele **não** transforma sozinho a aplicação atual em modo offline, não cria um servidor local, não sincroniza com o Supabase e não modifica dados de produção. Não o integrar ao fluxo de gravação até o protocolo do serviço local e a política de conflitos estarem definidos e testados.

## Segurança

- Não armazenar dados reais da empresa, senhas, chaves privadas ou strings de conexão neste repositório público.
- Não colocar chaves Supabase de serviço no navegador.
- A autorização deve ser validada no servidor e no banco; esconder botões não é controle de acesso.
- O perfil visitante deve continuar sem permissão de escrita no servidor, independentemente da interface.
- Não tratar uma sincronização pendente como backup concluído.
