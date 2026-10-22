import { useMemo, useState } from "react";
import { freightCommission, freightProfit } from "../domain/freightCalculations.js";
import { money, currentMonth } from "../lib/formatters.js";
import { DataTable } from "../components/DataTable.jsx";
import StatCard from "../components/StatCard.jsx";

export default function ReportsPage({ data }) {
  const [month, setMonth] = useState(currentMonth());
  const monthFreights = useMemo(() => (data.freights || []).filter((f) => String(f.date || "").startsWith(month)), [data.freights, month]);
  const expensesPaid = (expense) => (expense.installments || []).reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const expensesOpen = (expense) => Math.max(0, Number(expense.value || 0) - expensesPaid(expense));
  const expensePaymentsInMonth = (data.expenses || []).flatMap((expense) => (expense.installments || []).flatMap((item) => item.payments || []))
    .filter((payment) => String(payment.date || "").startsWith(month)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return <><div className="welcome-panel"><div><p className="eyebrow">RELATÓRIOS GERENCIAIS</p><h2>Resumo de {month || "todos os períodos"}</h2><p>Indicadores calculados a partir dos dados já registrados.</p></div><label className="month-picker">Período<input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} /></label></div>
    <div className="stats-grid"><StatCard label="Faturamento" value={money(monthFreights.reduce((s,f)=>s+Number(f.value||0),0))} hint={`${monthFreights.length} frete(s)`} /><StatCard label="Recebido de clientes" value={money(monthFreights.reduce((s,f)=>s+Number(f.received||0),0))} hint="Recebimentos dos fretes do período" tone="positive" /><StatCard label="Despesas pagas no mês" value={money(expensePaymentsInMonth)} hint="Pagamentos registrados no período" tone="negative" /><StatCard label="Contas a pagar em aberto" value={money((data.expenses||[]).reduce((s,e)=>s+expensesOpen(e),0))} hint="Saldo das parcelas pendentes" tone="attention" /></div>
    <section className="panel"><div className="panel-heading"><div><h3>Resultado por motorista</h3><p>Fretes do período selecionado.</p></div></div><DataTable columns={[
      {key:"driver",label:"Motorista"},
      {key:"count",label:"Fretes",numeric:true,render:(r)=>r.freights.length},
      {key:"revenue",label:"Faturamento",numeric:true,render:(r)=>money(r.freights.reduce((s,f)=>s+Number(f.value||0),0))},
      {key:"commission",label:"Comissão",numeric:true,render:(r)=>money(r.freights.reduce((s,f)=>s+freightCommission(f),0))},
      {key:"profit",label:"Lucro estimado",numeric:true,render:(r)=>money(r.freights.reduce((s,f)=>s+freightProfit(f),0))}
    ]} rows={[...new Set(monthFreights.map((f)=>f.driver||"Não informado"))].sort().map((driver)=>({id:driver,driver,freights:monthFreights.filter((f)=>(f.driver||"Não informado")===driver)}))} emptyLabel="Sem fretes neste período." /></section>
    <section className="panel"><div className="panel-heading"><div><h3>Despesas por categoria</h3><p>Valores totais, pagos e pendentes.</p></div></div><DataTable columns={[
      {key:"category",label:"Categoria"},
      {key:"total",label:"Total",numeric:true,render:(e)=>money(e.expenses.reduce((s,x)=>s+Number(x.value||0),0))},
      {key:"paid",label:"Pago",numeric:true,render:(e)=>money(e.expenses.reduce((s,x)=>s+expensesPaid(x),0))},
      {key:"open",label:"Em aberto",numeric:true,render:(e)=>money(e.expenses.reduce((s,x)=>s+expensesOpen(x),0))}
    ]} rows={[...new Set((data.expenses||[]).map((e)=>e.category||"Sem categoria"))].sort().map((category)=>({id:category,category,expenses:(data.expenses||[]).filter((e)=>(e.category||"Sem categoria")===category)}))} emptyLabel="Sem despesas cadastradas." /></section></>;
}
