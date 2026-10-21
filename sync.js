
/*
 * R&R FIGUEREDO TRANSPORTES
 * Login, recuperação de senha e sincronização com Supabase.
 *
 * Dependências:
 * - app.js define db, renderAll() e, opcionalmente, ensureDefaults().
 * - config.js define SUPABASE_URL, SUPABASE_ANON_KEY e USER_EMAILS.
 * - index.html contém os elementos de login indicados abaixo.
 *
 * Os dados são compartilhados por todos os usuários autenticados
 * autorizados pelas políticas RLS do Supabase.
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

  const RECORD_KEYS = [
    "freights",
    "expenses",
    "receivables",
    "employees",
    "trucks"
  ];

  const OLD_KEY = "estrada_gestao_v1";
  const CACHE_KEY = "estrada_cache_v2";
  const MIG_KEY = "estrada_migrated_v2";

  const RESET_URL =
    "https://pedrofigueredo221-maker.github.io/RR-FIGUEREDO-TRANSPORTES/redefinir-senha.html";

  const DEFAULT_CATEGORIES = [
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

  let sb = null;
  let version = 0;
  let base = {};
  let queue = Promise.resolve();
  let busy = false;
  let pending = false;
  let timer = null;
  let started = false;
  let currentUserEmail = "";
  let readOnly = false;

  function applyUserRole(user) {
    currentUserEmail = String(user?.email || "").trim().toLowerCase();
    const visitorEmail = String(cfg.USER_EMAILS?.VISITANTE || "").trim().toLowerCase();
    readOnly = !!visitorEmail && currentUserEmail === visitorEmail;
    if (typeof window.setReadOnlyMode === "function") window.setReadOnlyMode(readOnly);
    return readOnly;
  }

  const clone = value =>
    JSON.parse(JSON.stringify(value));

  const el = id =>
    document.getElementById(id);

  function same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function ensureStatus() {
    let element = el("syncStatus");

    if (!element) {
      element = document.createElement("span");
      element.id = "syncStatus";
      element.className = "sync-status";

      const actions = document.querySelector(".top-actions");
      (actions || document.body).prepend(element);
    }

    return element;
  }

  function status(message, cls = "") {
    const element = ensureStatus();
    element.textContent = message;
    element.className = "sync-status " + cls;
    element.setAttribute("role", "status");
  }

  function normalize(value) {
    const data =
      value && typeof value === "object" && !Array.isArray(value)
        ? clone(value)
        : {};

    for (const key of KEYS) {
      if (!Array.isArray(data[key])) {
        data[key] = [];
      }
    }

    if (data.categories.length === 0) {
      data.categories = [...DEFAULT_CATEGORIES];
    }

    return data;
  }

  function getConfiguredEmail(username) {
    const key = String(username || "")
      .trim()
      .toUpperCase();

    const email =
      cfg.USER_EMAILS && cfg.USER_EMAILS[key];

    if (
      typeof email !== "string" ||
      !email.trim() ||
      email.includes("COLOQUE_AQUI")
    ) {
      throw new Error(
        "Este usuário não está vinculado a um e-mail no config.js."
      );
    }

    return email.trim();
  }

  function showLogin(show, remember = true) {
    const screen = el("loginScreen");

    if (screen) screen.hidden = !show;

    document.body.classList.toggle("authenticated", !show);

    // Guarda a tela apresentada nesta aba para restaurá-la após atualizar.
    if (remember) {
      try {
        sessionStorage.setItem("rr_screen_state", show ? "login" : "authenticated");
      } catch (_) {}
    }

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

  function describeError(error) {
    const code = error && error.code;

    if (code === "PGRST116") {
      return (
        "O Supabase não encontrou o registro id=1. " +
        "Confira public.app_state e as políticas RLS."
      );
    }

    if (code === "42501" || code === "PGRST301") {
      return (
        "Acesso negado pelo Supabase. Confira o login, " +
        "os privilégios e as políticas RLS."
      );
    }

    if (error && error.message) {
      return error.message;
    }

    return "Ocorreu um erro desconhecido.";
  }

  /*
   * Lê o único registro compartilhado.
   * Se estiver ausente, tenta criá-lo sem sobrescrever um registro
   * existente. A política INSERT do Supabase precisa permitir id=1.
   */
  async function fetchRemote() {
    let { data, error } = await sb
      .from("app_state")
      .select("data,version")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const initialData = normalize({
        freights: [],
        expenses: [],
        receivables: [],
        employees: [],
        trucks: [],
        categories: [...DEFAULT_CATEGORIES]
      });

      // ignoreDuplicates gera ON CONFLICT DO NOTHING: nunca substitui
      // dados já existentes no registro id=1.
      const { error: insertError } = await sb
        .from("app_state")
        .upsert(
          { id: 1, data: initialData, version: 0 },
          { onConflict: "id", ignoreDuplicates: true }
        );

      if (insertError) {
        throw new Error(
          "O registro id=1 não está visível e não foi possível criá-lo. " +
          "Confira se o SQL do Supabase criou a política INSERT para usuários autenticados. " +
          "Detalhe: " + insertError.message
        );
      }

      // Lê novamente: pode ter sido criado agora ou já existir, mas estar
      // oculto por uma política RLS.
      const retry = await sb
        .from("app_state")
        .select("data,version")
        .eq("id", 1)
        .maybeSingle();

      data = retry.data;
      error = retry.error;

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Não foi possível ler public.app_state com id=1 após a tentativa de inicialização. " +
          "Confira os privilégios GRANT e as políticas RLS de SELECT/INSERT no Supabase."
        );
      }
    }

    return {
      data: normalize(data.data),
      version: Number(data.version || 0)
    };
  }

  /*
   * Mescla alterações locais com as remotas usando a versão
   * base como referência.
   *
   * Não substitui automaticamente todos os dados remotos
   * por listas vazias de um computador novo.
   */
  function merge3(originalBase, localValue, remoteValue) {
    const b = normalize(originalBase);
    const local = normalize(localValue);
    const remote = normalize(remoteValue);
    const out = { ...remote };

    for (const key of KEYS) {
      if (key === "categories") {
        const result = [...remote[key]];

        for (const item of local[key]) {
          if (!result.includes(item)) {
            result.push(item);
          }
        }

        out[key] = result;
        continue;
      }

      const baseMap = new Map(
        b[key].filter(item => item && item.id != null)
          .map(item => [String(item.id), item])
      );

      const localMap = new Map(
        local[key].filter(item => item && item.id != null)
          .map(item => [String(item.id), item])
      );

      const remoteMap = new Map(
        remote[key].filter(item => item && item.id != null)
          .map(item => [String(item.id), item])
      );

      const result = [];
      const seen = new Set();

      // Mantém os registros remotos e aplica alterações locais
      // quando o registro local mudou em relação à base.
      for (const remoteItem of remote[key]) {
        if (!remoteItem || remoteItem.id == null) {
          result.push(remoteItem);
          continue;
        }

        const id = String(remoteItem.id);
        seen.add(id);

        const before = baseMap.get(id);
        const localItem = localMap.get(id);

        // Exclusão local: só a considera se o registro existia
        // na base usada por este dispositivo.
        if (before && !localItem) {
          continue;
        }

        if (
          localItem &&
          (!before || !same(localItem, before))
        ) {
          result.push(localItem);
        } else {
          result.push(remoteItem);
        }
      }

      // Adiciona registros locais que ainda não estão na nuvem.
      for (const localItem of local[key]) {
        if (!localItem || localItem.id == null) {
          if (!result.includes(localItem)) {
            result.push(localItem);
          }
          continue;
        }

        const id = String(localItem.id);

        if (!seen.has(id) && !baseMap.has(id)) {
          result.push(localItem);
          seen.add(id);
        }
      }

      out[key] = result;
    }

    out.defaultsV = remote.defaultsV || local.defaultsV;

    return normalize(out);
  }

  function writeCache() {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          db: normalize(db),
          base: normalize(base),
          version,
          pending
        })
      );
    } catch (error) {
      console.warn(
        "Não foi possível salvar o cache local.",
        error
      );
    }
  }

  /*
   * Atualização otimista: só grava se a versão remota ainda
   * for a versão que este dispositivo leu.
   */
  async function doPush() {
    if (!sb || readOnly) {
      if (readOnly) { pending = false; status("Modo visitante — somente leitura", ""); }
      return;
    }

    const {
      data: authData,
      error: authError
    } = await sb.auth.getSession();

    if (authError) throw authError;

    if (!authData.session) {
      status("Faça login para sincronizar.", "err");
      return;
    }

    if (busy) return;

    busy = true;
    status("Salvando na nuvem…", "busy");

    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const snapshot = normalize(db);

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

        if (data && data.length > 0) {
          version = Number(data[0].version);
          db = snapshot;
          base = clone(snapshot);
          pending = false;
          writeCache();
          status("✓ Sincronizado", "ok");
          return;
        }

        // Nenhuma linha atualizada: versão diferente ou registro
        // não visível. Lê novamente antes de tentar outra vez.
        const remote = await fetchRemote();

        const merged = merge3(base, db, remote.data);

        version = remote.version;
        base = clone(remote.data);
        db = merged;

        if (typeof renderAll === "function") {
          renderAll();
        }

        if (same(db, remote.data)) {
          pending = false;
          writeCache();
          status("✓ Sincronizado", "ok");
          return;
        }
      }

      throw new Error(
        "Não foi possível concluir a sincronização após várias tentativas. " +
        "Pode haver alterações simultâneas em outro dispositivo."
      );
    } catch (error) {
      pending = true;
      writeCache();
      status("⚠ Falha ao sincronizar", "err");

      console.error(
        "Erro ao salvar no Supabase:",
        error,
        describeError(error)
      );
    } finally {
      busy = false;
    }
  }

  function push() {
    queue = queue.then(doPush, doPush);
    return queue;
  }

  /*
   * Deve ser chamado pelo app.js após um cadastro,
   * alteração ou exclusão.
   */
  function save() {
    if (readOnly) {
      status("Modo visitante — alterações bloqueadas", "err");
      return Promise.resolve();
    }
    pending = true;
    writeCache();

    if (sb) return push();

    status("⚠ Dados salvos apenas localmente", "err");
  }

  async function pull() {
    if (!sb || busy || document.hidden) return;

    try {
      const {
        data: authData,
        error: authError
      } = await sb.auth.getSession();

      if (authError) throw authError;
      if (!authData.session) return;

      // O visitante nunca envia alterações locais ao banco.
      if (readOnly) pending = false;
      // Envia primeiro as alterações locais pendentes.
      if (pending) {
        await push();
        return;
      }

      const remote = await fetchRemote();

      if (remote.version > version) {
        db = remote.data;
        version = remote.version;
        base = clone(remote.data);
        pending = false;

        writeCache();

        if (typeof renderAll === "function") {
          renderAll();
        }
      }

      status("✓ Sincronizado", "ok");
    } catch (error) {
      status("⚠ Erro ao atualizar dados", "err");

      console.error(
        "Erro ao atualizar dados:",
        error,
        describeError(error)
      );
    }
  }

  function readLocalJSON(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn("Não foi possível ler " + key, error);
      return null;
    }
  }

  function hasRecords(data) {
    if (!data) return false;

    return RECORD_KEYS.some(key =>
      Array.isArray(data[key]) && data[key].length > 0
    );
  }

  /*
   * Conta registros locais que não existem na nuvem.
   * Serve apenas para apresentar uma confirmação de migração.
   */
  function countLocalAdditions(local, remote) {
    let total = 0;

    for (const key of RECORD_KEYS) {
      const remoteIds = new Set(
        remote[key]
          .filter(item => item && item.id != null)
          .map(item => String(item.id))
      );

      for (const item of local[key]) {
        if (!item || item.id == null) {
          total++;
        } else if (!remoteIds.has(String(item.id))) {
          total++;
        }
      }
    }

    return total;
  }

  async function boot() {
    status("Carregando dados da nuvem…", "busy");

    try {
      const cache = readLocalJSON(CACHE_KEY);
      const old = readLocalJSON(OLD_KEY);
      const migrated = localStorage.getItem(MIG_KEY) === "1";

      // A nuvem é a referência principal.
      const remote = await fetchRemote();

      version = remote.version;
      base = clone(remote.data);
      db = clone(remote.data);
      pending = false;

      /*
       * Se havia alterações pendentes neste dispositivo,
       * tenta mesclá-las com a nuvem em vez de sobrescrever
       * diretamente os dados remotos.
       */
      if (!readOnly && cache && cache.pending && cache.db) {
        const localCache = normalize(cache.db);
        const oldBase = normalize(cache.base || {});

        db = merge3(oldBase, localCache, remote.data);

        pending = !same(db, remote.data);

        if (pending) {
          writeCache();
          await push();
        }
      }

      /*
       * Migração do formato antigo: só pergunta quando existem
       * registros antigos ainda não migrados.
       */
      else if (!readOnly && hasRecords(old) && !migrated) {
        const oldData = normalize(old);
        const additions = countLocalAdditions(oldData, remote.data);

        if (additions > 0) {
          const approved = window.confirm(
            "Este navegador contém registros antigos que podem não " +
            "estar na nuvem. Foram encontrados aproximadamente " +
            additions +
            " registro(s) que podem ser adicionados. " +
            "Deseja mesclar os dados antigos com os compartilhados? " +
            "Não confirme se não reconhecer esses dados."
          );

          if (approved) {
            db = merge3({}, oldData, remote.data);
            pending = !same(db, remote.data);

            if (pending) {
              writeCache();
              await push();
            }
          }
        }

        // Só marca como migrado após a decisão do usuário.
        localStorage.setItem(MIG_KEY, "1");
      }

      // Cadastros iniciais: só cria exemplos se as listas estiverem vazias.
      // Não substitui nem modifica cadastros reais já existentes na nuvem.
      let addedStarterRecords = false;

      if (!readOnly && Array.isArray(db.employees) && db.employees.length === 0) {
        db.employees = Array.from({ length: 5 }, (_, index) => ({
          id: "starter-driver-" + (index + 1),
          name: "Motorista " + String(index + 1).padStart(2, "0"),
          role: "Motorista",
          phone: "",
          commissionType: "percent",
          commissionValue: 10,
          active: true
        }));
        addedStarterRecords = true;
      }

      if (!readOnly && Array.isArray(db.trucks) && db.trucks.length === 0) {
        db.trucks = Array.from({ length: 5 }, (_, index) => ({
          id: "starter-truck-" + (index + 1),
          name: "Caminhão " + String(index + 1).padStart(2, "0"),
          plate: "",
          active: true
        }));
        addedStarterRecords = true;
      }

      // Persiste os cadastros iniciais na nuvem quando foram criados.
      if (addedStarterRecords) {
        pending = !same(db, remote.data);
        writeCache();
        if (pending) await push();
      }

      if (!readOnly && typeof ensureDefaults === "function") {
        ensureDefaults();
      }

      writeCache();

      if (typeof renderAll === "function") {
        renderAll();
      } else {
        console.warn(
          "A função renderAll() não foi encontrada no app.js."
        );
      }

      clearInterval(timer);
      timer = setInterval(pull, 15000);

      status(
        pending
          ? "⚠ Há alterações aguardando sincronização"
          : "✓ Dados carregados",
        pending ? "err" : "ok"
      );
    } catch (error) {
      status("⚠ Erro ao carregar dados", "err");

      console.error(
        "Falha ao iniciar sincronização:",
        error,
        describeError(error)
      );
      // Impede que uma falha de leitura seja tratada como login concluído.
      throw error;
    }
  }

  async function signIn(username, password) {
    const email = getConfiguredEmail(username);

    const { data: authResult, error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        throw new Error("Usuário ou senha incorretos.");
      }

      throw error;
    }

    applyUserRole(authResult?.user || { email });
    loginMessage("");
    // Só libera o painel depois de carregar os dados remotos com sucesso.
    await boot();
    showLogin(false);
  }

  async function resetPassword(username) {
    const email = getConfiguredEmail(username);

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_URL
    });

    if (error) {
      console.error(
        "Erro do Supabase ao recuperar senha:",
        error
      );

      throw new Error(
        "Não foi possível solicitar a recuperação. " +
        "Verifique as configurações de e-mail do Supabase."
      );
    }
  }

  async function signOut() {
    clearInterval(timer);
    timer = null;

    const { error } = await sb.auth.signOut();

    if (error) {
      console.error("Erro ao encerrar sessão:", error);
    }

    // Lê o estado anterior antes de exibir qualquer tela temporária.
    // sessionStorage persiste ao atualizar, mas é isolado por aba.
    let lastScreen = null;
    try {
      lastScreen = sessionStorage.getItem("rr_screen_state");
    } catch (_) {}

    showLogin(true, false);

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
        "Confira config.js e se a biblioteca Supabase foi carregada antes de sync.js."
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
          loginMessage(
            describeError(error) || "Não foi possível entrar."
          );
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Entrar";
          }
        }
      });
    } else {
      console.error('Elemento "loginForm" não encontrado no index.html.');
    }

    const forgotPassword = el("forgotPassword");

    if (forgotPassword) {
      forgotPassword.addEventListener("click", async event => {
        event.preventDefault();

        const username = el("loginUsername")?.value;

        if (!username || !username.trim()) {
          loginMessage(
            "Digite seu nome de usuário antes de recuperar a senha."
          );

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
            "Solicitação enviada, se aceita pelo Supabase. " +
            "Confira seu e-mail e a pasta de spam."
          );
        } catch (error) {
          loginMessage(describeError(error));
        } finally {
          forgotPassword.removeAttribute("aria-busy");

          if ("disabled" in forgotPassword) {
            forgotPassword.disabled = false;
          }
        }
      });
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

      applyUserRole(session?.user || null);
      if (session && lastScreen === "authenticated") {
        // Só restaura o painel se ele já estava aberto antes da atualização.
        await boot();
        showLogin(false);
      } else {
        // Se a última tela era o login (ou ainda não existe estado salvo),
        // não abre o painel automaticamente só porque há uma sessão salva.
        showLogin(true);
        status("Faça login para continuar", "");
      }
    } catch (error) {
      showLogin(true);
      status("⚠ Falha na autenticação ou no carregamento", "err");

      console.error(
        "Erro ao verificar a sessão:",
        error,
        describeError(error)
      );
    }

    sb.auth.onAuthStateChange((event, session) => {
      if (!session) {
        applyUserRole(null);
        clearInterval(timer);
        timer = null;
        showLogin(true);
      }
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pull();
  });

  window.addEventListener("online", () => {
    pull();
  });

  return {
    start,
    save,
    pull,
    get isReadOnly() { return readOnly; },
    get currentUserEmail() { return currentUserEmail; }
  };
})();
