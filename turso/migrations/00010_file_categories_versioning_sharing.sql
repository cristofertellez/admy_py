-- Migration: 00010_file_categories_versioning_sharing
-- Description: Épica 10 — categories (10.3), versioning (10.4), sharing (10.9)
-- Notes: Adds lightweight metadata columns to attachments and a file_shares
--        table for per-file sharing access levels. Versioning uses version_of
--        to link a revision back to its original file.

-- ============================================================
-- Category + versioning columns on attachments (10.3 / 10.4)
-- ============================================================
ALTER TABLE attachments ADD COLUMN category TEXT NOT NULL DEFAULT 'Otros';
ALTER TABLE attachments ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE attachments ADD COLUMN version_of TEXT REFERENCES attachments(id);

CREATE INDEX IF NOT EXISTS idx_attachments_category ON attachments(category);
CREATE INDEX IF NOT EXISTS idx_attachments_version_of ON attachments(version_of);

-- ============================================================
-- Per-file sharing (10.9)
-- ============================================================
CREATE TABLE IF NOT EXISTS file_shares (
  id TEXT PRIMARY KEY,
  attachment_id TEXT NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'download' CHECK (access_level IN ('read', 'download', 'hidden')),
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(attachment_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_file_shares_attachment ON file_shares(attachment_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_entity ON file_shares(entity_type, entity_id);