import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { freightCommission, freightProfit } from "./domain/freightCalculations.js";
import EditablePage from "./EditablePage.jsx";

const config = window.APP_CONFIG || {};
const supabase = config.SUPABASE_URL && config.SUPABASE_ANON_KEY
  ? createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
const pages = [
  { id: "dashboard", label: "Visão geral", symbol: "▦" },
  { id: "freights", label: "Fretes", symbol: "⇄" },
  { id: "expenses", label: "Despesas e manutenção", symbol: "▤" },
  { id: "receivables", label: "Contas a receber", symbol: "↗" },
  { id: "payments", label: "Contas a pagar", symbol: "◷" },
  { id: "reports", label: "Relatórios", symbol: "▥" },
  { id: "cadastros", label: "Cadastros", symbol: "▦" }
];
const titles = Object.fromEntries(pages.map((page) => [page.id, page.label]));
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
};
const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const todayISO = () => new Date().toISOString().slice(0, 10);

function Login({ onLogin, onReset, busy, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  return <main className="login-page"><form className="login-card" onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }}>
    <img className="login-logo" src="./logo.svg" alt="R&R Figueredo Transportes" />
    <p className="eyebrow">SISTEMA DE GESTÃO</p><h1>Acesse sua conta</h1>
    <p className="muted">Entre para consultar os dados da transportadora.</p>
    <label htmlFor="login-username">Usuário</label><input id="login-username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Digite seu usuário" required />
    <label htmlFor="login-password">Senha</label><input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Digite sua senha" required />
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="primary-button login-submit" type="submit" disabled={busy || !supabase}>{busy ? "Entrando…" : "Entrar"}</button>
    <button className="secondary-button login-submit" type="button" disabled={busy || resetBusy || !supabase} onClick={async () => {
      setResetMessage("");
      setResetBusy(true);
      try {
        await onReset(username);
        setResetMessage("Se a solicitação for aceita, você receberá um e-mail. Confira também a pasta de spam.");
      } catch (resetError) {
        setResetMessage(resetError?.message || "Não foi possível solicitar a recuperação de senha.");
      } finally { setResetBusy(false); }
    }}>{resetBusy ? "Solicitando…" : "Esqueci minha senha"}</button>
    {resetMessage && <p className="reset-message" role="status">{resetMessage}</p>}
    {!supabase && <p className="error-message">Configuração do Supabase não encontrada. Confira public/app-config.js.</p>}
    <small className="muted login-note">Acesso protegido pelo Supabase.</small>
  </form></main>;
}

function Stat({ label, value, hint, tone = "" }) {
  return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>;
}

function Dashboard({ data, onRefresh, loading }) {
  const [month, setMonth] = useState(currentMonth());
  const summary = useMemo(() => {
    const freights = Array.isArray(data.freights) ? data.freights : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];
    const selected = freights.filter((f) => String(f.date || "").slice(0, 7) === month);
    // Mantém as mesmas definições financeiras usadas no painel HTML existente.
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
      <Stat label="Faturamento do mês" value={money(summary.revenue)} hint={`${summary.selected.length} frete(s) no período`} />
      <Stat label="Lucro estimado do mês" value={money(summary.profit)} hint="Estimativa calculada a partir dos fretes" tone="positive" />
      <Stat label="Valores a receber" value={money(summary.receivable)} hint="Saldo estimado dos fretes" tone="attention" />
      <Stat label="Contas a pagar" value={money(summary.payable)} hint="Parcelas ainda não pagas" tone="negative" />
    </div>
    <section className="panel"><div className="panel-heading"><div><h3>Fretes recentes</h3><p>Últimos lançamentos registrados no banco compartilhado.</p></div><button className="secondary-button" onClick={onRefresh} disabled={loading}>{loading ? "Atualizando…" : "↻ Atualizar"}</button></div>
      {summary.recent.length === 0 ? <div className="empty-state"><strong>Nenhum frete encontrado</strong><p>Os fretes cadastrados no Supabase aparecerão aqui.</p></div> :
      <div className="table-scroll"><table><thead><tr><th>Data</th><th>Cliente</th><th>Motorista</th><th>Origem / destino</th><th>Valor</th></tr></thead><tbody>
        {summary.recent.map((f, i) => <tr key={f.id ?? `${f.date}-${i}`}><td>{dateLabel(f.date)}</td><td>{f.customer || "—"}</td><td>{f.driver || "—"}</td><td>{[f.origin, f.destination].filter(Boolean).join(" → ") || "—"}</td><td className="numeric">{money(f.value)}</td></tr>)}
      </tbody></table></div>}
    </section>
  </>;
}

function DataTable({ columns, rows, emptyLabel = "Nenhum registro encontrado." }) {
  return rows.length ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.id ?? row.key ?? index}>{columns.map((column) => <td key={column.key} className={column.numeric ? "numeric" : ""}>{column.render ? column.render(row) : (row[column.key] ?? "—")}</td>)}</tr>)}</tbody>
  </table></div> : <div className="empty-state"><strong>{emptyLabel}</strong></div>;
}

