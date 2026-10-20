[README.md](https://github.com/user-attachments/files/33737453/README.md)
# R&R Figueredo Transportes — Gestão de Fretes

Protótipo responsivo para controle de fretes, motoristas, comissão, pedágio, despesas de manutenção, contas parceladas e relatórios.

## Como executar

1. Baixe e extraia os arquivos.
2. Abra `index.html` no navegador, ou use a extensão **Live Server** do Visual Studio Code.
3. Para experimentar, clique em **Carregar exemplos** no painel.
4. Cadastre fretes e despesas; teste filtros, pagamentos e exportação CSV.

Não é necessário instalar dependências para a versão inicial.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `gestao-fretes`.
2. Envie `index.html`, `styles.css`, `app.js` e `README.md` para a raiz do repositório.
3. No repositório, abra **Settings → Pages**.
4. Em *Build and deployment*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e clique em **Save**.
5. Aguarde a publicação e abra o endereço indicado pelo GitHub Pages.

## Funcionalidades incluídas

- Painel com totais mensais de fretes, recebimentos, despesas pagas e resultado simplificado.
- Cadastro, edição e exclusão de fretes.
- Motorista, origem, destino, valor, pedágio, percentual de comissão e opção de descontar pedágio.
- Registro de recebimentos totais ou parciais dos clientes.
- **Contas a receber:** todo frete com saldo pendente gera automaticamente uma conta a receber (com cliente e vencimento opcionais). Também é possível lançar contas avulsas de clientes ou fornecedores e registrar recebimentos parciais ou totais.
- Cadastro de despesas por categoria, fornecedor e caminhão.
- Contas à vista ou parceladas, com geração automática de parcelas mensais.
- Registro de pagamentos parciais ou integrais por parcela.
- Visão de contas atrasadas, em aberto e próximas do vencimento.
- Relatórios por mês e motorista.
- Exportação de fretes e despesas para CSV compatível com Excel.
- Layout adaptado para celular e computador.

## Limitações importantes desta versão

**Esta versão é um protótipo para testes, não um sistema de produção.**

- Os dados ficam no `localStorage` do navegador. Não sincronizam entre celular e computador, nem entre usuários. Limpar os dados do navegador pode apagar os registros.
- Não há login, banco de dados em nuvem, permissões por usuário, backup automático nem recuperação de senha.
- O cálculo de comissão é ilustrativo e precisa ser confirmado com a empresa. O resultado do painel é simplificado: recebimentos registrados nos fretes menos pagamentos de despesas registrados.
- O campo de recebimento de fretes acompanha o total recebido, mas não mantém um histórico detalhado de cada recebimento.
- Ao editar uma despesa já criada, este protótipo não altera os valores nem a agenda de parcelas existentes; apenas permite corrigir os dados descritivos. Exclua e recadastre uma despesa se precisar reconstruir seu parcelamento.
- Datas das parcelas são mensais e geradas automaticamente a partir do vencimento inicial.
- Não inclui ainda controle completo de receitas diversas, fluxo de caixa bancário, anexos de notas/boletos, manutenção preventiva, nem conciliação bancária.

## Próxima etapa recomendada

Antes de usar com dados reais, evoluir para Supabase/PostgreSQL com autenticação, regras de acesso e backup. Assim, o mesmo dado poderá ser acessado com segurança em diferentes dispositivos. Nunca coloque chaves secretas ou senhas no repositório público.
