/** Regras financeiras preservadas da versão legada (app.js). */
export function freightBase(f = {}) {
  return Math.max(0, Number(f.value || 0) - Number(f.discount || 0) - (f.deductToll ? Number(f.toll || 0) : 0));
}
export function freightCommission(f = {}) {
  const base = freightBase(f);
  return f.commissionType === "fixed" ? Number(f.commission || 0) : base * Number(f.commission || 0) / 100;
}
export function freightBonus(f = {}) { return Number(f.bonus || 0); }
export function freightCost(f = {}) {
  return freightCommission(f) + freightBonus(f) + Number(f.toll || 0) + Number(f.fuelActual || 0) + Number(f.otherCosts || 0);
}
export function freightProfit(f = {}) {
  return Number(f.value || 0) - Number(f.discount || 0) - Number(f.toll || 0) - Number(f.fuelActual || 0) - freightCommission(f) - freightBonus(f) - Number(f.otherCosts || 0);
}
export function freightNet(f = {}) {
  return Number(f.value || 0) - Number(f.discount || 0) - freightCommission(f) - (f.deductToll ? Number(f.toll || 0) : 0) + freightBonus(f);
}

export function freightDriverPayment(f = {}) {
  return freightCommission(f) + freightBonus(f);
}
export function freightOperatingCosts(f = {}) {
  return Number(f.toll || 0) + Number(f.fuelActual || 0) + Number(f.otherCosts || 0);
}
