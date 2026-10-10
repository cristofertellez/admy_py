import { createClient, type Client, type InValue } from "@libsql/client";

let client: Client | null = null;

export function getTursoClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not configured.");
    }

    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return client;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  const result = await getTursoClient().execute({ sql, args });
  return result.rows.map((row) => ({ ...row })) as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

export async function countRows(sql: string, args: InValue[] = []): Promise<number> {
  const row = await queryOne<{ total: number }>(sql, args);
  return Number(row?.total ?? 0);
}

export function newId(): string {
  return crypto.randomUUID();
}

export type { InValue };
