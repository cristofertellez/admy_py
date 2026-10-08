import { newId, query, queryOne } from "@/lib/turso/client";
import { getSettingDefault } from "./settings.definition";

interface SettingRecord {
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

// Values are stored as JSON. Legacy rows used a wrapper object ({ value: ... }),
// which is unwrapped transparently here so the new typed store stays compatible.
function parseSettingValue(raw: string): unknown {
  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    Object.keys(parsed).length === 1 &&
    "value" in parsed
  ) {
    return (parsed as Record<string, unknown>).value;
  }
  return parsed;
}

function toSettingRecord(row: SettingRowRaw): SettingRecord {
  return { ...row, value: parseSettingValue(row.value) };
}

export class SettingsService {
  static async getAll() {
    const rows = await query<SettingRowRaw>("SELECT * FROM settings ORDER BY key");
    return rows.map(toSettingRecord);
  }

  static async getMap(): Promise<Record<string, unknown>> {
    const rows = await this.getAll();
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    return map;
  }

  static async get(key: string) {
    const row = await queryOne<SettingRowRaw>("SELECT * FROM settings WHERE key = ? LIMIT 1", [key]);
    if (!row) {
      throw new Error(`Setting "${key}" not found.`);
    }
    return toSettingRecord(row);
  }

  // Returns the stored value or the default defined for the key.
  static async getValue(key: string): Promise<unknown> {
    const row = await queryOne<SettingRowRaw>(
      "SELECT value FROM settings WHERE key = ? LIMIT 1",
      [key],
    );
    if (!row) {
      return getSettingDefault(key);
    }
    return parseSettingValue(row.value);
  }

  static async set(key: string, value: unknown, description?: string) {
    await query(
      `INSERT INTO settings (id, key, value, description, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         description = COALESCE(excluded.description, settings.description),
         updated_at = excluded.updated_at`,
      [newId(), key, JSON.stringify(value), description ?? null, new Date().toISOString()],
    );

    return this.get(key);
  }

  static async setMany(entries: { key: string; value: unknown }[]) {
    if (entries.length === 0) return this.getMap();

    const now = new Date().toISOString();
    for (const entry of entries) {
      await query(
        `INSERT INTO settings (id, key, value, description, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`,
        [newId(), entry.key, JSON.stringify(entry.value), null, now],
      );
    }

    return this.getMap();
  }
}