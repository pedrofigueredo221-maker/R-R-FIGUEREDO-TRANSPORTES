/**
 * Persistência local por navegador para a futura camada offline da R&R.
 *
 * Importante: este módulo não se conecta ao Supabase e não deve ser tratado
 * como banco compartilhado entre computadores. A integração de produção só
 * deve acontecer após a criação do serviço local central e do protocolo de sync.
 */

const DB_NAME = "rr-figueredo-offline";
const DB_VERSION = 1;
const SNAPSHOTS = "snapshots";
const OPERATIONS = "operations";
const ALLOWED_ENTITIES = new Set([
  "freights",
  "expenses",
  "receivables",
  "employees",
  "trucks",
  "categories",
]);

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Falha no IndexedDB."));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error("Transação local cancelada."));
    transaction.onerror = () => reject(transaction.error || new Error("Falha na transação local."));
  });
}

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return "op-" + Date.now().toString(36) + "-" +
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("O snapshot precisa ser um objeto.");
  }

  return snapshot;
}

function validateOperation(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("A operação precisa ser um objeto.");
  }

  if (!ALLOWED_ENTITIES.has(input.entity)) {
    throw new TypeError("Entidade não permitida para a fila offline.");
  }

  if (!["create", "update", "delete"].includes(input.action)) {
    throw new TypeError("Ação offline inválida.");
  }

  if (input.recordId === undefined || input.recordId === null || String(input.recordId).trim() === "") {
    throw new TypeError("A operação precisa identificar o registro.");
  }

  if (input.action !== "delete" && (input.payload === undefined || input.payload === null)) {
    throw new TypeError("Criação e edição precisam incluir o conteúdo do registro.");
  }
}

/**
 * Abre o armazenamento local. O chamador deve tratar falhas de quota,
 * modo privado/restrito ou indisponibilidade do IndexedDB.
 */
export function openLocalStore() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("Este navegador não oferece IndexedDB."));
  }

  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SNAPSHOTS)) {
        db.createObjectStore(SNAPSHOTS, { keyPath: "key" });
      }

      if (!db.objectStoreNames.contains(OPERATIONS)) {
        const store = db.createObjectStore(OPERATIONS, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };

    request.onerror = () => reject(request.error || new Error("Não foi possível abrir o armazenamento local."));
    request.onblocked = () => reject(new Error("Feche outras abas do sistema para atualizar o armazenamento local."));
  });
}

/** Retorna o último snapshot local ou null se este dispositivo ainda não tiver um. */
export async function readSnapshot(db) {
  const tx = db.transaction(SNAPSHOTS, "readonly");
  const done = transactionDone(tx);
  const value = await requestResult(tx.objectStore(SNAPSHOTS).get("current"));
  await done;
  return value ? value.data : null;
}

/** Grava um snapshot por dispositivo. Não sincroniza e não substitui o servidor central. */
export async function writeSnapshot(db, snapshot, metadata = {}) {
  validateSnapshot(snapshot);

  const tx = db.transaction(SNAPSHOTS, "readwrite");
  const done = transactionDone(tx);
  tx.objectStore(SNAPSHOTS).put({
    key: "current",
    data: snapshot,
    savedAt: new Date().toISOString(),
    serverVersion: Number.isFinite(metadata.serverVersion) ? metadata.serverVersion : null,
  });
  await done;
}

/**
 * Registra uma intenção de alteração de forma persistente antes da futura
 * sincronização. operationId pode ser fornecido pelo chamador para manter
 * idempotência entre tentativas. A função não envia a operação pela rede.
 */
export async function enqueueOperation(db, input) {
  validateOperation(input);

  const id = input.operationId || makeId();
  const tx = db.transaction(OPERATIONS, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(OPERATIONS);
  const existing = await requestResult(store.get(id));

  if (existing) {
    await done;
    return existing;
  }

  const operation = {
    id,
    entity: input.entity,
    recordId: String(input.recordId),
    action: input.action,
    payload: input.action === "delete" ? null : input.payload,
    baseVersion: Number.isFinite(input.baseVersion) ? input.baseVersion : null,
    createdAt: new Date().toISOString(),
    status: "pending",
    attempts: 0,
    lastError: null,
    serverVersion: null,
    syncedAt: null,
  };

  store.add(operation);
  await done;
  return operation;
}

/** Lista as operações pendentes em ordem de criação; não remove itens automaticamente. */
export async function listPendingOperations(db) {
  const tx = db.transaction(OPERATIONS, "readonly");
  const done = transactionDone(tx);
  const items = await requestResult(tx.objectStore(OPERATIONS).index("status").getAll("pending"));
  await done;

  return items.sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );
}

/** Registra um erro sem descartar a operação, para permitir nova tentativa ou análise. */
export async function markOperationFailed(db, operationId, errorMessage) {
  const tx = db.transaction(OPERATIONS, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(OPERATIONS);
  const current = await requestResult(store.get(operationId));

  if (!current) {
    await done;
    throw new Error("Operação offline não encontrada.");
  }

  store.put({
    ...current,
    status: "pending",
    attempts: current.attempts + 1,
    lastError: String(errorMessage || "Falha de sincronização"),
  });

  await done;
}

/** Marca como sincronizada somente após confirmação explícita do servidor. */
export async function markOperationSynced(db, operationId, serverVersion) {
  const tx = db.transaction(OPERATIONS, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(OPERATIONS);
  const current = await requestResult(store.get(operationId));

  if (!current) {
    await done;
    throw new Error("Operação offline não encontrada.");
  }

  store.put({
    ...current,
    status: "synced",
    serverVersion: Number.isFinite(serverVersion) ? serverVersion : null,
    syncedAt: new Date().toISOString(),
    lastError: null,
  });

  await done;
}

/** Marca um conflito para revisão; nunca o resolve por sobrescrita automática. */
export async function markOperationConflict(db, operationId, details) {
  const tx = db.transaction(OPERATIONS, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(OPERATIONS);
  const current = await requestResult(store.get(operationId));

  if (!current) {
    await done;
    throw new Error("Operação offline não encontrada.");
  }

  store.put({
    ...current,
    status: "conflict",
    conflict: details ?? null,
    lastError: "Conflito detectado; requer revisão.",
  });

  await done;
}

/** Resumo da fila para a futura indicação visual de sincronização. */
export async function getQueueSummary(db) {
  const tx = db.transaction(OPERATIONS, "readonly");
  const done = transactionDone(tx);
  const all = await requestResult(tx.objectStore(OPERATIONS).getAll());
  await done;

  return all.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] || 0) + 1;
    return summary;
  }, { pending: 0, synced: 0, conflict: 0 });
}
