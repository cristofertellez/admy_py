-- Migration: 00009_comment_reactions_and_milestone_comments
-- Description: Reactions for comments (Historia 9.8) and milestone comments (Historia 9.4)
-- Notes: Mirrors the structure of project_comments / task_comments /
--        client_comments for consistency. Soft delete and ownership rules are
--        enforced at the data access layer.

-- ============================================================
-- Milestone comments (Historia 9.4)
-- ============================================================
CREATE TABLE IF NOT EXISTS milestone_comments (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  parent_comment_id TEXT REFERENCES milestone_comments(id),
  message TEXT NOT NULL,
  is_edited INTEGER NOT NULL DEFAULT 0,
  edited_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_milestone_comments_milestone_id ON milestone_comments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_comments_parent_comment_id ON milestone_comments(parent_comment_id);

-- ============================================================
-- Comment reactions (Historia 9.8)
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_reactions (
  id TEXT PRIMARY KEY,
  comment_entity_type TEXT NOT NULL,
  comment_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(comment_entity_type, comment_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_entity_type, comment_id);