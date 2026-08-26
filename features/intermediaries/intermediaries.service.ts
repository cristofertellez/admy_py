import { query, queryOne, countRows, newId, type InValue } from "@/lib/turso/client";
import { hashPassword } from "@/lib/auth/password";
import type { Client } from "@/types";
import { ACCESS_AUDIT_ACTIONS, type ActivityLog } from "@/features/activity";
import { CLIENT_HISTORY_ACTIONS } from "@/features/clients";
import type {
  IntermediaryHistoryFilters,
  IntermediaryHistoryResult,
  IntermediaryRecord,
} from "./intermediaries.types";

// Access audit events are global-only and never part of the portfolio timeline.
function accessAuditExclusion(): { sql: string; args: InValue[] } {
  return {
    sql: `al.action NOT IN (${ACCESS_AUDIT_ACTIONS.map(() => "?").join(", ")})`,
    args: [...ACCESS_AUDIT_ACTIONS],
  };
}

function mapUser(row: Record<string, unknown>): IntermediaryRecord {
  return {
    ...(row as unknown as IntermediaryRecord),
    is_active: !!row.is_active,
  };
}

function mapClient(row: Record<string, unknown>): Client {
  return {
    ...(row as unknown as Client),
    is_active: !!row.is_active,
  };
}

export class IntermediariesService {
  static async list(
    filters: {
      search?: string;
      status?: "active" | "inactive";
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const { search, status, page = 1, pageSize = 20 } = filters;

    const conditions: string[] = ["r.name = 'Intermediary'"];
    const args: InValue[] = [];

    if (search) {
      conditions.push(
        "(lower(u.first_name) LIKE ? OR lower(u.last_name) LIKE ? OR lower(u.email) LIKE ?)",
      );
      const pattern = `%${search.toLowerCase()}%`;
      args.push(pattern, pattern, pattern);
    }

    if (status === "active") conditions.push("u.is_active = 1");
    if (status === "inactive") conditions.push("u.is_active = 0");

    const where = `WHERE ${conditions.join(" AND ")}`;

    const total = await countRows(
      `SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id = u.role_id ${where}`,
      args,
    );

    const rows = await query<Record<string, unknown>>(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    return { data: rows.map(mapUser), total, page, pageSize };
  }

  static async getStats() {
    const row = await queryOne<{ total: number; active: number }>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN u.is_active = 1 THEN 1 ELSE 0 END), 0) AS active
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'Intermediary'`,
    );

    const total = row?.total ?? 0;
    const active = row?.active ?? 0;

    return { total, active, inactive: total - active };
  }

  static async getById(id: string) {
    const user = await queryOne<Record<string, unknown>>(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       LIMIT 1`,
      [id],
    );

