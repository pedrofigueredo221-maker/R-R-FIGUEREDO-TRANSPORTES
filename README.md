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
- Cadastro de despesas por categoria, fornecedor e caminhão.
- Contas à vista ou parceladas, com geração automática de parcelas mensais.
- Registro de pagamentos parciais ou integrais por parcela.
- Visão de contas atrasadas, em aberto e próximas do vencimento.
- Relatórios por mês e motorista.
- Exportação de fretes e despesas para CSV compatível com Excel.
- Layout adaptado para celular e computador.

## Melhorias desta versão

- Comissão de motorista por porcentagem ou valor fixo, com valor padrão no cadastro e possibilidade de ajuste no frete.
- Descontos gerais, pedágio descontável da base da comissão, bônus separado da base, KM, preço do diesel, litros, estimativa de combustível e gasto real.
- Prévia do cálculo de comissão e lucro estimado por viagem.
- Contas a receber derivadas automaticamente dos fretes, com saldo e recebimento parcial.
- Despesas com descontos, adicionais, categoria personalizada, caminhão, forma de pagamento e parcelamento.
- Cadastro/edição/exclusão de categorias, preservando categorias já utilizadas no histórico.
- Botões discretos de atualização e painel gerencial com faturamento, recebimentos, obrigações e estimativa de resultado.
- Sem folha salarial; comissão e bônus por viagem continuam sendo custos operacionais.

## Limitações importantes desta versão

**Esta versão é um protótipo para testes, não um sistema de produção.**

- O aplicativo tem tela de login com Supabase Auth e usa `localStorage` como cache/migração local; o estado compartilhado é armazenado em `public.app_state`.
- A chave `publishable/anon` pode aparecer no navegador, mas a segurança depende das políticas RLS do banco. Use o SQL autenticado e limite o acesso ao e-mail autorizado. Não publique chaves administrativas nem senhas.
- O sistema não substitui backups: configure backups no Supabase e exportações periódicas dos dados.
- O lucro é uma estimativa gerencial e deve ser validado com os critérios contábeis da empresa. Evite registrar o mesmo abastecimento tanto no custo do frete quanto em despesas para não duplicar o custo.
- O campo de recebimento de fretes acompanha o total recebido, mas não mantém um histórico detalhado de cada recebimento.
- Ao editar uma despesa já criada, este protótipo não altera os valores nem a agenda de parcelas existentes; apenas permite corrigir os dados descritivos. Exclua e recadastre uma despesa se precisar reconstruir seu parcelamento.
- Datas das parcelas são mensais e geradas automaticamente a partir do vencimento inicial.
- Não inclui ainda controle completo de receitas diversas, fluxo de caixa bancário, anexos de notas/boletos, manutenção preventiva, nem conciliação bancária.

## Próxima etapa recomendada

Antes de usar com dados reais, confirme que o SQL autenticado foi executado no Supabase, que o usuário correto existe em Authentication > Users e que o e-mail autorizado na política corresponde à conta. Configure também backups. Nunca coloque chaves secretas ou senhas no repositório público.


## Recursos adicionados
- **Cadastros:** acesse Cadastros para adicionar/editar funcionários e caminhões. É possível desativar e reativar sem apagar o histórico. Renomear um cadastro atualiza as referências antigas de fretes/despesas.
- **Importar fretes:** em Fretes, baixe o modelo Excel, preencha uma linha por frete e importe `.xlsx`, `.xls` ou `.csv`. Revise e valide antes de salvar.
- **Fotografar o caderno:** escolha a opção de foto no celular ou selecione uma imagem. O reconhecimento de texto é uma ajuda, não uma garantia: escrita à mão e números podem ser lidos errado. Confira a prévia manualmente.
- Os leitores Excel e OCR dependem de conexão à internet para carregar as bibliotecas.
- **Limitação importante:** o estado é sincronizado por um único registro JSON compartilhado. A aplicação usa controle de versão e mesclagem, mas não oferece permissões detalhadas por função nem histórico contábil/auditoria por lançamento.


