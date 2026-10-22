import test from "node:test";
import assert from "node:assert/strict";
import { freightReceivableBalance, freightReceivableStatus } from "./freightReceivables.js";

test("todo frete tem saldo a receber até atingir o valor total", () => {
  assert.equal(freightReceivableBalance({ value: 1000, received: 0 }), 1000);
  assert.equal(freightReceivableBalance({ value: 1000, received: 250 }), 750);
  assert.equal(freightReceivableBalance({ value: 1000, received: 1000 }), 0);
});

test("situação do recebível acompanha o valor recebido no frete", () => {
  assert.equal(freightReceivableStatus({ value: 1000, received: 0 }), "Pendente");
  assert.equal(freightReceivableStatus({ value: 1000, received: 300 }), "Parcial");
  assert.equal(freightReceivableStatus({ value: 1000, received: 1000 }), "Pago");
});

test("não apresenta saldo negativo nem marca frete sem valor como pago", () => {
  assert.equal(freightReceivableBalance({ value: 100, received: 150 }), 0);
  assert.equal(freightReceivableStatus({ value: 0, received: 0 }), "Pendente");
});
