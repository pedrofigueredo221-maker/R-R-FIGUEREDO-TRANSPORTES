// Sincronização na nuvem (Supabase). Todos os aparelhos logados enxergam os mesmos dados.
const cloud = (() => {
  const cfg = window.APP_CONFIG || {};
  const KEYS = ["freights", "expenses", "receivables", "employees", "trucks"];
  const OLD_KEY = "estrada_gestao_v1", CACHE_KEY = "estrada_cache_v2", MIG_KEY = "estrada_migrated_v2";
  let sb, version = 0, base = {}, queue = Promise.resolve(), busy = false, pending = false, timer;
  const clone = o => JSON.parse(JSON.stringify(o));
  const el = id => document.getElementById(id);

  /* ---------- interface ---------- */
  function ensureUI() {
    if (el("loginOverlay")) return;
    const o = document.createElement("div");
    o.id = "loginOverlay"; o.className = "login-overlay";
    o.innerHTML = `<form class="login-card" id="loginForm">
      <div class="brand-mark" style="margin:0 auto 14px">R&amp;R</div>
      <h2>Entrar</h2><p id="loginMsg">Acesso restrito à equipe.</p>
      <input type="email" id="loginEmail" placeholder="E-mail" autocomplete="username" required>
      <input type="password" id="loginPass" placeholder="Senha" autocomplete="current-password" required>
      <button class="btn btn-primary" type="submit" id="loginBtn">Entrar</button></form>`;
    document.body.appendChild(o);
    const s = document.createElement("span");
    s.id = "syncStatus"; s.className = "sync-status";
    const ta = document.querySelector(".top-actions");
    if (ta) ta.prepend(s);
    el("loginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const btn = el("loginBtn"); btn.disabled = true; btn.textContent = "Entrando…";
      const { error } = await sb.auth.signInWithPassword({ email: el("loginEmail").value.trim(), password: el("loginPass").value });
      btn.disabled = false; btn.textContent = "Entrar";
      if (error) { el("loginMsg").textContent = "E-mail ou senha incorretos."; el("loginMsg").className = "err"; return; }
      boot();
    });
    const lo = el("logoutBtn");
    if (lo) lo.addEventListener("click", async () => { if (!sb) return; await sb.auth.signOut(); localStorage.removeItem(CACHE_KEY); location.reload(); });
  }
  function showLogin(msg) { ensureUI(); el("loginOverlay").style.display = "flex"; if (msg) { el("loginMsg").textContent = msg; el("loginMsg").className = "err"; } }
  function hideLogin() { const o = el("loginOverlay"); if (o) o.style.display = "none"; }
  function status(text, cls) { const s = el("syncStatus"); if (s) { s.textContent = text; s.className = "sync-status " + (cls || ""); } }

  /* ---------- dados ---------- */
  function normalize(d) { d = d || {}; KEYS.forEach(k => d[k] = d[k] || []); return d; }
  async function fetchRemote() {
    const { data, error } = await sb.from("app_state").select("data,version").eq("id", 1).single();
    if (error) throw error;
    return { data: normalize(data.data), version: data.version };
  }
  // Mescla por id: o que mudou/criou/excluiu neste aparelho (vs. a última sincronização) é aplicado sobre o que veio da nuvem.
  function merge3(b, local, remote) {
    const out = { ...remote };
    for (const k of KEYS) {
      const bm = new Map((b[k] || []).map(x => [x.id, x])), lm = new Map((local[k] || []).map(x => [x.id, x]));
      const res = [], seen = new Set();
      for (const x of remote[k] || []) {
        seen.add(x.id);
        const bx = bm.get(x.id), lx = lm.get(x.id);
        if (bx && !lx) continue;
        res.push(lx && (!bx || JSON.stringify(lx) !== JSON.stringify(bx)) ? lx : x);
      }
      for (const [id, lx] of lm) if (!seen.has(id) && !bm.has(id)) res.push(lx);
      out[k] = res;
    }
    out.defaultsV = remote.defaultsV || local.defaultsV;
    return out;
  }
  function writeCache() { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ db, base, version, pending })); } catch {} }

  async function doPush() {
    busy = true; status("Salvando…", "busy");
    try {
      for (let i = 0; i < 5; i++) {
        const snap = clone(db);
        const { data, error } = await sb.from("app_state")
          .update({ data: snap, version: version + 1, updated_at: new Date().toISOString() })
          .eq("id", 1).eq("version", version).select("version");
        if (error) throw error;
        if (data && data.length) { version = data[0].version; base = snap; pending = false; writeCache(); status("✓ Sincronizado", "ok"); return; }
        const rem = await fetchRemote();               // alguém salvou antes: mescla e tenta de novo
        db = merge3(base, db, rem.data); version = rem.version; base = clone(rem.data); renderAll();
      }
      throw new Error("conflito");
    } catch (e) {
      pending = true; writeCache(); status("⚠ Sem conexão — será reenviado", "err");
    } finally { busy = false; }
  }
  function push() { queue = queue.then(doPush); return queue; }
  function save() { pending = true; writeCache(); if (sb) push(); }

  async function pull() {
    if (!sb || busy) return;
    if (pending) { push(); return; }
    try {
      const { data, error } = await sb.from("app_state").select("version").eq("id", 1).single();
      if (error) throw error;
      if (data.version > version) {
        const rem = await fetchRemote();
        db = rem.data; version = rem.version; base = clone(rem.data); writeCache(); renderAll();
      }
      status("✓ Sincronizado", "ok");
    } catch { status("⚠ Sem conexão", "err"); }
  }

  async function boot() {
    hideLogin(); status("Carregando…", "busy");
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      const rem = await fetchRemote();
      let old = null; try { old = JSON.parse(localStorage.getItem(OLD_KEY)); } catch {}
      const hasOld = old && ((old.freights || []).length || (old.expenses || []).length || (old.receivables || []).length);
      const migrated = localStorage.getItem(MIG_KEY);

      if (cache && cache.pending) {                    // havia alterações não enviadas neste aparelho
        db = normalize(cache.db); base = normalize(cache.base); version = cache.version; pending = true;
        await push();
      } else if (!rem.data.defaultsV) {                // nuvem vazia: primeira vez
        db = normalize({});
        if (hasOld && confirm(`Encontrei dados salvos neste aparelho (${(old.freights||[]).length} fretes, ${(old.expenses||[]).length} despesas, ${(old.receivables||[]).length} contas a receber).\n\nEnviar para a nuvem para que todos os aparelhos vejam os mesmos dados?`)) db = normalize(old);
        ensureDefaults(); version = rem.version; base = clone(rem.data); pending = true; localStorage.setItem(MIG_KEY, "1");
        await push();
      } else {                                         // nuvem já tem dados
        db = rem.data; version = rem.version; base = clone(rem.data); pending = false;
        if (hasOld && !migrated) {
          const rIds = new Set(); KEYS.forEach(k => db[k].forEach(x => rIds.add(x.id)));
          const rNames = k => new Set(db[k].map(x => String(x.name).toLowerCase()));
          const add = {}; let n = 0;
          for (const k of KEYS) {
            const names = (k === "employees" || k === "trucks") ? rNames(k) : null;
            add[k] = (old[k] || []).filter(x => !rIds.has(x.id) && !(names && names.has(String(x.name).toLowerCase())));
            n += add[k].length;
          }
          if (n && confirm(`Este aparelho tem ${n} registro(s) antigos que não estão na nuvem.\n\nMesclar com os dados da nuvem?`)) {
            KEYS.forEach(k => db[k] = db[k].concat(add[k])); pending = true; await push();
          }
          localStorage.setItem(MIG_KEY, "1");
        }
      }
      writeCache(); renderAll();
      clearInterval(timer); timer = setInterval(pull, 15000);
    } catch (e) { status("⚠ Erro ao carregar dados", "err"); console.error(e); }
  }

  async function start() {
  const cfg = window.APP_CONFIG || {};

  // Verifica se a configuração e a biblioteca estão disponíveis.
  if (
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY ||
    !window.supabase
  ) {
    console.error("Confira o config.js e a biblioteca do Supabase.");
    status("Erro na configuração do Supabase", "err");
    return;
  }

  try {
    sb = window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );

    // Inicia a sincronização sem exigir login.
    await boot();
  } catch (error) {
    console.error("Erro ao iniciar a sincronização:", error);
    status("Erro ao conectar com a nuvem", "err");
  }
}
