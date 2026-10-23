import "./../styles/freight-payment-status.css";
import FreightForm from "./FreightForm.jsx";
import RouteDisplay from "../components/RouteDisplay.jsx";
import "../styles/freight-table-standard.css";
import FormDialog from "../components/FormDialog.jsx";
import FreightReceiptPanel from "../components/FreightReceiptPanel.jsx";
import { freightReceivableBalance } from "../domain/freightReceivables.js";
import { freightCommission, freightDriverPayment, freightOperatingCosts, freightProfit } from "../domain/freightCalculations.js";

export default function Fretes({ controller }) {
  const { data, readOnly, loading, saving, form, setForm, editingId, setEditingId, startCreate, startEdit, saveFreight, showError, toolbar, filteredFreights, dateLabel, money, Actions, remove, payment, setPayment, allFreights, number, commit, employees, trucks } = controller;
  const openReceipt = (freight) => {
    setForm(null);
    setEditingId(null);
    setPayment({ kind: "receive", record: freight });
  };
  return <section className="panel">
    <div className="panel-heading"><div><h3>Fretes</h3><p>Cadastre viagens e acompanhe custos, comissão e recebimentos.</p></div>{!readOnly && <button className="primary-button" disabled={loading || saving} onClick={() => startCreate("freight")}>+ Novo frete</button>}</div>
    {showError}
    {!readOnly && form && <FormDialog label={editingId ? "Editar frete" : "Novo frete"} onClose={() => setForm(null)}><FreightForm title={editingId ? "Editar frete" : "Novo frete"} value={form} setValue={setForm} saving={saving} onCancel={() => setForm(null)} onSubmit={saveFreight} employees={data.employees || []} trucks={data.trucks || []} editing={Boolean(editingId)} /></FormDialog>}
    {toolbar}
    <div className="table-scroll"><table className="rr-freight-table"><thead><tr><th>Data</th><th>Motorista</th><th>Trajeto</th><th>Valor</th><th>Custo total</th><th>Comissão</th><th>Lucro</th><th>Total motorista</th><th>Pagamento</th>{!readOnly && <th>Ações</th>}</tr></thead><tbody>
      {filteredFreights.map((freight) => {

        const balance = freightReceivableBalance(freight, number);
        return <tr key={freight.id} className={!readOnly ? "editable-row" : undefined} title={!readOnly ? "Dê duplo clique para editar este frete" : undefined} onDoubleClick={!readOnly ? () => startEdit("freight", freight) : undefined}>
          <td>{dateLabel(freight.date)}</td><td>{freight.driver || "—"}</td><td><RouteDisplay origin={freight.origin} destination={freight.destination} /></td>
          <td className="numeric">{money(freight.value)}</td><td className="numeric">{money(freightOperatingCosts(freight))}</td><td className="numeric">{money(freightCommission(freight))}</td><td className="numeric">{money(freightProfit(freight))}</td><td className="numeric">{money(freightDriverPayment(freight))}</td><td className={`freight-payment-cell ${balance <= 0 ? "is-paid" : "is-pending"}`}>{balance <= 0 ? "Pagamento realizado" : `Saldo restante: ${money(balance)}`}</td>

          {!readOnly && <td><div className="record-actions"><Actions onEdit={() => startEdit("freight", freight)} onDelete={() => remove("freights", freight)} />{freightReceivableBalance(freight, number) > 0 && <button className="secondary-button" type="button" disabled={saving} onClick={() => openReceipt(freight)} title="Registrar recebimento" aria-label="Registrar recebimento">▣</button>}</div></td>}
        </tr>;
      })}
    </tbody></table></div>
    {filteredFreights.length === 0 && <div className="empty-state">Nenhum frete encontrado para os filtros selecionados.</div>}
    {!readOnly && payment?.kind === "receive" && <FreightReceiptPanel freight={allFreights.find((item) => item.id === payment.record.id) || payment.record} data={data} number={number} money={money} saving={saving} onSave={(next) => commit(next)} onCancel={() => setPayment(null)} />}
  </section>;
}
