// Sincronização na nuvem (Supabase Auth), com login por nome de usuário.
// Depende do app.js existente definir `db`, `renderAll()` e, se aplicável, `ensureDefaults()`.
const cloud = (() => {
  const cfg = window.APP_CONFIG || {};
  const KEYS = ["freights", "expenses", "receivables", "employees", "trucks", "categories"];
  const OLD_KEY = "estrada_gestao_v1", CACHE_KEY = "estrada_cache_v2", MIG_KEY = "estrada_migrated_v2";
  let sb, version = 0, base = {}, queue = Promise.resolve(), busy = false, pending = false, timer;
  const clone = o => JSON.parse(JSON.stringify(o));
  const el = id => document.getElementById(id);

  function ensureStatus() {
    let s = el("syncStatus");
    if (!s) {
      s = document.createElement("span");
      s.id = "syncStatus";
      s.className = "sync-status";
      const ta = document.querySelector(".top-actions");
      (ta || document.body).prepend(s);
    }
    return s;
  }
  function status(message, cls) {
    const s = ensureStatus();
    s.textContent = message;
    s.className = "sync-status " + (cls || "");
  }
  function normalize(d) {
    d = d || {};
    KEYS.forEach(k => { if (!Array.isArray(d[k])) d[k] = []; });
    if (!d.categories.length) d.categories = ["Combustível","Pedágio","Óleo e lubrificantes","Mecânico","Oficina","Pneus","Elétrica","Peças","Documentação","Seguro","Lavagem","Manutenção","Despesas gerais","Outros"];
    return d;
  }
  async function fetchRemote() {
    const { data, error } = await sb.from("app_state")
      .select("data,version").eq("id", 1).single();
    if (error) throw error;
    return { data: normalize(data.data), version: Number(data.version || 0) };
  }
  function merge3(b, local, remote) {
    const out = { ...remote };
    for (const k of KEYS) {
      if (k === "categories") {
        const bs = new Set(b[k] || []), ls = new Set(local[k] || []), rs = new Set(remote[k] || []);
        out[k] = [...(remote[k] || []).filter(x => !bs.has(x) || ls.has(x)), ...(local[k] || []).filter(x => !bs.has(x) && !rs.has(x))];
        continue;
      }
      const bm = new Map((b[k] || []).map(x => [x.id, x]));
      const lm = new Map((local[k] || []).map(x => [x.id, x]));
      const res = [], seen = new Set();
      for (const x of remote[k] || []) {
        seen.add(x.id);
        const bx = bm.get(x.id), lx = lm.get(x.id);
        if (bx && !lx) continue; // exclusão local em relação à base
        res.push(lx && (!bx || JSON.stringify(lx) !== JSON.stringify(bx)) ? lx : x);
      }
      for (const [id, lx] of lm) if (!seen.has(id) && !bm.has(id)) res.push(lx);
      out[k] = res;
    }
    out.defaultsV = remote.defaultsV || local.defaultsV;
    return out;
  }
  function writeCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ db, base, version, pending })); }
    catch (e) { console.warn("Não foi possível gravar o cache local.", e); }
  }
  async function doPush() {
    if (!sb) return;
    const { data: authData } = await sb.auth.getSession();
    if (!authData.session) return;
    busy = true; status("Salvando na nuvem…", "busy");
    try {
      for (let i = 0; i < 5; i++) {
        const snap = clone(db);
        const { data, error } = await sb.from("app_state")
          .update({ data: snap, version: version + 1, updated_at: new Date().toISOString() })
          .eq("id", 1).eq("version", version).select("version");
        if (error) throw error;
        if (data && data.length) {
          version = data[0].version; base = clone(snap); pending = false;
          writeCache(); status("✓ Sincronizado", "ok"); return;
        }
        const rem = await fetchRemote();
        db = merge3(base, db, rem.data); version = rem.version; base = clone(rem.data);
        if (typeof renderAll === "function") renderAll();
      }
      throw new Error("Conflito de atualização: tente salvar novamente.");
    } catch (e) {
      pending = true; writeCache(); status("⚠ Falha ao sincronizar", "err");
      console.error("Erro ao salvar no Supabase:", e);
    } finally { busy = false; }
  }
  function push() {
    queue = queue.then(doPush, doPush);
    return queue;
  }
  function save() {
    pending = true; writeCache();
    if (sb) return push();
  }
  async function pull() {
    if (!sb || busy) return;
    const { data: authData } = await sb.auth.getSession();
    if (!authData.session) return;
    if (pending) { await push(); return; }
    try {
      const { data, error } = await sb.from("app_state").select("version").eq("id", 1).single();
      if (error) throw error;
      if (Number(data.version || 0) > version) {
        const rem = await fetchRemote();
        db = rem.data; version = rem.version; base = clone(rem.data);
        writeCache();
        if (typeof renderAll === "function") renderAll();
      }
      status("✓ Sincronizado", "ok");
    } catch (e) { status("⚠ Sem conexão ou sem permissão", "err"); console.error(e); }
  }
  async function boot() {
    status("Carregando dados…", "busy");
    try {
      let cache = null, old = null;
      try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch {}
      try { old = JSON.parse(localStorage.getItem(OLD_KEY) || "null"); } catch {}
      const rem = await fetchRemote();
      const hasOld = old && KEYS.some(k => Array.isArray(old[k]) && old[k].length);
      const migrated = localStorage.getItem(MIG_KEY);

      if (cache && cache.pending) {
        db = normalize(cache.db); base = normalize(cache.base); version = Number(cache.version || 0); pending = true;
        await push();
      } else if (!rem.data.defaultsV && KEYS.every(k => !(rem.data[k] || []).length)) {
        db = normalize(hasOld ? old : {});
        if (typeof ensureDefaults === "function") ensureDefaults();
        version = rem.version; base = clone(rem.data); pending = true;
        localStorage.setItem(MIG_KEY, "1");
        await push();
      } else {
        db = rem.data; version = rem.version; base = clone(rem.data); pending = false;
        if (hasOld && !migrated) {
          const ids = new Set(); KEYS.forEach(k => db[k].forEach(x => ids.add(x.id)));
          let additions = 0;
          for (const k of KEYS) {
            const names = (k === "employees" || k === "trucks")
              ? new Set(db[k].map(x => String(x.name || "").toLowerCase())) : null;
            const extra = (old[k] || []).filter(x => !ids.has(x.id) && !(names && names.has(String(x.name || "").toLowerCase())));
            db[k] = db[k].concat(extra); additions += extra.length;
          }
          if (additions && window.confirm(`Este aparelho tem ${additions} registro(s) antigos que não estão na nuvem. Mesclar com os dados compartilhados?`)) {
            pending = true; await push();
          }
          localStorage.setItem(MIG_KEY, "1");
        }
      }
      writeCache();
      if (typeof renderAll === "function") renderAll();
      else console.warn("A função renderAll() não foi encontrada no app.js.");
      clearInterval(timer); timer = setInterval(pull, 15000);
      status("✓ Sincronizado", "ok");
    } catch (e) {
      status("⚠ Erro ao carregar dados", "err");
      console.error("Falha ao iniciar sincronização. Confira tabela, políticas e colunas do Supabase.", e);
    }
  }
  function showLogin(show) {
    const screen = el("loginScreen");
    if (screen) screen.hidden = !show;
    document.body.classList.toggle("authenticated", !show);
    const logout = el("logoutButton");
    if (logout) logout.hidden = show;
  }
  function loginMessage(message) {
    const box = el("loginError");
    if (box) { box.textContent = message; box.hidden = !message; }
  }
  async function signIn(username, password) {
    const key = String(username || "").trim().toUpperCase();
    const email = cfg.USER_EMAILS && cfg.USER_EMAILS[key];
    if (!email || email.includes("COLOQUE_AQUI")) {
      throw new Error("O usuário ainda não está vinculado. Configure o e-mail de RAFAEL no arquivo config.js.");
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showLogin(false);
    loginMessage("");
    await boot();
  }
  async function signOut() {
    clearInterval(timer);
    const { error } = await sb.auth.signOut();
    if (error) console.error("Erro ao sair:", error);
    showLogin(true);
    const form = el("loginForm");
    if (form) form.reset();
    status("Sessão encerrada", "");
  }
  async function start() {
    ensureStatus();
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !window.supabase) {
      status("⚠ Configure o Supabase", "err");
      console.error("Configure config.js e carregue a biblioteca do Supabase antes de sync.js.");
      return;
    }
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    showLogin(true);
    const form = el("loginForm");
    if (form) form.addEventListener("submit", async event => {
      event.preventDefault();
      const button = el("loginSubmit");
      if (button) { button.disabled = true; button.textContent = "Entrando…"; }
      loginMessage("");
      try { await signIn(el("loginUsername").value, el("loginPassword").value); }
      catch (e) { loginMessage(e.message === "Invalid login credentials" ? "Usuário ou senha incorretos." : (e.message || "Não foi possível entrar.")); }
      finally { if (button) { button.disabled = false; button.textContent = "Entrar"; } }
    });
    const logout = el("logoutButton");
    if (logout) logout.addEventListener("click", signOut);
    try {
      const { data: { session }, error } = await sb.auth.getSession();
      if (error) throw error;
      if (session) { showLogin(false); await boot(); }
      else { status("Faça login para continuar", ""); }
    } catch (e) { status("⚠ Falha na autenticação", "err"); console.error(e); }
    sb.auth.onAuthStateChange((_event, session) => {
      if (!session) { clearInterval(timer); showLogin(true); }
    });
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pull(); });
  window.addEventListener("online", pull);
  return { start, save, pull };
})();
