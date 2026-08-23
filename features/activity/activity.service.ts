import { countRows, query, type InValue } from "@/lib/turso/client";
import type {
  ActivityLog,
  ActivityLogFilters,
  ActivityLogListResult,
  ActivityUserOption,
} from "./activity.types";

const ACTIVITY_SELECT = `
  SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.old_value, al.new_value,
         al.created_at, u.first_name AS user_first_name, u.last_name AS user_last_name
  FROM activity_logs al
  LEFT JOIN users u ON u.id = al.user_id`;

const SORTABLE_COLUMNS = new Set(["created_at", "action", "entity"]);

function buildWhere(filters: Pick<ActivityLogFilters, "search" | "userId" | "entity">) {
  const conditions: string[] = [];
  const args: InValue[] = [];

  if (filters.search) {
    conditions.push("(LOWER(al.action) LIKE ? OR LOWER(al.entity) LIKE ?)");
    const term = `%${filters.search.toLowerCase()}%`;
    args.push(term, term);
  }
  if (filters.userId) {
    conditions.push("al.user_id = ?");
    args.push(filters.userId);
  }
  if (filters.entity) {
    conditions.push("al.entity = ?");
    args.push(filters.entity);
  }

  const whereSql = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  return { whereSql, args };
}

export class ActivityLogService {
  static async list(filters: ActivityLogFilters = {}): Promise<ActivityLogListResult> {
    const { search, userId, entity, page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" } =
      filters;

    const { whereSql, args } = buildWhere({ search, userId, entity });
    const orderColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : "created_at";
    const direction = sortOrder === "asc" ? "ASC" : "DESC";
    const offset = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      query<ActivityLog>(
        `${ACTIVITY_SELECT}${whereSql} ORDER BY al.${orderColumn} ${direction} LIMIT ? OFFSET ?`,
        [...args, pageSize, offset],
      ),
      countRows(`SELECT COUNT(*) AS total FROM activity_logs al${whereSql}`, args),
    ]);

    return { data: rows, total, page, pageSize };
  }

  static async getUsersWithActivity(): Promise<ActivityUserOption[]> {
    return query<ActivityUserOption>(
      `SELECT DISTINCT u.id, u.first_name, u.last_name
       FROM activity_logs al
       JOIN users u ON u.id = al.user_id
       ORDER BY u.first_name, u.last_name`,
    );
  }

  static async getEntities(): Promise<string[]> {
    const rows = await query<{ entity: string }>(
      `SELECT DISTINCT entity FROM activity_logs ORDER BY entity`,
    );
    return rows.map((row) => row.entity);
  }
}
