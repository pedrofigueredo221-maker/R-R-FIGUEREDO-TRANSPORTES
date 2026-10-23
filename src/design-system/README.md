# Padrões de interface — R&R Figueredo Transportes

## Escopo
Este diretório define contratos reutilizáveis para **telas internas**. A tela de Login e o Menu Lateral estão congelados; qualquer mudança que os afete exige autorização explícita no ChatGPT.

## Regras
- **Cores e medidas:** `tokens.css`. Preferir tokens em novos estilos; manter cores semânticas apenas para informações financeiras e estados.
- **Textos:** rótulos curtos em `standards.js`, sem eliminar validações, acessibilidade ou informações importantes.
- **Atualização:** reutilizar `RefreshButton`, mantendo tamanho, cores e estado de carregamento.
- **Filtros:** usar `StandardMonthFilter` para mês/ano. Outros filtros devem manter padrão de campo, espaçamento e rótulo.
- **Tabelas:** cabeçalho grafite, branco e divisórias; manter ordenação onde suportada.
- **Registros:** usar `StandardRecordRow` em novas tabelas com registros individuais; duplo clique abre a origem. Linhas agregadas precisam de drill-down antes de selecionar um registro específico.
- **Formulários:** reutilizar `FormDialog` para inclusão e edição; nunca abrir formulário com dados herdados de outro registro.
- **Permissões:** visitantes somente visualizam. Não transformar clique ou estilo em autorização de gravação.
- **Responsividade:** campos e tabelas devem caber em dispositivos móveis; permitir rolagem de tabelas quando necessário.
- **Financeiro:** fórmulas de frete, comissão, bônus, despesas e recebimentos permanecem nos módulos de domínio existentes.
- **GitHub:** branch + Pull Request detalhada, sem push direto na main ou merge automático.

## Migração gradual
Componentes legados continuam funcionando. Em novas telas, importar componentes e tokens compartilhados. Migrar telas existentes por etapas, com validação visual e funcional, sem mudanças não solicitadas.
