import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import OverviewPage from "./screens/OverviewPage.jsx";
import FreightsPage from "./screens/FreightsPage.jsx";
import ExpensesPage from "./screens/ExpensesPage.jsx";
import ReceivablesPage from "./screens/ReceivablesPage.jsx";
import PayablesPage from "./screens/PayablesPage.jsx";
import ReportsPage from "./screens/ReportsPage.jsx";
import CadastrosPage from "./screens/CadastrosPage.jsx";

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
const screenComponents = {
  dashboard: OverviewPage,
  freights: FreightsPage,
  expenses: ExpensesPage,
  receivables: ReceivablesPage,
  payments: PayablesPage,
  reports: ReportsPage,
  cadastros: CadastrosPage
};

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
      .update({ data: next, version: expectedVersion + 1 })
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
      {(() => { const Screen = screenComponents[activePage] || OverviewPage; return <Screen data={data} onRefresh={loadData} loading={loadingData} onSave={saveData} readOnly={readOnly} version={version} />; })()}
      <footer className="app-footer">Versão React em migração gradual · Dados compartilhados com controle de gravação.</footer>
    </div></main>
  </div>;
}
