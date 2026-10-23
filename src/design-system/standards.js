/**
 * Contratos de apresentação do ERP R&R.
 * Mantenha regras de negócio e cálculos financeiros no domínio existente.
 * Não use este módulo para alterar Login ou Menu Lateral congelados.
 */
export const UI_LABELS = Object.freeze({
  period: "PERÍODO",
  refresh: "Atualizar dados",
  add: "Adicionar",
  save: "Salvar",
  cancel: "Cancelar",
  edit: "Editar",
  close: "Fechar",
  route: "Trajeto",
  totalCost: "Custo total",
  empty: "Nenhum registro encontrado."
});

export const UI_SIZES = Object.freeze({
  iconButton: 40,
  controlHeight: 42,
  cardCompactHeight: 104
});

export const DATA_BEHAVIOR = Object.freeze({
  rowDoubleClick: "open-source-record",
  readonlyAccess: "view-only",
  createEditSurface: "modal",
  filterScope: "screen-local",
  refreshSource: "shared-data",
  deleteConfirmation: true
});

export const getRecordId = (record) => record?.id ?? null;
export const isRecordNavigable = (record) => getRecordId(record) !== null;
