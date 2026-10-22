# Dados locais e exemplos offline

A pasta contém somente modelos vazios/dados fictícios de desenvolvimento. Não é o backup real da transportadora.

- `sample-snapshot.json`: formato de referência para um snapshot local sem registros reais.
- O protótipo IndexedDB guarda snapshots e fila dentro do perfil do navegador de cada dispositivo.
- Esses dados não são automaticamente compartilhados entre computadores nem sincronizados com o Supabase nesta etapa.

## Como proteger os dados reais

1. Gere um backup real com `scripts/backup-supabase.ps1`.
2. Mantenha o ZIP em `backups/local/` no computador autorizado e copie outra versão para um local privado separado.
3. Não adicione dados reais, credenciais ou connection strings ao GitHub.
4. Antes de habilitar o modo offline, testar restauração, sincronização e conflitos em ambiente isolado.
