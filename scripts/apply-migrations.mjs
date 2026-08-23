import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "turso", "migrations");

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is not set. Fill it in .env.local first.");
  process.exit(1);
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

await client.execute("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))");

const applied = new Set(
  (await client.execute("SELECT name FROM _migrations")).rows.map((r) => String(r.name)),
);

const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`= ${file} (already applied)`);
    continue;
  }

  const sql = readFileSync(join(migrationsDir, file), "utf8");
  const withoutComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Applying ${file} (${statements.length} statements)...`);

  for (const statement of statements) {
    await client.execute(statement);
  }

  await client.execute({ sql: "INSERT INTO _migrations (name) VALUES (?)", args: [file] });
  console.log(`+ ${file} applied`);
}

console.log("Migrations complete.");
