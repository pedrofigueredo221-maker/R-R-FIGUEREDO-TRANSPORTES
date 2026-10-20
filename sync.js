
/* =========================================================
   R&R FIGUEREDO TRANSPORTES
   Sincronização na nuvem com Supabase, sem tela de login.
   ========================================================= */

const cloud = (() => {
  const KEYS = [
    "freights",
    "expenses",
    "receivables",
    "employees",
    "trucks"
  ];

  const OLD_KEY = "estrada_gestao_v1";
  const CACHE_KEY = "estrada_cache_v2";
  const MIG_KEY = "estrada_migrated_v2";

  let sb = null;
  let db = {};
  let version = 0;
  let base = {};
  let queue = Promise.resolve();
  let busy = false;
  let pending = false;
  let timer = null;
  let started = false;

  const clone = value => JSON.parse(JSON.stringify(value));

  const el = id => document.getElementById(id);

  function status(message, cls = "") {
    let element = el("syncStatus");

    if (!element) {
      const container = document.querySelector(".top-actions");

      if (container) {
        element = document.createElement("span");
        element.id = "syncStatus";
        element.className = "sync-status";
        container.prepend(element);
      }
    }

    if (element) {
      element.textContent = message;
      element.className = "sync-status " + cls;
    }
  }

  function normalize(data) {
    data = data && typeof data === "object" ? data : {};

    for (const key of KEYS) {
      if (!Array.isArray(data[key])) {
        data[key] = [];
      }
    }

    return data;
  }

  function writeCache() {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          db,
          base,
          version,
          pending
        })
      );
    } catch (error) {
      console.warn("Não foi possível salvar o cache local:", error);
    }
  }

  function render() {
    if (typeof window.renderAll === "function") {
      window.renderAll();
    } else if (typeof renderAll === "function") {
      renderAll();
    } else {
      console.warn(
        "renderAll() não foi encontrada. Confira a integração com app.js."
      );
    }
  }

  function ensureDefaults() {
    if (typeof window.ensureDefaults === "function") {
      window.ensureDefaults();
    } else if (typeof ensureDefaults === "function") {
      ensureDefaults();
    }
  }

  async function fetchRemote() {
    const { data, error } = await sb
      .from("app_state")
      .select("data, version")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    // A tabela ainda não possui o registro compartilhado.
    if (!data) {
      return {
        data: normalize({}),
        version: 0,
        exists: false
      };
    }

    return {
      data: normalize(data.data),
      version: Number(data.version) || 0,
      exists: true
    };
  }

  /*
   * Mescla as alterações locais com as remotas.
   * Registros precisam ter um id único e estável.
   */
  function merge3(previous, local, remote) {
    const result = { ...remote };

    for (const key of KEYS) {
      const oldMap = new Map(
        (previous[key] || []).map(item => [item.id, item])
      );

      const localMap = new Map(
        (local[key] || []).map(item => [item.id, item])
      );

      const output = [];
      const seen = new Set();

      for (const remoteItem of remote[key] || []) {
        const id = remoteItem.id;
        seen.add(id);

        const oldItem = oldMap.get(id);
        const localItem = localMap.get(id);

        // Foi excluído localmente desde a última sincronização.
        if (oldItem && !localItem) continue;

        // Foi criado ou alterado localmente.
        if (
          localItem &&
          (!oldItem ||
            JSON.stringify(localItem) !== JSON.stringify(oldItem))
        ) {
          output.push(localItem);
        } else {
          output.push(remoteItem);
        }
      }

      // Registros novos que ainda não existem na nuvem.
      for (const [id, localItem] of localMap) {
        if (!seen.has(id) && !oldMap.has(id)) {
          output.push(localItem);
        }
      }

      result[key] = output;
    }

    result.defaultsV = remote.defaultsV || local.defaultsV;

    return result;
  }

  async function doPush() {
    if (!sb) return;

    busy = true;
    status("Salvando na nuvem…", "busy");

    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const snapshot = clone(db);

        /*
         * Atualização otimista: só grava se a versão
         * remota continuar igual à versão conhecida.
         */
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
          base = clone(snapshot);
          pending = false;
          writeCache();
          status("✓ Dados sincronizados", "ok");
          return;
        }

        // O registro pode ainda não existir na primeira execução.
        const remote = await fetchRemote();

        if (!remote.exists) {
          const { error: insertError } = await sb
            .from("app_state")
            .insert({
              id: 1,
              data: snapshot,
              version: 1,
              updated_at: new Date().toISOString()
            });

          if (!insertError) {
            version = 1;
            base = clone(snapshot);
            pending = false;
            writeCache();
            status("✓ Dados sincronizados", "ok");
            return;
          }
        }

        // Outro aparelho pode ter gravado primeiro.
        const latest = await fetchRemote();

        if (!latest.exists) {
          throw new Error("O registro compartilhado não foi criado.");
        }

        db = merge3(base, db, latest.data);
        version = latest.version;
        base = clone(latest.data);
        writeCache();
        render();
      }

      throw new Error("Muitas alterações simultâneas. Tente novamente.");
    } catch (error) {
      pending = true;
      writeCache();

      console.error("Falha ao sincronizar:", error);

      status("⚠ Falha ao salvar — confira a conexão", "err");
    } finally {
      busy = false;
    }
  }

  function push() {
    queue = queue
      .catch(() => {})
      .then(() => doPush());

    return queue;
  }

  /*
   * Chame cloud.save() depois de alterações nos dados.
   */
  function save() {
    pending = true;
    writeCache();

    if (sb) {
      return push();
    }
  }

  async function pull() {
    if (!sb || busy) return;

    if (pending) {
      await push();
      return;
    }

    try {
      const remote = await fetchRemote();

      if (!remote.exists) return;

      if (remote.version > version) {
        db = remote.data;
        version = remote.version;
        base = clone(remote.data);

        writeCache();
        render();
      }

      status("✓ Dados sincronizados", "ok");
    } catch (error) {
      console.error("Erro ao consultar a nuvem:", error);
      status("⚠ Nuvem indisponível", "err");
    }
  }

  async function boot() {
    status("Carregando dados…", "busy");

    try {
      let cache = null;

      try {
        cache = JSON.parse(
          localStorage.getItem(CACHE_KEY) || "null"
        );
      } catch {
        cache = null;
      }

      let old = null;

      try {
        old = JSON.parse(
          localStorage.getItem(OLD_KEY) || "null"
        );
      } catch {
        old = null;
      }

      const remote = await fetchRemote();

      // Recupera alterações que não chegaram à nuvem.
      if (cache && cache.pending && cache.db) {
        db = normalize(cache.db);
        base = normalize(cache.base || {});
        version = Number(cache.version) || 0;
        pending = true;

        // Não sobrescreve dados remotos cegamente.
        if (remote.exists) {
          db = merge3(base, db, remote.data);
          version = remote.version;
          base = clone(remote.data);
        }

        writeCache();
        await push();
      } else if (
        remote.exists &&
        remote.data.defaultsV
      ) {
        // A nuvem já possui os dados oficiais.
        db = remote.data;
        version = remote.version;
        base = clone(remote.data);
        pending = false;
      } else {
        // Primeira inicialização da nuvem.
        db = normalize({});

        const hasOld = old && KEYS.some(
          key => Array.isArray(old[key]) && old[key].length > 0
        );

        if (hasOld) {
          const migrate = confirm(
            "Foram encontrados dados antigos neste aparelho.\n\n" +
            "Deseja enviá-los para a nuvem compartilhada?"
          );

          if (migrate) {
            db = normalize(old);
          }
        }

        ensureDefaults();

        /*
         * Mantém defaultsV para indicar que a inicialização
         * já ocorreu, se o app não definir esse campo.
         */
        if (!db.defaultsV) {
          db.defaultsV = 1;
        }

        version = remote.version;
        base = clone(remote.data);
        pending = true;

        writeCache();
        await push();

        try {
          localStorage.setItem(MIG_KEY, "1");
        } catch {}
      }

      writeCache();
      render();

      if (timer) clearInterval(timer);

      timer = setInterval(pull, 15000);

      status("✓ Dados carregados", "ok");
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
      status("⚠ Erro ao carregar dados", "err");
    }
  }

  async function start() {
    if (started) return;
    started = true;

    const cfg = window.APP_CONFIG || {};

    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_ANON_KEY ||
      !window.supabase
    ) {
      started = false;
      status("Erro na configuração do Supabase", "err");
      console.error(
        "Confira APP_CONFIG no config.js e a biblioteca Supabase."
      );
      return;
    }

    try {
      sb = window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY
      );

      // Sem tela de login e sem autenticação obrigatória.
      await boot();
    } catch (error) {
      started = false;
      console.error("Erro ao iniciar:", error);
      status("Erro ao conectar com a nuvem", "err");
    }
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
