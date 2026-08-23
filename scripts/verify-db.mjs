import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite%' AND name != '_migrations' ORDER BY name"
);

console.log("TABLAS (" + tables.rows.length + "):");
for (const row of tables.rows) {
  console.log("  - " + row.name);
}

const roles = await client.execute("SELECT name FROM roles ORDER BY name");
console.log("ROLES: " + roles.rows.map((r) => r.name).join(", "));

const perms = await client.execute("SELECT COUNT(*) AS n FROM permissions");
console.log("PERMISOS: " + perms.rows[0].n);

const rp = await client.execute("SELECT COUNT(*) AS n FROM role_permissions");
console.log("ROLE_PERMISSIONS (Developer): " + rp.rows[0].n);