function ReadOnlyPage({ page, data }) {
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [cadastroTab, setCadastroTab] = useState("employees");
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const freights = (data.freights || []).filter((f) =>
    (!month || String(f.date || "").startsWith(month)) &&
    (!query || [f.customer, f.driver, f.truck, f.origin, f.destination, f.notes].some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(query)))
  ).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const expenses = (data.expenses || []).filter((e) =>
    (!month || (e.installments || []).some((item) => String(item.due || "").startsWith(month) || (item.payments || []).some((payment) => String(payment.date || "").startsWith(month)))) &&
    (!query || [e.description, e.category, e.truck, e.supplier, e.notes].some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(query)))
  );
  const payments = (data.expenses || []).flatMap((expense) => (expense.installments || []).map((item, index) => ({
    key: `${expense.id ?? expense.description}-${index}`, due: item.due, payments: item.payments || [], description: expense.description,
    category: expense.category, truck: expense.truck, index: index + 1, count: expense.installments.length,
    value: Number(item.value || 0), paid: Number(item.paid || 0), open: Math.max(0, Number(item.value || 0) - Number(item.paid || 0))
  }))).filter((item) =>
    (!month || String(item.due || "").startsWith(month) || item.payments.some((payment) => String(payment.date || "").startsWith(month))) &&
    (!query || [item.description, item.category, item.truck].some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(query)))
  ).sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));
  const expensesPaid = (expense) => (expense.installments || []).reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const expensesOpen = (expense) => Math.max(0, Number(expense.value || 0) - expensesPaid(expense));
  const monthFreights = (data.freights || []).filter((f) => String(f.date || "").startsWith(month));
  const monthExpenses = (data.expenses || []).filter((e) => String(e.created || "").startsWith(month));
  const expensePaymentsInMonth = (data.expenses || []).flatMap((expense) => (expense.installments || []).flatMap((item) => item.payments || []))
    .filter((payment) => String(payment.date || "").startsWith(month)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const searchBar = <div className="page-filters"><input aria-label="Buscar registros" placeholder="Buscar nos registros..." value={search} onChange={(e) => setSearch(e.target.value)} />
    <label>Período<input aria-label="Filtrar por mês" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
    <button className="secondary-button" onClick={() => { setSearch(""); setMonth(""); }}>Limpar filtros</button></div>;
  if (page === "freights") return <section className="panel"><div className="panel-heading"><div><h3>Fretes cadastrados</h3><p>Consulta de registros; os lançamentos continuam disponíveis na versão atual.</p></div><span className="result-count">{freights.length} registro(s)</span></div>{searchBar}
    <DataTable columns={[
      {key:"date",label:"Data",render:(f)=>dateLabel(f.date)},
      {key:"customer",label:"Cliente",render:(f)=>f.customer||"—"},
      {key:"driver",label:"Motorista"},
      {key:"truck",label:"Caminhão",render:(f)=>f.truck||"—"},
      {key:"route",label:"Origem / destino",render:(f)=>[f.origin,f.destination].filter(Boolean).join(" → ")||"—"},
      {key:"value",label:"Valor",numeric:true,render:(f)=>money(f.value)},
      {key:"received",label:"Recebido",numeric:true,render:(f)=>money(f.received)},
      {key:"open",label:"A receber",numeric:true,render:(f)=>money(Math.max(0,Number(f.value||0)-Number(f.received||0)))},
      {key:"commission",label:"Comissão",numeric:true,render:(f)=>money(freightCommission(f))},
      {key:"profit",label:"Lucro estimado",numeric:true,render:(f)=>money(freightProfit(f))}
    ]} rows={freights} emptyLabel="Nenhum frete encontrado para os filtros selecionados." /></section>;
  if (page === "expenses") return <section className="panel"><div className="panel-heading"><div><h3>Despesas e manutenção</h3><p>Resumo das despesas, pagamentos e saldos em aberto.</p></div><span className="result-count">{expenses.length} registro(s)</span></div><div className="page-filters"><input aria-label="Buscar despesas" placeholder="Descrição, categoria, caminhão ou fornecedor..." value={search} onChange={(e)=>setSearch(e.target.value)} /><label>Período<input aria-label="Filtrar despesas por mês" type="month" value={month} onChange={(e)=>setMonth(e.target.value)} /></label><button className="secondary-button" onClick={()=>{setSearch("");setMonth("");}}>Limpar filtros</button></div>
    <DataTable columns={[
      {key:"description",label:"Descrição",render:(e)=>e.description||"—"},
      {key:"category",label:"Categoria"},
      {key:"truck",label:"Caminhão",render:(e)=>e.truck||"—"},
      {key:"supplier",label:"Fornecedor",render:(e)=>e.supplier||"—"},
      {key:"value",label:"Valor",numeric:true,render:(e)=>money(e.value)},
      {key:"paid",label:"Pago",numeric:true,render:(e)=>money(expensesPaid(e))},
      {key:"open",label:"Em aberto",numeric:true,render:(e)=>money(expensesOpen(e))},
      {key:"installments",label:"Parcelas",render:(e)=>(e.installments||[]).length}
    ]} rows={expenses} emptyLabel="Nenhuma despesa encontrada." /></section>;
  if (page === "receivables") {
    const receivables = (data.freights || []).filter((f) => (!month || String(f.date || "").startsWith(month)) && (!query || [f.customer,f.driver,f.origin,f.destination].some((v)=>String(v||"").toLocaleLowerCase("pt-BR").includes(query))))
      .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    return <section className="panel"><div className="panel-heading"><div><h3>Contas a receber</h3><p>Saldo calculado pelo valor do frete menos os recebimentos registrados.</p></div></div>{searchBar}
      <DataTable columns={[
        {key:"date",label:"Data",render:(f)=>dateLabel(f.date)},
        {key:"customer",label:"Cliente",render:(f)=>f.customer||"Cliente não informado"},
        {key:"route",label:"Rota",render:(f)=>[f.origin,f.destination].filter(Boolean).join(" → ")||"—"},
        {key:"value",label:"Valor do frete",numeric:true,render:(f)=>money(f.value)},
        {key:"received",label:"Recebido",numeric:true,render:(f)=>money(f.received)},
        {key:"open",label:"Falta receber",numeric:true,render:(f)=>money(Math.max(0,Number(f.value||0)-Number(f.received||0)))},
        {key:"status",label:"Situação",render:(f)=>Number(f.received||0)>=Number(f.value||0)?"Recebido":Number(f.received||0)>0?"Parcial":"Pendente"}
      ]} rows={receivables} emptyLabel="Nenhum valor a receber encontrado." /></section>;
  }
  if (page === "payments") return <section className="panel"><div className="panel-heading"><div><h3>Contas a pagar</h3><p>Parcelas, pagamentos já realizados e valores em aberto.</p></div></div><div className="page-filters"><input aria-label="Buscar contas a pagar" placeholder="Buscar descrição, categoria ou caminhão..." value={search} onChange={(e)=>setSearch(e.target.value)} /><label>Período<input aria-label="Filtrar contas por mês" type="month" value={month} onChange={(e)=>setMonth(e.target.value)} /></label><button className="secondary-button" onClick={()=>{setSearch("");setMonth("");}}>Limpar filtros</button></div>
    <DataTable columns={[
      {key:"due",label:"Vencimento",render:(i)=>dateLabel(i.due)},
      {key:"description",label:"Descrição"},
      {key:"category",label:"Categoria"},
      {key:"truck",label:"Caminhão",render:(i)=>i.truck||"—"},
      {key:"installment",label:"Parcela",render:(i)=>`${i.index}/${i.count}`},
      {key:"value",label:"Valor",numeric:true,render:(i)=>money(i.value)},
      {key:"paid",label:"Pago",numeric:true,render:(i)=>money(i.paid)},
      {key:"open",label:"Falta pagar",numeric:true,render:(i)=>money(i.open)},
      {key:"status",label:"Situação",render:(i)=>i.open<=0?"Paga":String(i.due||"")<todayISO()?"Atrasada":i.paid>0?"Parcial":"Em aberto"}
    ]} rows={payments} emptyLabel="Nenhuma parcela encontrada." /></section>;
  if (page === "reports") return <><div className="welcome-panel"><div><p className="eyebrow">RELATÓRIOS GERENCIAIS</p><h2>Resumo de {month || "todos os períodos"}</h2><p>Indicadores calculados a partir dos dados já registrados.</p></div><label className="month-picker">Período<input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} /></label></div>
    <div className="stats-grid"><Stat label="Faturamento" value={money(monthFreights.reduce((s,f)=>s+Number(f.value||0),0))} hint={`${monthFreights.length} frete(s)`} /><Stat label="Recebido de clientes" value={money(monthFreights.reduce((s,f)=>s+Number(f.received||0),0))} hint="Recebimentos dos fretes do período" tone="positive" /><Stat label="Despesas pagas no mês" value={money(expensePaymentsInMonth)} hint="Pagamentos registrados no período" tone="negative" /><Stat label="Contas a pagar em aberto" value={money((data.expenses||[]).reduce((s,e)=>s+expensesOpen(e),0))} hint="Saldo das parcelas pendentes" tone="attention" /></div>
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
  if (page === "cadastros") {
    const employees = (data.employees || []).filter((e)=>!query||[e.name,e.role,e.phone].some((v)=>String(v||"").toLocaleLowerCase("pt-BR").includes(query)));
    const trucks = (data.trucks || []).filter((t)=>!query||[t.name,t.plate].some((v)=>String(v||"").toLocaleLowerCase("pt-BR").includes(query)));
    return <section className="panel"><div className="panel-heading"><div><h3>Cadastros da empresa</h3><p>Funcionários e caminhões cadastrados no banco compartilhado.</p></div></div>
      <div className="tabs-row" role="tablist" aria-label="Tipo de cadastro"><button className={cadastroTab==="employees"?"active":""} role="tab" aria-selected={cadastroTab==="employees"} onClick={()=>setCadastroTab("employees")}>Funcionários ({employees.length})</button><button className={cadastroTab==="trucks"?"active":""} role="tab" aria-selected={cadastroTab==="trucks"} onClick={()=>setCadastroTab("trucks")}>Caminhões ({trucks.length})</button><button className={cadastroTab==="categories"?"active":""} role="tab" aria-selected={cadastroTab==="categories"} onClick={()=>setCadastroTab("categories")}>Categorias ({(data.categories||[]).length})</button></div>
      <div className="page-filters"><input aria-label="Buscar cadastros" placeholder="Buscar cadastro..." value={search} onChange={(e)=>setSearch(e.target.value)} /></div>
      {cadastroTab==="employees" ? <DataTable columns={[
        {key:"name",label:"Nome"},
        {key:"role",label:"Função",render:(e)=>e.role||"Motorista"},
        {key:"phone",label:"Telefone",render:(e)=>e.phone||"—"},
        {key:"commission",label:"Comissão",render:(e)=>e.commissionType==="fixed"?money(e.commissionValue):`${Number(e.commissionValue??10)}%`},
        {key:"status",label:"Situação",render:(e)=>e.active===false?"Inativo":"Ativo"}
      ]} rows={employees} emptyLabel="Nenhum funcionário cadastrado." /> : cadastroTab==="trucks" ? <DataTable columns={[
        {key:"name",label:"Caminhão"},
        {key:"plate",label:"Placa",render:(t)=>t.plate||"—"},
        {key:"driver",label:"Motorista vinculado",render:(t)=>(data.employees||[]).find((e)=>e.id===t.driverId)?.name||"—"},
        {key:"status",label:"Situação",render:(t)=>t.active===false?"Inativo":"Ativo"}
      ]} rows={trucks} emptyLabel="Nenhum caminhão cadastrado." /> : <DataTable columns={[{key:"category",label:"Categoria"}]} rows={(data.categories||[]).filter((category)=>!query||category.toLocaleLowerCase("pt-BR").includes(query)).map((category)=>({id:category,category}))} emptyLabel="Nenhuma categoria cadastrada." />}
    </section>;
  }
  return <section className="panel"><h3>Área em preparação</h3><p>Esta tela será migrada em uma etapa futura.</p></section>;
}

