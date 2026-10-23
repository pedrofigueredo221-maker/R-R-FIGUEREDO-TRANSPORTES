# Como testar o React localmente no Windows

Este roteiro permite testar a interface usando dados fictícios, sem enviar alterações ao Supabase real.

## 1. Baixe o código

Abra o ZIP da branch de auditoria:
https://github.com/pedrofigueredo221-maker/RR-FIGUEREDO-TRANSPORTES/archive/refs/heads/audit/duplicidade-layout-css-2026-10-23.zip

Extraia o ZIP para uma pasta fácil de encontrar.

## 2. Instale Node.js

Instale Node.js 22 ou superior pelo site oficial:
https://nodejs.org/en/download

Depois da instalação, feche todas as janelas do PowerShell e abra uma nova.

## 3. Inicie o ambiente de teste

Abra o PowerShell dentro da pasta extraída e execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testar-react.ps1
```

O script verifica o Node.js, instala as dependências se necessário e inicia o servidor Vite. Quando o terminal mostrar um endereço local, abra-o no navegador.

## 4. Use o modo demonstração

Acrescente `?demo=1` ao endereço local, por exemplo:

`http://localhost:5173/?demo=1`

Nesse modo, os registros são fictícios, não é criado cliente Supabase e os cadastros/edições ficam apenas no armazenamento local do navegador. Use **Sair** para testar novamente o fluxo de entrada.

## Atenção

O endereço sem `?demo=1` usa a configuração Supabase do projeto e pode ler ou gravar dados conforme as permissões da conta. Para a primeira avaliação visual, use sempre o modo demonstração.

O modo demonstração ajuda a validar navegação e formulários, mas não valida autenticação real, permissões RLS nem sincronização entre computadores. Faça esses testes separadamente antes de publicar.