    if (!user) throw new Error("Intermediary not found.");
    return mapUser(user);
  }

  static async create(input: { first_name: string; last_name: string; email: string; password: string }) {
    const role = await queryOne<{ id: string }>(
      `SELECT id FROM roles WHERE name = 'Intermediary' LIMIT 1`,
    );

    if (!role) throw new Error("The Intermediary role does not exist.");

    const email = input.email.trim().toLowerCase();

    const duplicate = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = ? LIMIT 1`,
      [email],
    );

    if (duplicate) throw new Error("An account with this email already exists.");

    const id = newId();

    await query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.first_name, input.last_name, email, hashPassword(input.password), role.id],
    );

    return IntermediariesService.getById(id);
  }

  static async update(id: string, input: { first_name: string; last_name: string; email: string }) {
    const current = await queryOne<{ email: string }>(
      `SELECT email FROM users WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!current) throw new Error("Intermediary not found.");

    const email = input.email.trim().toLowerCase();

    if (email !== current.email.toLowerCase()) {
      const duplicate = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE lower(email) = ? AND id != ? LIMIT 1`,
        [email, id],
      );

      if (duplicate) throw new Error("An account with this email already exists.");
    }

    await query(
      `UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = ?
       WHERE id = ?`,
      [input.first_name, input.last_name, email, new Date().toISOString(), id],
    );

    return IntermediariesService.getById(id);
  }

  static async toggleActive(id: string, isActive: boolean) {
    await query(
      `UPDATE users SET is_active = ?, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [
        isActive ? 1 : 0,
        isActive ? null : new Date().toISOString(),
        new Date().toISOString(),
        id,
      ],
    );
  }

  static async getAssignedClients(intermediaryId: string): Promise<Client[]> {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM clients WHERE intermediary_id = ?`,
      [intermediaryId],
    );

    return rows.map(mapClient);
  }

  static async getLastActivity(intermediaryId: string) {
    const exclusion = accessAuditExclusion();

    return queryOne<{
      id: string;
      action: string;
      entity: string;
      created_at: string;
      user_first_name: string | null;
      user_last_name: string | null;
    }>(
      `SELECT al.id, al.action, al.entity, al.created_at,
              u.first_name AS user_first_name, u.last_name AS user_last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ((al.entity = 'Client' AND al.entity_id IN ${assignedClientsSql()})
              OR (al.entity_id IN (SELECT id FROM projects WHERE client_id IN ${assignedClientsSql()})))
         AND ${exclusion.sql}
       ORDER BY al.created_at DESC
       LIMIT 1`,
      [intermediaryId, intermediaryId, ...exclusion.args],
    );
  }

  static async getHistory(
    intermediaryId: string,
    filters: IntermediaryHistoryFilters = {},
  ): Promise<IntermediaryHistoryResult> {
    const { search, category, page = 1, pageSize = 20 } = filters;

    // The portfolio timeline aggregates events on assigned clients plus events
    // recorded on their projects and on comments attached to them.
    const scopeConditions = [
      `(al.entity = 'Client' AND al.entity_id IN ${assignedClientsSql()})`,
      `p.client_id IN ${assignedClientsSql()}`,
      `pp.client_id IN ${assignedClientsSql()}`,
      `cc.client_id IN ${assignedClientsSql()}`,
    ];
    const scopeArgs: InValue[] = [intermediaryId, intermediaryId, intermediaryId, intermediaryId];

    const filterConditions: string[] = [];
    const filterArgs: InValue[] = [];

    if (category) {
      const actions = CLIENT_HISTORY_ACTIONS[category];
      filterConditions.push(`al.action IN (${actions.map(() => "?").join(", ")})`);
      filterArgs.push(...actions);
    }

    if (search) {
      const pattern = `%${search.toLowerCase()}%`;
      filterConditions.push(
        "(lower(al.action) LIKE ? OR lower(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) LIKE ? OR lower(coalesce(al.old_value, '')) LIKE ? OR lower(coalesce(al.new_value, '')) LIKE ?)",
      );
      filterArgs.push(pattern, pattern, pattern, pattern);
    }

    const fromClause = `
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN projects p ON al.entity = 'Project' AND al.entity_id = p.id
      LEFT JOIN project_comments pc ON al.entity = 'Comment' AND al.entity_id = pc.id
      LEFT JOIN projects pp ON pp.id = pc.project_id
      LEFT JOIN client_comments cc ON al.entity = 'Comment' AND al.entity_id = cc.id`;
    const exclusion = accessAuditExclusion();
    // Args follow the WHERE placeholder order: scopes, access exclusion, then filters.
    const whereParts = [
      `(${scopeConditions.join(" OR ")})`,
      exclusion.sql,
      ...filterConditions,
    ];
    const whereArgs: InValue[] = [...scopeArgs, ...exclusion.args, ...filterArgs];
    const whereClause = whereParts.join(" AND ");

    const total = await countRows(
      `SELECT COUNT(*) AS total ${fromClause} WHERE ${whereClause}`,
      whereArgs,
    );

    const data = await query<ActivityLog>(
      `SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.old_value, al.new_value,
              al.created_at, u.first_name AS user_first_name, u.last_name AS user_last_name
       ${fromClause}
       WHERE ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereArgs, pageSize, (page - 1) * pageSize],
    );

    return { data, total, page, pageSize };
  }
}

function assignedClientsSql(): string {
  return "(SELECT id FROM clients WHERE intermediary_id = ? AND deleted_at IS NULL)";
}
