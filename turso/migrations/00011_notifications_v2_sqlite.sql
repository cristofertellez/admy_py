-- Migration: 00011_notifications_v2
-- Description: Epic 13 — Notifications and Activity Center foundations.
-- Notes:
--   * notification_preferences stores per-user channel/event configuration
--     (Historia 13.6). event_types is a JSON array of enabled notification
--     types; NULL means "all events enabled" (backward friendly default).
--   * push_subscriptions registers devices for future Web Push delivery
--     (Historias 13.4 / 14.12 — architecture prepared, provider pending).
--   * notifications.dismissed_at supports the "dismiss" action (13.13) and
--     email_queued_at tracks e-mail digest processing (13.3).

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  in_app_enabled INTEGER NOT NULL DEFAULT 1,
  email_enabled INTEGER NOT NULL DEFAULT 0,
  push_enabled INTEGER NOT NULL DEFAULT 0,
  email_frequency TEXT NOT NULL DEFAULT 'instant' CHECK (email_frequency IN ('instant','daily','weekly')),
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  event_types TEXT,
  last_email_digest_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_is_read ON notifications(receiver_id, is_read);

ALTER TABLE notifications ADD COLUMN dismissed_at TEXT;
ALTER TABLE notifications ADD COLUMN email_queued_at TEXT;
