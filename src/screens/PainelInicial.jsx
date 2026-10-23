import "../styles/corporate-table-headings.css";
import { useMemo, useState } from "react";
import { freightCommission, freightOperatingCosts, freightProfit } from "../domain/freightCalculations.js";
import { money, dateLabel, currentMonth } from "../lib/formatters.js";
import StatCard from "../components/StatCard.jsx";

export default function PainelInicial({ data, onRefresh, loading }) {
  const [month, setMonth] = useState(currentMonth());
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
    <section className="welcome-panel"><div><p className="eyebrow">PAINEL DA TRANSPORTADORA</p><h2>Seu negócio, em uma visão.</h2><p>Acompanhe os fretes e os principais números financeiros.</p></div>
      <label className="month-picker">Período do painel<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label></section>
    <div className="stats-grid">
      <StatCard label="Faturamento do mês" value={money(summary.revenue)} hint={`${summary.selected.length} frete(s) no período`} />
      <StatCard label="Lucro estimado do mês" value={money(summary.profit)} hint="Estimativa calculada a partir dos fretes" tone="positive" />
      <StatCard label="Valores a receber" value={money(summary.receivable)} hint="Saldo estimado dos fretes" tone="attention" />
      <StatCard label="Contas a pagar" value={money(summary.payable)} hint="Parcelas ainda não pagas" tone="negative" />
    </div>
    <section className="panel"><div className="panel-heading"><div><h3>Fretes recentes</h3><p>Últimos lançamentos registrados no banco compartilhado.</p></div><button className="secondary-button" onClick={onRefresh} disabled={loading}>{loading ? "Atualizando…" : "↻ Atualizar"}</button></div>
      {summary.recent.length === 0 ? <div className="empty-state"><strong>Nenhum frete encontrado</strong><p>Os fretes cadastrados no Supabase aparecerão aqui.</p></div> :
      <div className="table-scroll"><table><thead><tr><th>Data</th><th>Motorista</th><th>Origem / destino</th><th>Valor</th><th>Custo da empresa</th><th>Comissão</th><th>Lucro</th></tr></thead><tbody>
        {summary.recent.map((f, i) => <tr key={f.id ?? `${f.date}-${i}`}><td>{dateLabel(f.date)}</td><td>{f.driver || "—"}</td><td>{[f.origin, f.destination].filter(Boolean).join(" → ") || "—"}</td><td className="numeric">{money(f.value)}</td><td className="numeric">{money(freightOperatingCosts(f))}</td><td className="numeric">{money(freightCommission(f))}</td><td className="numeric">{money(freightProfit(f))}</td></tr>)}
      </tbody></table></div>}
    </section>
  </>;
}


