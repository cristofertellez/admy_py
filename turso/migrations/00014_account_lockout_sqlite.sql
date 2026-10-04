-- Migration: 00014_account_lockout
-- Description: Historia 16.13 — brute-force protection. Failed login
-- attempts are counted per user and temporary lockouts are enforced by the
-- credentials provider using the login_max_attempts / auto_lock_minutes
-- settings.

ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
