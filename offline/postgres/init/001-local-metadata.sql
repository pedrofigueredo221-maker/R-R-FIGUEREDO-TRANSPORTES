-- Metadados de migração local; não contém dados reais da empresa.
-- Este arquivo só é executado na PRIMEIRA criação do volume Docker.
CREATE TABLE IF NOT EXISTS local_migration_metadata (
  id smallint PRIMARY KEY CHECK (id = 1),
  source text NOT NULL DEFAULT 'supabase',
  imported_at timestamptz,
  source_snapshot_at timestamptz,
  verification_status text NOT NULL DEFAULT 'not_imported'
    CHECK (verification_status IN ('not_imported', 'imported_unverified', 'verified', 'failed')),
  notes text
);

INSERT INTO local_migration_metadata (id, source, verification_status)
VALUES (1, 'supabase', 'not_imported')
ON CONFLICT (id) DO NOTHING;
