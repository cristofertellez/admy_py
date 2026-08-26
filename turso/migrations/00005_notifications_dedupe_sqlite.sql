-- Migration: 00005_notifications_dedupe
-- Description: Deduplication support for notifications (Historia 5.11).
--              A unique partial index guarantees the same notification
--              (receiver + event) is never inserted twice.

ALTER TABLE notifications ADD COLUMN dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe_key
  ON notifications(dedupe_key)
  WHERE dedupe_key IS NOT NULL;
