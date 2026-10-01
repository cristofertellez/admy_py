-- 00008_templates_sqlite.sql
-- Historia 15.10 — Gestión de Plantillas.
-- Reusable templates for projects, tasks, milestones and reports.

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'task', 'milestone', 'report')),
  payload TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_templates_entity_type ON templates(entity_type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active) WHERE deleted_at IS NULL;