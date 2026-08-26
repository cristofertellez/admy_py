-- Migration: 00007_admin_roles
-- Description: System roles Administrator and Super Administrator (Historia 6.18)
-- Notes: Prepared since Historia 2.7 and referenced by lib/routes.ts; seeded here
--        so users can actually be assigned them. Permissions stay defined in the
--        application RBAC hierarchy (lib/auth.ts), consistent with existing roles.

INSERT INTO roles (id, name, description)
SELECT
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
  'Administrator',
  'Full management of operational modules (projects, clients, tasks, comments, files, reports)'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Administrator');

INSERT INTO roles (id, name, description)
SELECT
  lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
  'Super Administrator',
  'Total access including users, roles, permissions and system settings'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Super Administrator');
