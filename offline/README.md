# Camada offline (protótipo isolado)

`local-store.js` implementa apenas persistência no navegador:

- snapshot local;
- fila persistente com ID idempotente;
- listagem de operações pendentes;
- estados pendente, sincronizada e conflito;
- registro de falhas sem descartar a operação.

## Não está conectado à aplicação publicada

Este protótipo **não** é carregado por `index.html` e não altera `app.js`, `sync.js`, o Supabase nem os registros existentes. Não habilita ainda cadastro offline no sistema.

## Por que permanece isolado?

A empresa utilizará vários computadores. IndexedDB não é compartilhado entre computadores, portanto não pode ser o único banco principal da empresa. Antes da integração, é necessário implementar o serviço central na rede local, autenticação/autorização no servidor, transações e um protocolo de sincronização com idempotência e resolução de conflitos.

## Integração futura obrigatória

1. Fazer e validar backup independente antes de qualquer migração.
2. Criar o serviço central local e definir o esquema transacional.
3. Definir o protocolo de sincronização e a regra de conflitos.
4. Integrar esta fila ao fluxo de gravação sem remover a cópia local até o servidor confirmar a operação.
5. Testar com dois computadores, incluindo alterações concorrentes e quedas de rede.
6. Só então ativar por configuração e fazer piloto controlado.

Não guardar dados reais da transportadora neste repositório. Não adicionar chave Supabase de serviço ao navegador.