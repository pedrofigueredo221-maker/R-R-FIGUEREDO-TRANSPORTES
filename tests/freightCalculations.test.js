import test from "node:test";
import assert from "node:assert/strict";
import {
  freightBase,
  freightCommission,
  freightBonus,
  freightCost,
  freightProfit,
  freightNet,
  freightDriverPayment,
  freightOperatingCosts
} from "../react-app/src/domain/freightCalculations.js";

test("calcula a base da comissão sem descontar pedágio quando a opção está desmarcada", () => {
  assert.equal(freightBase({ value: 1000, discount: 50, toll: 80, deductToll: false }), 950);
});

test("desconta o pedágio da base da comissão somente quando solicitado", () => {
  assert.equal(freightBase({ value: 1000, discount: 50, toll: 80, deductToll: true }), 870);
});

test("calcula comissão percentual e comissão fixa", () => {
  assert.equal(freightCommission({ value: 1000, commissionType: "percent", commission: 10 }), 100);
  assert.equal(freightCommission({ value: 1000, commissionType: "fixed", commission: 125 }), 125);
});

test("o custo total inclui comissão, bônus, pedágio, combustível real e outros custos, sem classificar desconto como custo", () => {
  const freight = {
    value: 2000, discount: 100, toll: 80, commissionType: "fixed",
    commission: 120, bonus: 30, fuelActual: 250, otherCosts: 45
  };
  assert.equal(freightCost(freight), 525);
  assert.equal(freightOperatingCosts(freight), 375);
  assert.equal(freightBonus(freight), 30);
  assert.equal(freightDriverPayment(freight), 150);
});

test("lucro estimado subtrai desconto e todos os custos operacionais e de motorista", () => {
  const freight = {
    value: 2000, discount: 100, toll: 80, commissionType: "fixed",
    commission: 120, bonus: 30, fuelActual: 250, otherCosts: 45
  };
  assert.equal(freightProfit(freight), 1375);
  assert.equal(freightProfit(freight), freight.value - freight.discount - freightCost(freight));
});

test("valores ausentes são tratados como zero sem produzir NaN", () => {
  assert.equal(freightBase(), 0);
  assert.equal(freightCommission(), 0);
  assert.equal(freightCost(), 0);
  assert.equal(freightProfit(), 0);
  assert.equal(freightNet(), 0);
});

test("freightNet preserva a regra existente para pedágio deduzido da comissão", () => {
  assert.equal(
    freightNet({ value: 1000, discount: 20, toll: 50, deductToll: true, commissionType: "fixed", commission: 100, bonus: 10 }),
    840
  );
});
