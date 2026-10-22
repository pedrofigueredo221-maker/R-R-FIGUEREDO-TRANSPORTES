import test from "node:test";
import assert from "node:assert/strict";
import { freightBase, freightCommission, freightBonus, freightCost, freightProfit, freightNet } from "./freightCalculations.js";

test("desconto geral e pedágio selecionado alteram a base da comissão", () => {
  const f = { value: 1000, discount: 100, toll: 80, commission: 10, commissionType: "percent" };
  assert.equal(freightBase(f), 900);
  assert.equal(freightCommission(f), 90);
  assert.equal(freightBase({ ...f, deductToll: true }), 820);
  assert.equal(freightCommission({ ...f, deductToll: true }), 82);
});
test("a base da comissão não fica negativa", () => assert.equal(freightBase({ value: 100, discount: 150 }), 0));
test("comissão fixa é valor, não porcentagem", () => assert.equal(freightCommission({ value: 2500, commissionType: "fixed", commission: 175 }), 175));
test("bônus não entra na base da comissão", () => {
  const f = { value: 1200, discount: 200, toll: 50, commission: 10, commissionType: "percent", bonus: 40, deductToll: true };
  assert.equal(freightBase(f), 950); assert.equal(freightCommission(f), 95); assert.equal(freightBonus(f), 40);
});
test("custo e lucro incluem pedágio, combustível real, comissão, bônus e outros custos", () => {
  const f = { value: 2000, discount: 100, toll: 100, fuelActual: 300, otherCosts: 50, commission: 10, commissionType: "percent", bonus: 25 };
  assert.equal(freightCost(f), 665); assert.equal(freightProfit(f), 1235);
});
test("líquido respeita a regra legada do pedágio descontável", () => {
  const f = { value: 2000, discount: 100, toll: 100, commission: 10, commissionType: "percent", bonus: 25, deductToll: true };
  assert.equal(freightNet(f), 1635); assert.equal(freightNet({ ...f, deductToll: false }), 1735);
});
test("valores ausentes são tratados como zero", () => {
  for (const fn of [freightBase, freightCommission, freightBonus, freightCost, freightProfit, freightNet]) assert.equal(fn({}), 0);
});
