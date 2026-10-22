# PostgreSQL local como banco principal — uso somente online

## Decisão atual

O sistema exige conexão com a internet para uso. Não implementar, nesta etapa, operação offline no navegador, fila offline nem sincronização posterior de operações.

A arquitetura desejada é:
- PostgreSQL em um computador/servidor controlado pela empresa como fonte principal dos dados;
- Supabase como cópia de segurança externa dos dados confirmados;
- interface React acessível aos usuários autorizados;
- sincronização/cópia do PostgreSQL para o Supabase com registros de execução, validação e alertas de falha.

## Requisito de rede indispensável

O site hospedado não consegue acessar o PostgreSQL em `127.0.0.1` do computador da empresa. Esse endereço só é acessível dentro do próprio computador. Não abrir a porta 5432/5433 diretamente à internet.

Antes de ligar a interface ao PostgreSQL, deve existir uma API autenticada, com HTTPS, autorização por usuário, validação de entrada, logs e proteção contra abuso. Essa API precisa estar acessível aos usuários autorizados por uma solução de rede segura (por exemplo, VPN ou túnel autenticado) ou ser hospedada junto ao banco em ambiente acessível. Se a API/banco permanecer apenas em localhost, somente aplicações executadas no mesmo computador poderão acessá-los.

## Migração segura dos dados existentes

1. Manter o Supabase e o site atual intactos durante a preparação.
2. Gerar backup lógico do Supabase e guardar uma cópia fora do GitHub.
3. Restaurar/testar o backup em ambiente separado antes de qualquer uso operacional.
4. Identificar o registro real `public.app_state` (id=1), seu JSONB `data`, `version` e `updated_at`; preservar todos os campos existentes, inclusive os desconhecidos pelo código atual.
5. Importar para PostgreSQL local sem substituir silenciosamente dados já existentes.
6. Comparar contagens, conteúdo JSON, IDs e totais financeiros de fretes, despesas, recebíveis, funcionários, caminhões e categorias.
7. Testar a restauração do PostgreSQL e documentar a origem, data, contagens e resultado da verificação.
8. Somente após validação, conectar a aplicação à API do PostgreSQL.
9. Implementar backup PostgreSQL → Supabase idempotente, com marcador de versão/snapshot, logs, alerta em falhas e teste de restauração. Não permitir que uma cópia antiga sobrescreva dados mais novos.

## Limites e segurança

- A configuração Docker do repositório apenas prepara o serviço; não significa que o banco esteja iniciado nem que contenha dados reais.
- Nenhum dado real deve ser commitado ou enviado ao repositório público.
- Não copiar credenciais do Supabase Auth, tokens ou chaves privadas para o GitHub.
- O Supabase Auth pode continuar como provedor de login inicialmente, mas a API deve validar o token no servidor e aplicar permissões de administrador/visitante também no backend.
- Não considerar o Supabase como backup confirmado até que a cópia tenha sido concluída e verificada.
- Não alterar nem apagar dados da produção durante a migração.
- O projeto não deve anunciar PostgreSQL como banco operacional ativo até que a API, importação, testes e procedimento de retorno estejam concluídos.

## Critério de conclusão

A etapa de banco só estará concluída quando: backup de origem validado; PostgreSQL local iniciado; dados reais importados e comparados; API autenticada funcionando; aplicação usando PostgreSQL; cópia PostgreSQL → Supabase verificada; restauração de ambos testada; e procedimento de retorno documentado.
