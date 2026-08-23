import { newId, query, queryOne } from "@/lib/turso/client";

export interface SettingRecord {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface SettingRowRaw extends Omit<SettingRecord, "value"> {
  value: string;
}

function parseSettingValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function toSettingRecord(row: SettingRowRaw): SettingRecord {
  return { ...row, value: parseSettingValue(row.value) };
}

export class SettingsService {
  static async getAll() {
    const rows = await query<SettingRowRaw>("SELECT * FROM settings ORDER BY key");
    return rows.map(toSettingRecord);
  }

  static async get(key: string) {
    const row = await queryOne<SettingRowRaw>("SELECT * FROM settings WHERE key = ? LIMIT 1", [key]);
    if (!row) {
      throw new Error(`Setting "${key}" not found.`);
    }
    return toSettingRecord(row);
  }

  static async set(key: string, value: Record<string, unknown>, description?: string) {
    await query(
      `INSERT INTO settings (id, key, value, description, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         description = COALESCE(excluded.description, settings.description),
         updated_at = excluded.updated_at`,
      [newId(), key, JSON.stringify(value), description ?? null, new Date().toISOString()],
    );

    const row = await queryOne<SettingRowRaw>("SELECT * FROM settings WHERE key = ? LIMIT 1", [key]);
    if (!row) {
      throw new Error("Failed to save setting.");
    }
    return toSettingRecord(row);
  }
}
