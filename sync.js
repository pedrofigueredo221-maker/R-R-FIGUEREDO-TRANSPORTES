
/*
 * R&R Figueredo Transportes
 * Login, recuperação de senha e sincronização com Supabase.
 *
 * Depende de app.js definir:
 *   db, renderAll() e, se aplicável, ensureDefaults()
 *
 * O index.html deve conter:
 *   loginScreen, loginForm, loginUsername, loginPassword,
 *   loginError, loginSubmit, forgotPassword e logoutButton.
 */

const cloud = (() => {
  const cfg = window.APP_CONFIG || {};

  const KEYS = [
    "freights",
    "expenses",
    "receivables",
    "employees",
    "trucks",
    "categories"
  ];

  const OLD_KEY = "estrada_gestao_v1";
  const CACHE_KEY = "estrada_cache_v2";
  const MIG_KEY = "estrada_migrated_v2";

  const RESET_URL =
    "https://pedrofigueredo221-maker.github.io/RR-FIGUEREDO-TRANSPORTES/redefinir-senha.html";

  let sb;
  let version = 0;
  let base = {};
  let queue = Promise.resolve();
  let busy = false;
  let pending = false;
  let timer;
  let started = false;

  const clone = obj => JSON.parse(JSON.stringify(obj));
  const el = id => document.getElementById(id);

  function ensureStatus() {
    let s = el("syncStatus");

    if (!s) {
      s = document.createElement("span");
      s.id = "syncStatus";
      s.className = "sync-status";

      const actions = document.querySelector(".top-actions");
      (actions || document.body).prepend(s);
    }

    return s;
  }

  function status(message, cls = "") {
    const s = ensureStatus();
    s.textContent = message;
    s.className = "sync-status " + cls;
  }

  function normalize(data) {
    data = data || {};

    KEYS.forEach(key => {
      if (!Array.isArray(data[key])) data[key] = [];
    });

    if (!data.categories.length) {
      data.categories = [
        "Combustível",
        "Pedágio",
        "Óleo e lubrificantes",
        "Mecânico",
        "Oficina",
        "Pneus",
        "Elétrica",
        "Peças",
        "Documentação",
        "Seguro",
        "Lavagem",
        "Manutenção",
        "Despesas gerais",
        "Outros"
      ];
    }

    return data;
  }

  function getConfiguredEmail(username) {
    const key = String(username || "").trim().toUpperCase();
    const email = cfg.USER_EMAILS && cfg.USER_EMAILS[key];

    if (!email || email.includes("COLOQUE_AQUI")) {
      throw new Error(
        "O usuário não está vinculado a um e-mail no config.js."
      );
    }

    return email.trim();
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

    if (box) {
      box.textContent = message;
      box.hidden = !message;
    }
  }

  async function fetchRemote() {
    const { data, error } = await sb
      .from("app_state")
      .select("data,version")
      .eq("id", 1)
      .single();

    if (error) throw error;

    return {
      data: normalize(data.data),
      version: Number(data.version || 0)
    };
  }

  function merge3(b, local, remote) {
    const out = { ...remote };

    for (const key of KEYS) {
      if (key === "categories") {
        const bs = new Set(b[key] || []);
        const ls = new Set(local[key] || []);
        const rs = new Set(remote[key] || []);

        out[key] = [
          ...(remote[key] || []).filter(
            item => !bs.has(item) || ls.has(item)
          ),
          ...(local[key] || []).filter(
            item => !bs.has(item) && !rs.has(item)
          )
        ];

        continue;
      }

      const bm = new Map((b[key] || []).map(item => [item.id, item]));
      const lm = new Map((local[key] || []).map(item => [item.id, item]));

      const result = [];
      const seen = new Set();

      for (const item of remote[key] || []) {
        seen.add(item.id);

        const before = bm.get(item.id);
        const localItem = lm.get(item.id);

        if (before && !localItem) continue;

        result.push(
          localItem &&
          (!before || JSON.stringify(localItem) !== JSON.stringify(before))
            ? localItem
            : item
        );
      }

      for (const [id, localItem] of lm) {
        if (!seen.has(id) && !bm.has(id)) {
          result.push(localItem);
        }
      }

      out[key] = result;
    }

    out.defaultsV = remote.defaultsV || local.defaultsV;

    return out;
  }

  function writeCache() {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ db, base, version, pending })
      );
    } catch (error) {
      console.warn("Não foi possível gravar o cache local.", error);
    }
  }

  async function doPush() {
    if (!sb) return;

    const { data: authData, error: authError } = await sb.auth.getSession();

    if (authError) throw authError;
    if (!authData.session) return;

    busy = true;
    status("Salvando na nuvem…", "busy");

    try {
      for (let i = 0; i < 5; i++) {
        const snapshot = clone(db);

        const { data, error } = await sb
          .from("app_state")
          .update({
            data: snapshot,
            version: version + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", 1)
          .eq("version", version)
          .select("version");

        if (error) throw error;

        if (data && data.length) {
          version = data[0].version;
          base = clone(snapshot);
          pending = false;
          writeCache();
          status("✓ Sincronizado", "ok");
          return;
        }

        const remote = await fetchRemote();

        db = merge3(base, db, remote.data);
        version = remote.version;
        base = clone(remote.data);

        if (typeof renderAll === "function") renderAll();
      }

      throw new Error("Conflito de atualização. Tente salvar novamente.");
    } catch (error) {
      pending = true;
      writeCache();
      status("⚠ Falha ao sincronizar", "err");
      console.error("Erro ao salvar no Supabase:", error);
    } finally {
      busy = false;
    }
  }

  function push() {
    queue = queue.then(doPush, doPush);
    return queue;
  }

  function save() {
    pending = true;
    writeCache();

    if (sb) return push();
  }

  async function pull() {
    if (!sb || busy || document.hidden) return;

    try {
      const { data: authData, error: authError } =
        await sb.auth.getSession();

      if (authError) throw authError;
      if (!authData.session) return;

      if (pending) {
        await push();
        return;
      }

      const { data, error } = await sb
        .from("app_state")
        .select("version")
        .eq("id", 1)
        .single();

      if (error) throw error;

      if (Number(data.version || 0) > version) {
        const remote = await fetchRemote();

        db = remote.data;
        version = remote.version;
        base = clone(remote.data);

        writeCache();

        if (typeof renderAll === "function") renderAll();
      }

      status("✓ Sincronizado", "ok");
    } catch (error) {
      status("⚠ Sem conexão ou sem permissão", "err");
      console.error("Erro ao atualizar dados:", error);
    }
  }

  async function boot() {
    status("Carregando dados…", "busy");

    try {
      let cache = null;
      let old = null;

      try {
        cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      } catch {}

      try {
        old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
      } catch {}

      const remote = await fetchRemote();

      const hasOld =
        old && KEYS.some(key => Array.isArray(old[key]) && old[key].length);

      const migrated = localStorage.getItem(MIG_KEY);

      if (cache && cache.pending) {
        db = normalize(cache.db);
        base = normalize(cache.base);
        version = Number(cache.version || 0);
        pending = true;

        await push();
      } else if (
        !remote.data.defaultsV &&
        KEYS.every(key => !(remote.data[key] || []).length)
      ) {
        db = normalize(hasOld ? old : {});

        if (typeof ensureDefaults === "function") ensureDefaults();

        version = remote.version;
        base = clone(remote.data);
        pending = true;

        localStorage.setItem(MIG_KEY, "1");

        await push();
      } else {
        db = remote.data;
        version = remote.version;
        base = clone(remote.data);
        pending = false;

        if (hasOld && !migrated) {
          const ids = new Set();

          KEYS.forEach(key => {
            db[key].forEach(item => ids.add(item.id));
          });

          let additions = 0;

          for (const key of KEYS) {
            const names =
              key === "employees" || key === "trucks"
                ? new Set(
                    db[key].map(item =>
                      String(item.name || "").toLowerCase()
                    )
                  )
                : null;

            const extra = (old[key] || []).filter(
              item =>
                !ids.has(item.id) &&
                !(
                  names &&
                  names.has(String(item.name || "").toLowerCase())
                )
            );

            db[key] = db[key].concat(extra);
            additions += extra.length;
          }

          if (
            additions &&
            window.confirm(
              `Este aparelho tem ${additions} registro(s) antigos que não estão na nuvem. Mesclar com os dados compartilhados?`
            )
          ) {
            pending = true;
            await push();
          }

          localStorage.setItem(MIG_KEY, "1");
        }
      }

      writeCache();

      if (typeof renderAll === "function") {
        renderAll();
      } else {
        console.warn("A função renderAll() não foi encontrada no app.js.");
      }

      clearInterval(timer);
      timer = setInterval(pull, 15000);

      status("✓ Sincronizado", "ok");
    } catch (error) {
      status("⚠ Erro ao carregar dados", "err");

      console.error(
        "Falha ao iniciar sincronização. Confira tabela, políticas e colunas do Supabase.",
        error
      );
    }
  }

  async function signIn(username, password) {
    const email = getConfiguredEmail(username);

    const { error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        throw new Error("Usuário ou senha incorretos.");
      }

      throw error;
    }

    showLogin(false);
    loginMessage("");

    await boot();
  }

  /*
   * Recuperação de senha:
   * converte RAFAEL no e-mail configurado e solicita
   * ao Supabase o envio da mensagem de recuperação.
   */
  async function resetPassword(username) {
    const email = getConfiguredEmail(username);

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_URL
    });

    if (error) {
      console.error("Erro do Supabase ao recuperar senha:", error);

      throw new Error(
        "Não foi possível enviar o e-mail. Verifique o serviço de e-mail e as configurações do Supabase."
      );
    }
  }

  async function signOut() {
    clearInterval(timer);

    const { error } = await sb.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error);
    }

    showLogin(true);

    const form = el("loginForm");
    if (form) form.reset();

    loginMessage("");
    status("Sessão encerrada", "");
  }

  async function start() {
    if (started) return;
    started = true;

    ensureStatus();

    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_ANON_KEY ||
      !window.supabase
    ) {
      status("⚠ Configure o Supabase", "err");
      console.error(
        "Confira config.js e a biblioteca do Supabase antes de sync.js."
      );
      return;
    }

    sb = window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    showLogin(true);

    const form = el("loginForm");

    if (form) {
      form.addEventListener("submit", async event => {
        event.preventDefault();

        const button = el("loginSubmit");

        if (button) {
          button.disabled = true;
          button.textContent = "Entrando…";
        }

        loginMessage("");

        try {
          await signIn(
            el("loginUsername")?.value,
            el("loginPassword")?.value
          );
        } catch (error) {
          loginMessage(error.message || "Não foi possível entrar.");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Entrar";
          }
        }
      });
    }

    /*
     * O link no index.html precisa ter id="forgotPassword".
     */
    const forgotPassword = el("forgotPassword");

    if (forgotPassword) {
      forgotPassword.addEventListener("click", async event => {
        event.preventDefault();

        const username = el("loginUsername")?.value;

        if (!username || !username.trim()) {
          loginMessage("Digite RAFAEL no campo de usuário primeiro.");
          el("loginUsername")?.focus();
          return;
        }

        forgotPassword.setAttribute("aria-busy", "true");

        if ("disabled" in forgotPassword) {
          forgotPassword.disabled = true;
        }

        loginMessage("Solicitando recuperação de senha…");

        try {
          await resetPassword(username);

          loginMessage(
            "Se o Supabase aceitou a solicitação, confira o e-mail cadastrado e a pasta de spam."
          );
        } catch (error) {
          loginMessage(error.message || "Não foi possível solicitar a recuperação.");
        } finally {
          forgotPassword.removeAttribute("aria-busy");

          if ("disabled" in forgotPassword) {
            forgotPassword.disabled = false;
          }
        }
      });
    } else {
      console.warn(
        'O botão de recuperação não foi encontrado. Confira se o index.html contém id="forgotPassword".'
      );
    }

    const logout = el("logoutButton");

    if (logout) {
      logout.addEventListener("click", signOut);
    }

    try {
      const {
        data: { session },
        error
      } = await sb.auth.getSession();

      if (error) throw error;

      if (session) {
        showLogin(false);
        await boot();
      } else {
        showLogin(true);
        status("Faça login para continuar", "");
      }
    } catch (error) {
      status("⚠ Falha na autenticação", "err");
      console.error("Erro ao verificar a sessão:", error);
    }

    sb.auth.onAuthStateChange((event, session) => {
      if (!session) {
        clearInterval(timer);
        showLogin(true);
      }
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pull();
  });

  window.addEventListener("online", pull);

  return {
    start,
    save,
    pull
  };
})();
