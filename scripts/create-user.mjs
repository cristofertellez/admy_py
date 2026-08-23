import { createClient } from "@libsql/client";
import { randomBytes, scryptSync } from "node:crypto";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function arg(name) {
  const flag = process.argv.find((a) => a.startsWith(`--${name}=`));
  return flag ? flag.split("=").slice(1).join("=") : undefined;
}

const email = arg("email");
const password = arg("password");
const firstName = arg("first-name") ?? "Admin";
const lastName = arg("last-name") ?? "User";
const roleName = arg("role") ?? "Developer";

if (!email || !password) {
  console.error('Usage: node scripts/create-user.mjs --email=you@example.com --password=secret [--first-name=A] [--last-name=B] [--role=Developer]');
  process.exit(1);
}

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const existing = await client.execute({
  sql: "SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1",
  args: [email],
});

if (existing.rows.length > 0) {
  console.error(`A user with email ${email} already exists.`);
  process.exit(1);
}

const role = await client.execute({
  sql: "SELECT id FROM roles WHERE name = ? LIMIT 1",
  args: [roleName],
});

if (role.rows.length === 0) {
  console.error(`Role "${roleName}" does not exist. Valid roles: Developer, Client, Intermediary.`);
  process.exit(1);
}

await client.execute({
  sql: `INSERT INTO users (id, first_name, last_name, email, password_hash, role_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
  args: [
    crypto.randomUUID(),
    firstName,
    lastName,
    email.toLowerCase(),
    hashPassword(password),
    String(role.rows[0].id),
  ],
});

console.log(`User created: ${firstName} ${lastName} <${email}> role=${roleName}`);
