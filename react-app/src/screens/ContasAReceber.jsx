import FreightReceiptPanel from "../components/FreightReceiptPanel.jsx";
import { freightReceivableBalance, freightReceivableStatus } from "../domain/freightReceivables.js";

export default function ContasAReceber({ controller }) {
  const { data, readOnly, saving, showError, toolbar, filteredFreights, dateLabel, money, payment, setPayment, setForm, setEditingId, allFreights, number, commit } = controller;
  const openReceipt = (freight) => {
    setForm(null);
    setEditingId(null);
    setPayment({ kind: "receive", record: freight });
  };
  return <section className="panel">
    <div className="panel-heading"><div><h3>Contas a receber</h3><p>Cada frete gera um recebível vinculado ao mesmo registro. O status é atualizado conforme os pagamentos.</p></div></div>
    {showError}{toolbar}
    <div className="table-scroll"><table><thead><tr><th>Data</th><th>Cliente</th><th>Rota</th><th>Valor do frete</th><th>Recebido</th><th>Saldo em aberto</th><th>Situação</th>{!readOnly && <th>Ação</th>}</tr></thead><tbody>
      {filteredFreights.map((freight) => {
        const balance = freightReceivableBalance(freight, number);
        const status = freightReceivableStatus(freight, number);
        return <tr key={freight.id}>
          <td>{dateLabel(freight.date)}</td><td>{freight.customer || "—"}</td><td>{[freight.origin, freight.destination].filter(Boolean).join(" → ") || "—"}</td>
          <td className="numeric">{money(freight.value)}</td><td className="numeric">{money(freight.received)}</td><td className="numeric">{money(balance)}</td>
          <td><span className={`status-pill status-${status.toLocaleLowerCase("pt-BR")}`}>{status}</span></td>
          {!readOnly && <td>{balance > 0 ? <button className="primary-button" type="button" disabled={saving} onClick={() => openReceipt(freight)}>{status === "Parcial" ? "Receber saldo" : "Marcar como pago"}</button> : <span className="muted">Recebido integralmente</span>}</td>}
        </tr>;
      })}
    </tbody></table></div>
    {filteredFreights.length === 0 && <div className="empty-state">Nenhuma conta a receber encontrada para os filtros selecionados.</div>}
    {!readOnly && payment?.kind === "receive" && <FreightReceiptPanel freight={allFreights.find((item) => item.id === payment.record.id) || payment.record} data={data} number={number} money={money} saving={saving} onSave={(next) => commit(next)} onCancel={() => setPayment(null)} />}
  </section>;
}
