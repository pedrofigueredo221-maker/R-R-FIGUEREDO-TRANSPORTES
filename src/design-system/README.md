# Padrões do ERP R&R Figueredo Transportes

## Regra de evolução
Uma melhoria visual ou de interação aprovada que faça sentido em várias telas deve ser implementada como componente, estilo ou configuração compartilhada. Evitar copiar CSS ou JSX entre telas. Migrar gradualmente as telas existentes e reutilizar em todas as futuras.

## Componentes e padrões
- **Trajeto:** `src/components/RouteDisplay.jsx` + `src/styles/route-display.css`; origem e destino separados por seta discreta e espaçamento responsivo.
- **Atualizar:** reutilizar `src/components/RefreshButton.jsx`, mantendo ícone, cor e comportamento consistentes.
- **Filtros:** padronizar rótulos, dimensões, espaçamento e responsividade. Não alterar o escopo dos dados filtrados sem revisar a regra de negócio.
- **Tabelas:** cabeçalhos consistentes, ordenação quando aplicável, duplo clique em registros individuais para abrir origem; linhas agregadas exigem detalhamento específico.
- **Cadastros:** formulários em modal, campos e validações coerentes, respeitando permissões de visitantes.
- **Cores e tipografia:** tons neutros, Calibri e cores semânticas para valores e estados.
- **Rodapé institucional:** canto inferior direito, sem sobrepor o conteúdo.

## Proteções
Tela de Login e Menu Lateral congelados: qualquer alteração direta ou indireta exige autorização explícita no ChatGPT. Preservar cálculos, dados e permissões. Trabalhar sempre em branch com PR detalhada, sem merge automático.


## Separação obrigatória entre interface e dados
- Mudanças de layout, CSS, tipografia, cores, filtros visuais e componentes compartilhados **não podem modificar** fórmulas financeiras, registros, autenticação, permissões ou persistência no Supabase.
- Evitar alterações em `src/domain/`, serviços de banco, migrations e regras de acesso em PRs exclusivamente visuais.
- Não confundir a aparência do filtro com sua regra de consulta: alterações de intervalo, seleção ou agregação de dados precisam de solicitação específica e testes.
- Antes de aprovar uma PR visual, revisar o diff e confirmar que não há alterações de cálculos, gravação, exclusão, estados financeiros ou dados.
- Preferir componentes reutilizáveis para qualquer padrão visual aprovado; migrar telas existentes gradualmente e sem regressões.
- Login e Menu Lateral permanecem congelados; qualquer impacto direto ou indireto exige autorização explícita.
