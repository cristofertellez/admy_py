-- User preferences (Historia 3.11)
-- Adds theme and per-user dashboard preferences.
-- language and timezone already exist on users from 00001_initial_schema.

ALTER TABLE users ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE users ADD COLUMN dashboard_preferences TEXT NOT NULL DEFAULT '{}';
