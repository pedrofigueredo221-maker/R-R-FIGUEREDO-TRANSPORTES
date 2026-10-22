-- R&R Figueredo Transportes — esquema inicial do serviço local offline.
-- Referência para futura API local; ainda NÃO está integrado à aplicação.
-- Banco alvo: SQLite, acessado exclusivamente por um serviço local autenticado.
-- Não executar no Supabase. Não inclui dados reais da empresa.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS local_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS offline_records (
  entity TEXT NOT NULL CHECK (entity IN ('freights','expenses','receivables','employees','trucks','categories')),
  record_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at TEXT,
  PRIMARY KEY (entity, record_id)
);

CREATE TABLE IF NOT EXISTS offline_operations (
  operation_id TEXT PRIMARY KEY,
  entity TEXT NOT NULL CHECK (entity IN ('freights','expenses','receivables','employees','trucks','categories')),
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete')),
  payload_json TEXT,
  base_version INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','synced','conflict','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  synced_at TEXT,
  server_version INTEGER,
  CHECK ((action = 'delete') OR payload_json IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_offline_operations_status_created
  ON offline_operations(status, created_at);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  source TEXT PRIMARY KEY,
  last_version INTEGER NOT NULL DEFAULT 0,
  last_success_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Idempotência: operation_id é chave primária. O serviço deve confirmar
-- a operação apenas depois da transação de gravação ser concluída.
-- Conflitos de versão devem ser marcados e revisados, nunca sobrescritos em silêncio.
