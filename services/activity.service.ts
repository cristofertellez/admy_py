import { newId, query } from "@/lib/turso/client";

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
}
