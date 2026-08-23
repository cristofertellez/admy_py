-- Migration: 00004_client_comments
-- Description: Comments associated with clients (Historia 4.9)
-- Notes: Mirrors the structure of project_comments / task_comments.
--        Soft delete and ownership rules are enforced at the data access layer.

CREATE TABLE IF NOT EXISTS client_comments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  parent_comment_id TEXT REFERENCES client_comments(id),
  message TEXT NOT NULL,
  is_edited INTEGER NOT NULL DEFAULT 0,
  edited_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_client_comments_client_id ON client_comments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_comments_parent_comment_id ON client_comments(parent_comment_id);
