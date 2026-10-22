import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { freightProfit } from "./domain/freightCalculations.js";

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

function Login({ onLogin, busy, error }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return <main className="login-page"><form className="login-card" onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }}>
    <img className="login-logo" src="./logo.svg" alt="R&R Figueredo Transportes" />
    <p className="eyebrow">SISTEMA DE GESTÃO</p><h1>Acesse sua conta</h1>
    <p className="muted">Entre para consultar os dados da transportadora.</p>
    <label htmlFor="login-username">Usuário</label><input id="login-username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Digite seu usuário" required />
    <label htmlFor="login-password">Senha</label><input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Digite sua senha" required />
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="primary-button login-submit" type="submit" disabled={busy || !supabase}>{busy ? "Entrando…" : "Entrar"}</button>
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
    const payable = expenses.reduce((sum, exp) => sum + (Array.isArray(exp.installments)
      ? exp.installments.reduce((subtotal, item) => subtotal + Math.max(0, Number(item.value || 0) - Number(item.paid || 0)), 0)
      : Math.max(0, Number(exp.value || 0) - Number(exp.paid || 0))), 0);
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
      setData({
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

  useEffect(() => { if (session) loadData(); else { setDataError(""); setData({ freights: [], expenses: [], receivables: [], employees: [], trucks: [], categories: [] }); } }, [session, loadData]);

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
  if (!session) return <Login onLogin={login} busy={busy} error={authError} />;

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
      {activePage === "dashboard" ? <Dashboard data={data} onRefresh={loadData} loading={loadingData} /> : <MigrationNotice page={activePage} />}
      <footer className="app-footer">Versão React em migração gradual · Este painel apenas lê o Supabase.</footer>
    </div></main>
  </div>;
}
