export function freightReceivableBalance(freight = {}, number = (value) => Math.max(0, Number(value) || 0)) {
  return Math.max(0, Math.round((number(freight.value) - number(freight.received)) * 100) / 100);
}

export function freightReceivableStatus(freight = {}, number = (value) => Math.max(0, Number(value) || 0)) {
  const total = Math.max(0, number(freight.value));
  const received = Math.max(0, number(freight.received));
  if (total > 0 && received >= total - 0.009) return "Pago";
  if (received > 0) return "Parcial";
  return "Pendente";
}
