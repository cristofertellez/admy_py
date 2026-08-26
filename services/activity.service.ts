import { newId, query, queryOne } from "@/lib/turso/client";

export interface ActivityLogEntry {
  user_id: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
}

const ACCESS_EVENT_DEDUPE_SECONDS = 60;

export class ActivityService {
  static async log(entry: ActivityLogEntry) {
    try {
      await query(
        `INSERT INTO activity_logs (id, user_id, action, entity, entity_id, old_value, new_value, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(),
          entry.user_id,
          entry.action,
          entry.entity,
          entry.entity_id || null,
          entry.old_value ? JSON.stringify(entry.old_value) : null,
          entry.new_value ? JSON.stringify(entry.new_value) : null,
          entry.ip_address || null,
          entry.user_agent || null,
        ],
      );
    } catch (err) {
      console.error("ActivityService: failed to write log:", err instanceof Error ? err.message : err);
    }
  }

  // Access events (views/downloads) repeat on every refresh or prefetch; they are
  // collapsed per user/action/entity within a short window to keep the audit
  // trail readable without losing traceability of the first access.
  static async logAccessOnce(entry: ActivityLogEntry, windowSeconds = ACCESS_EVENT_DEDUPE_SECONDS) {
    try {
      const recent = await queryOne<{ ok: number }>(
        `SELECT 1 AS ok FROM activity_logs
         WHERE user_id = ? AND action = ? AND (? IS NULL OR entity_id = ?) AND created_at >= ?
         LIMIT 1`,
        [
          entry.user_id,
          entry.action,
          entry.entity_id || null,
          entry.entity_id || null,
          new Date(Date.now() - windowSeconds * 1000).toISOString(),
        ],
      );
      if (recent) return;

      await this.log(entry);
    } catch (err) {
      console.error("ActivityService: failed to write access log:", err instanceof Error ? err.message : err);
    }
  }
}
