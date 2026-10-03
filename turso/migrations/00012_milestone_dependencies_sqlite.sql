-- Migration: 00012_milestone_dependencies
-- Description: Historia 8.8 — dependencies between milestones.
-- Notes: A milestone can declare predecessors/successors and related
--        milestones. The UNIQUE constraint blocks duplicates and the CHECK
--        prevents self-references; cycle detection lives in the service.

CREATE TABLE IF NOT EXISTS milestone_dependencies (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  depends_on_milestone_id TEXT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'Finish to Start'
    CHECK (dependency_type IN ('Finish to Start', 'Start to Start', 'Related')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(milestone_id, depends_on_milestone_id),
  CHECK (milestone_id != depends_on_milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_milestone_dependencies_milestone_id ON milestone_dependencies(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_dependencies_depends_on ON milestone_dependencies(depends_on_milestone_id);
