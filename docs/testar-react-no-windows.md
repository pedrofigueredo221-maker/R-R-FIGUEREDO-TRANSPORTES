# Como testar o React localmente no Windows

Este roteiro permite experimentar a interface **sem enviar alterações ao Supabase real**.

## 1. Baixe a branch de teste

Abra o ZIP desta branch:
https://github.com/pedrofigueredo221-maker/RR-FIGUEREDO-TRANSPORTES/archive/refs/heads/refactor/react-split-screens-2026-10-22.zip

Extraia o ZIP para uma pasta fácil de encontrar.

## 2. Instale Node.js LTS

Na primeira tentativa, o terminal do computador indicou que o comando `node` não estava instalado. Instale a versão LTS pelo site oficial:
https://nodejs.org/en/download

Depois da instalação, feche todas as janelas do PowerShell e abra uma nova.

## 3. Inicie o ambiente de teste

Abra o PowerShell dentro da pasta extraída do projeto e execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testar-react.ps1
```

O script verifica o Node.js, instala as dependências se necessário e inicia o servidor Vite. Não é preciso alterar a política de execução permanentemente.

## 4. Entre no modo demonstração

O terminal mostrará um endereço local, normalmente `http://localhost:5173`. Abra esse endereço acrescentando `?demo=1`, por exemplo:

`http://localhost:5173/?demo=1`

Nesse modo:
- os registros são fictícios;
- a interface não cria cliente Supabase e não acessa o banco da empresa;
- cadastros, edições e pagamentos ficam guardados apenas no armazenamento local desse navegador;
- os dados podem persistir entre atualizações da página, mas não são compartilhados com outros computadores;
- use o botão **Sair** para testar novamente o fluxo de entrada.

## Atenção

O endereço normal, sem `?demo=1`, usa a configuração do Supabase existente e pode ler ou alterar dados reais de acordo com as permissões da conta. Para a primeira avaliação visual, use sempre `?demo=1`.

O modo demonstração valida a navegação e os formulários, mas não valida autenticação real, permissões RLS, sincronização entre computadores nem o modo offline. Esses testes serão feitos separadamente antes da publicação.
