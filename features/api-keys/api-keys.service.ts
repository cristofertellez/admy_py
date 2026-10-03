import { createHash, randomBytes } from "node:crypto";
import { countRows, newId, query, queryOne } from "@/lib/turso/client";
import type { SessionProfile } from "@/lib/auth";

// Épica 17 (17.2) — API key management. Keys are shown once at creation and
// stored as SHA-256 hashes; usage and revocation are audited by the callers.

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  key_hash: string;
  scopes: string;
  created_by: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiKeyView {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expires_at: string | null;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

export const API_KEY_SCOPES = ["read", "write"] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

const DEFAULT_EXPIRY_MONTHS = 12;

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export class ApiKeysService {
  static generateSecret(): { key: string; prefix: string; hash: string } {
    const secret = randomBytes(24).toString("hex");
    const key = `apk_${secret}`;
    return { key, prefix: key.slice(0, 12), hash: hashKey(key) };
  }

  static async create(input: {
    name: string;
    scopes: ApiKeyScope[];
    createdBy: string;
    expiresAt?: string | null;
  }): Promise<{ id: string; key: string }> {
    const { key, prefix, hash } = ApiKeysService.generateSecret();
    const id = newId();

    const expiresAt =
      input.expiresAt ??
      new Date(Date.now() + DEFAULT_EXPIRY_MONTHS * 30 * 24 * 60 * 60 * 1000).toISOString();

    await query(
      `INSERT INTO api_keys (id, name, prefix, key_hash, scopes, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name, prefix, hash, JSON.stringify(input.scopes), input.createdBy, expiresAt],
    );

    return { id, key };
  }

  static async list(): Promise<ApiKeyView[]> {
    const rows = await query<ApiKeyRow>(
      `SELECT * FROM api_keys ORDER BY created_at DESC`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      scopes: ApiKeysService.parseScopes(row.scopes),
      expires_at: row.expires_at,
      revoked: row.revoked_at !== null,
      last_used_at: row.last_used_at,
      created_at: row.created_at,
    }));
  }

  static async revoke(id: string): Promise<void> {
    await query(`UPDATE api_keys SET revoked_at = ?, updated_at = ? WHERE id = ? AND revoked_at IS NULL`, [
      new Date().toISOString(),
      new Date().toISOString(),
      id,
    ]);
  }

  static async remove(id: string): Promise<void> {
    await query(`DELETE FROM api_keys WHERE id = ?`, [id]);
  }

  static parseScopes(raw: string): ApiKeyScope[] {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return ["read"];
      return parsed.filter((scope): scope is ApiKeyScope =>
        (API_KEY_SCOPES as readonly string[]).includes(scope as string),
      );
    } catch {
      return ["read"];
    }
  }

  /**
   * Authenticates a Bearer key and returns the owner's session profile plus
   * the allowed scopes. Expired or revoked keys are rejected; the key
   * owner's role keeps driving the data-layer scopes (auth-scope.ts).
   */
  static async authenticate(
    key: string,
  ): Promise<{ profile: SessionProfile; scopes: ApiKeyScope[]; keyId: string } | null> {
    const row = await queryOne<ApiKeyRow & { revoked: number }>(
      `SELECT *, (revoked_at IS NOT NULL) AS revoked FROM api_keys WHERE key_hash = ? LIMIT 1`,
      [hashKey(key)],
    );
    if (!row || row.revoked === 1) return null;
    if (row.expires_at && row.expires_at < new Date().toISOString()) return null;

    const owner = await queryOne<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
      avatar: string | null;
      role_id: string;
      role: string;
      last_login: string | null;
      timezone: string;
      language: string;
      theme: string;
      created_at: string;
    }>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar,
              u.role_id, r.name AS role, u.last_login, u.timezone, u.language, u.theme, u.created_at
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.is_active = 1 AND u.deleted_at IS NULL LIMIT 1`,
      [row.created_by ?? ""],
    );
    if (!owner) return null;

    await query(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      row.id,
    ]);

    return {
      profile: owner as unknown as SessionProfile,
      scopes: ApiKeysService.parseScopes(row.scopes),
      keyId: row.id,
    };
  }

  static async countActive(): Promise<number> {
    return countRows(
      `SELECT COUNT(*) AS total FROM api_keys WHERE revoked_at IS NULL`,
    );
  }
}
