import RefreshButton from "../components/RefreshButton.jsx";
import "../styles/corporate-table-headings.css";
import { useMemo, useState } from "react";
import { freightCommission, freightOperatingCosts, freightProfit } from "../domain/freightCalculations.js";
import { money, dateLabel, currentMonth } from "../lib/formatters.js";
import StatCard from "../components/StatCard.jsx";
import BalanceDetailDialog from "../components/BalanceDetailDialog.jsx";
import "../styles/balanco-geral.css";

export default function PainelInicial({ data, onRefresh, loading, onOpenRecord }) {
  const [month, setMonth] = useState(currentMonth());
  const [detail, setDetail] = useState(null);
  const summary = useMemo(() => {
    const freights = Array.isArray(data.freights) ? data.freights : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];
    const selected = freights.filter((f) => String(f.date || "").slice(0, 7) === month);
    // Usa as funções financeiras do domínio React para manter os indicadores consistentes.
    const receivable = freights.reduce((sum, f) => sum + Math.max(0, Number(f.value || 0) - Number(f.received || 0)), 0);
    const payable = expenses.reduce((sum, exp) => sum + Math.max(0,
      Number(exp.value || 0) - (Array.isArray(exp.installments)
        ? exp.installments.reduce((subtotal, item) => subtotal + Number(item.paid || 0), 0)
        : Number(exp.paid || 0))), 0);
    const expenseTotal = expenses.filter((exp) => String(exp.created || "").slice(0, 7) === month)
      .reduce((sum, exp) => sum + Number(exp.value || 0), 0);
    return {
      selected, revenue: selected.reduce((sum, f) => sum + Number(f.value || 0), 0),
      profit: selected.reduce((sum, f) => sum + freightProfit(f), 0) - expenseTotal, receivable, payable,
      recent: [...selected].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 6)
    };
  }, [data, month]);
  return <>
    <section className="welcome-panel"><div><h2 className="balance-heading">PAINEL DA TRANSPORTADORA</h2></div>
      <label className="month-picker balance-period-picker"><span className="balance-period-label">PERÍODO</span><span className="balance-period-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg><input aria-label="Período do balanço geral" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></span></label></section>
    <div className="stats-grid">
      <button type="button" className="balance-stat-action" onClick={() => setDetail("revenue")} aria-label="Ver detalhamento do faturamento do mês"><StatCard label="Faturamento do mês" value={money(summary.revenue)} /></button>
      <button type="button" className="balance-stat-action" onClick={() => setDetail("profit")} aria-label="Ver detalhamento do lucro estimado"><StatCard label="Lucro estimado do mês" value={money(summary.profit)} tone="positive" /></button>
      <button type="button" className="balance-stat-action" onClick={() => setDetail("receivable")} aria-label="Ver detalhamento dos valores a receber"><StatCard label="Valores a receber" value={money(summary.receivable)} tone="attention" /></button>
      <button type="button" className="balance-stat-action" onClick={() => setDetail("payable")} aria-label="Ver detalhamento das contas a pagar"><StatCard label="Contas a pagar" value={money(summary.payable)} tone="negative" /></button>
    </div>
    <section className="panel"><div className="panel-heading"><div><h3>ÚLTIMAS VIAGENS</h3></div><RefreshButton onRefresh={onRefresh} loading={loading} /></div>
      {summary.recent.length === 0 ? <div className="empty-state"><strong>Nenhum frete encontrado</strong><p>Os fretes cadastrados no Supabase aparecerão aqui.</p></div> :
      <div className="table-scroll"><table><thead><tr><th>Data</th><th>Motorista</th><th>Trajeto</th><th>Valor</th><th>Custo total</th><th>Comissão</th><th>Lucro</th></tr></thead><tbody>
        {summary.recent.map((f, i) => <tr key={f.id ?? `${f.date}-${i}`} className="balance-data-row" title="Duplo clique para abrir o frete" onDoubleClick={() => onOpenRecord?.("freights", f.id)}><td>{dateLabel(f.date)}</td><td>{f.driver || "—"}</td><td><span className="balance-route">{f.origin && <span className="balance-route-place">{f.origin}</span>}{f.origin && f.destination && <span className="balance-route-arrow" aria-label="para">→</span>}{f.destination && <span className="balance-route-place">{f.destination}</span>}{!f.origin && !f.destination && "—"}</span></td><td className="numeric">{money(f.value)}</td><td className="numeric">{money(freightOperatingCosts(f))}</td><td className="numeric">{money(freightCommission(f))}</td><td className="numeric">{money(freightProfit(f))}</td></tr>)}
      </tbody></table></div>}
    </section>
    {detail && <BalanceDetailDialog type={detail} month={month} data={data} onOpenRecord={onOpenRecord} onClose={() => setDetail(null)} />}
  </>;
}


