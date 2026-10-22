import FreightForm from "./FreightForm.jsx";
import FreightReceiptPanel from "../components/FreightReceiptPanel.jsx";
import { freightReceivableBalance, freightReceivableStatus } from "../domain/freightReceivables.js";

export default function FreightsPage({ controller }) {
  const { data, readOnly, loading, saving, form, setForm, editingId, setEditingId, startCreate, startEdit, saveFreight, showError, toolbar, filteredFreights, dateLabel, money, Actions, remove, payment, setPayment, allFreights, number, commit, employees, trucks } = controller;
  const openReceipt = (freight) => {
    setForm(null);
    setEditingId(null);
    setPayment({ kind: "receive", record: freight });
  };
  return <section className="panel">
    <div className="panel-heading"><div><h3>Fretes</h3><p>Cadastre viagens e acompanhe custos, comissão e recebimentos.</p></div>{!readOnly && <button className="primary-button" disabled={loading || saving} onClick={() => startCreate("freight")}>+ Novo frete</button>}</div>
    {showError}
    {!readOnly && form && <FreightForm title={editingId ? "Editar frete" : "Novo frete"} value={form} setValue={setForm} saving={saving} onCancel={() => setForm(null)} onSubmit={saveFreight} employees={data.employees || []} trucks={data.trucks || []} editing={Boolean(editingId)} />}
    {toolbar}
    <div className="table-scroll"><table><thead><tr><th>Data</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Valor</th><th>Recebido</th><th>Saldo</th><th>Situação</th>{!readOnly && <th>Ações</th>}</tr></thead><tbody>
      {filteredFreights.map((freight) => {
        const status = freightReceivableStatus(freight, number);
        return <tr key={freight.id}>
          <td>{dateLabel(freight.date)}</td><td>{freight.customer || "—"}</td><td>{freight.driver || "—"}</td><td>{[freight.origin, freight.destination].filter(Boolean).join(" → ") || "—"}</td>
          <td className="numeric">{money(freight.value)}</td><td className="numeric">{money(freight.received)}</td><td className="numeric">{money(freightReceivableBalance(freight, number))}</td>
          <td><span className={`status-pill status-${status.toLocaleLowerCase("pt-BR")}`}>{status}</span></td>
          {!readOnly && <td><div className="record-actions"><Actions onEdit={() => startEdit("freight", freight)} onDelete={() => remove("freights", freight)} />{freightReceivableBalance(freight, number) > 0 && <button className="secondary-button" type="button" disabled={saving} onClick={() => openReceipt(freight)}>Registrar recebimento</button>}</div></td>}
        </tr>;
      })}
    </tbody></table></div>
    {filteredFreights.length === 0 && <div className="empty-state">Nenhum frete encontrado para os filtros selecionados.</div>}
    {!readOnly && payment?.kind === "receive" && <FreightReceiptPanel freight={allFreights.find((item) => item.id === payment.record.id) || payment.record} data={data} number={number} money={money} saving={saving} onSave={(next) => commit(next)} onCancel={() => setPayment(null)} />}
  </section>;
}