## Atualização financeira (outubro/2026)

- Despesas e manutenções criam parcelas financeiras automaticamente e aparecem em **Contas a pagar**.
- A tela de contas a pagar lista parcelas por vencimento/mês e também inclui contas pagas no mês selecionado, mostrando o histórico de data, meio e valor de cada pagamento.
- O resumo mensal distingue valor previsto das parcelas, pagamentos registrados no mês e saldo em aberto das parcelas vencendo no mês.
- O botão **Registrar conta** cria uma conta manual, usando o mesmo formulário financeiro (à vista, boleto/forma de pagamento, parcelas, vencimentos, desconto, adicional e pagamentos). Contas manuais são separadas visualmente da listagem de despesas/manutenções, mas permanecem no financeiro.
- No frete, o campo **Saldo atual a receber** pode ser informado junto ao adiantamento recebido; o sistema calcula o valor total como adiantamento + saldo. Se o campo de saldo ficar vazio, o valor do frete é mantido como informado.
- A comissão percentual usa frete menos descontos e, se marcado, pedágio; comissão fixa usa o valor fixo cadastrado. O bônus é somado após a comissão e reduz o lucro estimado sem entrar na base percentual.
- O custo do pedágio reduz o lucro estimado da viagem; combustível estimado é preço do diesel × litros e o gasto real é usado para o lucro.

### Atenção antes de usar em produção

Faça backup do banco Supabase e dos dados locais antes de substituir a versão publicada. O arquivo `supabase.sql` foi ajustado para restringir o acesso ao usuário autenticado com o e-mail configurado na política. Executar um arquivo SQL no GitHub não altera automaticamente o banco: execute o script no SQL Editor do Supabase e confirme que as políticas antigas para `anon` foram removidas. A política deste pacote autoriza apenas `pedrofigueredo221@gmail.com`; altere-a somente se o usuário correto usar outro e-mail. Teste login, recuperação de senha e sincronização antes de inserir dados reais.


### Busca de cidades brasileiras

Os campos Cidade de origem e Cidade de destino possuem autocomplete com os municípios brasileiros consultados na API oficial de Localidades do IBGE. Ao digitar pelo menos dois caracteres, o sistema sugere o município e a UF; é possível navegar com as setas e selecionar com Enter. A lista é armazenada no navegador por até 30 dias para reduzir consultas repetidas. Na primeira utilização, é necessária conexão com a internet para carregar a lista. Fonte: https://servicodados.ibge.gov.br/api/docs/localidades.


## Perfil Visitante (somente leitura)

O usuário visitante usa o login **VISITANTES**, vinculado a `pedrofogofogop@gmail.com`. A conta administrativa permanece vinculada a `pedrofigueredo221@gmail.com`.

### Ativação no Supabase existente

1. Abra o projeto Supabase correto e entre em **SQL Editor**.
2. Abra o arquivo `supabase-visitor-role.sql` deste repositório, copie todo o conteúdo e execute. A migração preserva os dados existentes e recria as políticas RLS de `app_state`: administrador e visitante podem ler; somente o administrador pode inserir/atualizar.
3. Em **Authentication → Users**, crie o usuário `pedrofogofogop@gmail.com` e defina ou envie uma senha segura (evite senhas simples como `123456` para proteger dados financeiros). Essa criação precisa ser feita no painel Supabase; o código do site não cria contas Auth.
4. Depois que o PR for revisado e mesclado, abra o site e entre usando **VISITANTES** e a senha criada.
5. Teste com o visitante: consultar páginas e relatórios deve funcionar; tentar alterar dados deve ser bloqueado pela interface e pelo Supabase RLS. Confirme também que a conta administrativa continua podendo salvar alterações.

**Importante:** não use a conta visitante para cadastrar dados. O bloqueio real de escrita depende da migração SQL aplicada no projeto Supabase de produção, não apenas da atualização do site.