function MigrationNotice({ page }) {
  return <section className="panel migration-notice"><span className="notice-icon" aria-hidden="true">↗</span><div>
    <p className="eyebrow">MIGRAÇÃO GRADUAL</p><h2>{titles[page]}</h2>
    <p>Esta tela ainda está sendo migrada. Para evitar perda de recursos ou dados, realize operações nesta área pela versão atual do sistema.</p>
    <p className="muted">Os formulários e ações desta seção ainda não foram substituídos nesta versão React.</p>
  </div></section>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [data, setData] = useState({ freights: [], expenses: [], receivables: [], employees: [], trucks: [], categories: [] });
  const [version, setVersion] = useState(0);
  const [dataError, setDataError] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return undefined; }
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) { setSession(nextSession); setAuthReady(true); }
    });
    supabase.auth.getSession().then(({ data: result, error }) => {
      if (!active) return;
      if (error) setAuthError("Não foi possível restaurar a sessão. Entre novamente.");
      setSession(result?.session || null); setAuthReady(true);
    }).catch(() => { if (active) { setAuthError("Não foi possível verificar a sessão do Supabase."); setAuthReady(true); } });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase || !session) return;
    setLoadingData(true); setDataError("");
    try {
      const { data: row, error } = await supabase.from("app_state").select("data,version").eq("id", 1).maybeSingle();
      if (error) throw error;
      if (!row || !row.data || typeof row.data !== "object") throw new Error("O registro public.app_state (id=1) não foi encontrado ou não está visível pelas políticas RLS. Nenhum dado foi criado ou sobrescrito.");
      setVersion(Number(row.version) || 0);
      setData({
        ...row.data,
        freights: Array.isArray(row.data.freights) ? row.data.freights : [],
        expenses: Array.isArray(row.data.expenses) ? row.data.expenses : [],
        receivables: Array.isArray(row.data.receivables) ? row.data.receivables : [],
        employees: Array.isArray(row.data.employees) ? row.data.employees : [],
        trucks: Array.isArray(row.data.trucks) ? row.data.trucks : [],
        categories: Array.isArray(row.data.categories) ? row.data.categories : []
      });
    } catch (error) { setDataError(error?.message || "Não foi possível carregar os dados do Supabase."); }
    finally { setLoadingData(false); }
  }, [session]);

  useEffect(() => { if (session) loadData(); else { setDataError(""); setVersion(0); setData({ freights: [], expenses: [], receivables: [], employees: [], trucks: [], categories: [] }); } }, [session, loadData]);

  useEffect(() => {
    if (!session) return undefined;
    const refresh = () => { if (!document.hidden) loadData(); };
    const interval = window.setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", refresh); };
  }, [session, loadData]);

  // Escrita otimista por versão: se outro computador salvar primeiro, recusamos
  // a gravação local e recarregamos os dados em vez de sobrescrever silenciosamente.
  const saveData = useCallback(async (nextData, formVersion = version) => {
    if (!supabase || !session) throw new Error("Sua sessão expirou. Entre novamente antes de salvar.");
    const next = {
      ...data,
      ...nextData,
      freights: Array.isArray(nextData.freights) ? nextData.freights : [],
      expenses: Array.isArray(nextData.expenses) ? nextData.expenses : [],
      receivables: Array.isArray(nextData.receivables) ? nextData.receivables : [],
      employees: Array.isArray(nextData.employees) ? nextData.employees : [],
      trucks: Array.isArray(nextData.trucks) ? nextData.trucks : [],
      categories: Array.isArray(nextData.categories) ? nextData.categories : []
    };
    if (formVersion !== version) {
      await loadData();
      throw new Error("Os dados mudaram em outro computador. Atualizei a consulta e fechei o formulário para evitar sobrescrever alterações; abra o registro novamente e confira os valores.");
    }
    const expectedVersion = version;
    const { data: updated, error } = await supabase.from("app_state")
      .update({ data: next, version: expectedVersion + 1, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .eq("version", expectedVersion)
      .select("version");
    if (error) throw new Error("O Supabase recusou a gravação. Nenhuma alteração foi confirmada: " + error.message);
    if (!updated || updated.length === 0) {
      await loadData();
      throw new Error("Outro computador alterou os dados primeiro. Atualizei a consulta e fechei o formulário; abra o registro novamente para conferir os valores.");
    }
    setData(next);
    setVersion(Number(updated[0].version) || expectedVersion + 1);
    setDataError("");
  }, [session, version, loadData, data]);

  const resetPassword = async (username) => {
    if (!supabase) throw new Error("Configuração do Supabase não encontrada.");
    const email = config.USER_EMAILS?.[String(username || "").trim().toUpperCase()];
    if (typeof email !== "string" || !email.trim()) throw new Error("Digite um usuário válido antes de solicitar a recuperação.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "https://pedrofigueredo221-maker.github.io/RR-FIGUEREDO-TRANSPORTES/redefinir-senha.html"
    });
    if (error) throw new Error("Não foi possível solicitar a recuperação. Confira as configurações de e-mail do Supabase.");
  };

  const login = async (username, password) => {
    if (!supabase) return;
    setBusy(true); setAuthError("");
    try {
      const email = config.USER_EMAILS?.[String(username || "").trim().toUpperCase()];
      if (typeof email !== "string" || !email.trim()) throw new Error("Usuário não configurado. Confira o nome informado.");
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) {
      setAuthError(error?.message === "Invalid login credentials" ? "Usuário ou senha incorretos." : error?.message || "Não foi possível entrar.");
    } finally { setBusy(false); }
  };
  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError("Não foi possível encerrar a sessão. Tente novamente.");
    else setActivePage("dashboard");
  };

  const email = session?.user?.email?.trim().toLowerCase() || "";
  const visitor = String(config.USER_EMAILS?.VISITANTES || config.USER_EMAILS?.VISITANTE || "").trim().toLowerCase();
  const readOnly = Boolean(visitor && email === visitor);

  if (!authReady) return <main className="loading-page"><span className="spinner" /><p>Verificando sessão segura…</p></main>;
  if (!session) return <Login onLogin={login} onReset={resetPassword} busy={busy} error={authError} />;

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}><div className="sidebar-brand"><img src="./logo.svg" alt="R&R Figueredo Transportes" /></div>
      <p className="nav-label">MENU PRINCIPAL</p><nav aria-label="Menu principal">{pages.map((p) => <button key={p.id} className={`nav-item ${activePage === p.id ? "active" : ""}`} onClick={() => { setActivePage(p.id); setMenuOpen(false); }}><span aria-hidden="true">{p.symbol}</span>{p.label}</button>)}</nav>
      <div className="sidebar-bottom"><span className="session-dot" /> Sessão autenticada</div>
    </aside>
    {menuOpen && <button className="mobile-overlay" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    <main className="main-area"><header className="topbar"><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir ou fechar menu">☰</button>
      <div><p className="eyebrow">R&amp;R FIGUEREDO TRANSPORTES</p><h1>{titles[activePage]}</h1></div>
      <div className="top-actions"><span className="user-label">{session.user?.email}</span><button className="secondary-button" onClick={logout}>Sair</button></div>
    </header>
    {readOnly && <div className="read-only-notice" role="status">Modo visitante: consulta somente leitura. Não há ações de cadastro nesta versão.</div>}
    <div className="content-area">
      {dataError && <div className="error-banner" role="alert"><strong>Não foi possível carregar os dados.</strong><p>{dataError}</p><button className="secondary-button" onClick={loadData} disabled={loadingData}>Tentar novamente</button></div>}
      {loadingData && !dataError && <div className="inline-loading"><span className="spinner" />Carregando dados compartilhados…</div>}
      {activePage === "dashboard" ? <Dashboard data={data} onRefresh={loadData} loading={loadingData} /> : activePage === "reports" ? <ReadOnlyPage page={activePage} data={data} /> : <EditablePage page={activePage} data={data} onSave={saveData} readOnly={readOnly} loading={loadingData} version={version} />}
      <footer className="app-footer">Versão React em migração gradual · Este painel apenas lê o Supabase.</footer>
    </div></main>
  </div>;
}
