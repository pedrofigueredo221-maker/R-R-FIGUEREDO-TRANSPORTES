import test from "node:test";
import assert from "node:assert/strict";
import { freightReceivableBalance, freightReceivableStatus, applyFreightReceipt } from "./freightReceivables.js";

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

test("recebimento atualiza o frete vinculado e não duplica o mesmo lançamento", () => {
  const freights = [{ id: "f-1", value: 1000, received: 0, receipts: [] }, { id: "f-2", value: 500, received: 0, receipts: [] }];
  const receipt = { id: "r-1", date: "2026-10-22", amount: 1000, method: "PIX" };
  const updated = applyFreightReceipt(freights, "f-1", receipt);
  assert.equal(updated.find((item) => item.id === "f-1").received, 1000);
  assert.equal(updated.find((item) => item.id === "f-1").receipts.length, 1);
  assert.equal(updated.find((item) => item.id === "f-2").received, 0);
  assert.equal(applyFreightReceipt(updated, "f-1", receipt).find((item) => item.id === "f-1").received, 1000);
});

test("impede recebimento acima do saldo ou sem frete correspondente", () => {
  assert.throws(() => applyFreightReceipt([{ id: "f-1", value: 100, received: 90 }], "f-1", { id: "r-1", amount: 20 }), /ultrapassar o saldo/);
  assert.throws(() => applyFreightReceipt([], "missing", { id: "r-1", amount: 10 }), /Frete não encontrado/);
});

test("situação acompanha o saldo arredondado exibido", () => {
  assert.equal(freightReceivableStatus({ value: 1000, received: 999.99 }), "Parcial");
  assert.equal(freightReceivableStatus({ value: 1000, received: 1000 }), "Pago");
});
