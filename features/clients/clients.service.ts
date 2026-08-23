import { query, queryOne, countRows, newId, type InValue } from "@/lib/turso/client";
import { assertClientVisible, clientScope } from "@/lib/auth-scope";
import type { Client } from "@/types";
import {
  CLIENT_HISTORY_ACTIONS,
  type AssignedIntermediary,
  type ClientFilters,
  type ClientHistoryFilters,
  type ClientHistoryResult,
  type ClientProjectSummary,
  type ClientWithRelations,
} from "./clients.types";
import type { ActivityLog } from "@/features/activity";

const SORTABLE_COLUMNS = new Set(["created_at", "updated_at", "company_name", "status"]);

function toBoolean(row: Record<string, unknown>): Client {
  return {
    ...(row as unknown as Client),
    is_active: !!row.is_active,
  };
}

function buildSetClause(input: Record<string, unknown>): { set: string[]; args: InValue[] } {
  const allowedColumns = [
    "company_name",
    "contact_name",
    "email",
    "phone",
    "address",
    "country",
    "city",
    "website",
    "notes",
    "logo",
    "status",
    "intermediary_id",
    "created_by",
    "updated_by",
    "deleted_at",
    "is_active",
  ];

  const set: string[] = [];
  const args: InValue[] = [];

  for (const column of allowedColumns) {
    if (column in input && input[column] !== undefined) {
      set.push(`${column} = ?`);
      args.push((column === "is_active" ? (input[column] ? 1 : 0) : input[column]) as InValue);
    }
  }

  return { set, args };
}

export class ClientsService {
  static async list(filters: ClientFilters = {}) {
    const { search, status, page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" } = filters;

    const conditions: string[] = [];
    const args: InValue[] = [];

    if (search) {
      conditions.push(
        "(lower(company_name) LIKE ? OR lower(contact_name) LIKE ? OR lower(email) LIKE ? OR lower(phone) LIKE ?)",
      );
      const pattern = `%${search.toLowerCase()}%`;
      args.push(pattern, pattern, pattern, pattern);
    }
    if (status) {
      conditions.push("status = ?");
      args.push(status);
    }

    const scope = await clientScope("id");
    if (scope.sql) {
      conditions.push(scope.sql);
      args.push(...scope.args);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : "created_at";
    const direction = sortOrder === "asc" ? "ASC" : "DESC";

    const total = await countRows(`SELECT COUNT(*) AS total FROM clients ${where}`, args);

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM clients ${where} ORDER BY ${sortColumn} ${direction} LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    return {
      data: rows.map(toBoolean) as unknown as ClientWithRelations[],
      total,
      page,
      pageSize,
    };
  }

  static async getById(id: string) {
    const client = await queryOne<Record<string, unknown>>(
      `SELECT * FROM clients WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!client) throw new Error("Client not found.");
    await assertClientVisible(id);
    return toBoolean(client);
  }

  static async create(
    input: Omit<Client, "id" | "created_at" | "updated_at" | "is_active"> & { is_active?: boolean },
  ) {
    const id = newId();

    await query(
      `INSERT INTO clients (
        id, company_name, contact_name, email, phone, address, country, city,
        website, notes, logo, status, intermediary_id, created_by, updated_by,
        deleted_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.company_name,
        input.contact_name ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.address ?? null,
        input.country ?? null,
        input.city ?? null,
        input.website ?? null,
        input.notes ?? null,
        input.logo ?? null,
        input.status,
        input.intermediary_id ?? null,
        input.created_by ?? null,
        input.updated_by ?? null,
        input.deleted_at ?? null,
        (input.is_active ?? true) ? 1 : 0,
      ],
    );

    return ClientsService.getById(id);
  }

  static async update(id: string, input: Partial<Client>) {
    const { set, args } = buildSetClause({ ...input, updated_at: new Date().toISOString() });

    if (set.length === 0) return ClientsService.getById(id);

    await query(
      `UPDATE clients SET ${set.join(", ")} WHERE id = ?`,
      [...args, id],
    );

    return ClientsService.getById(id);
  }

  static async getActiveProjectsCount(clientId: string) {
    return countRows(
      `SELECT COUNT(*) AS total FROM projects
       WHERE client_id = ? AND deleted_at IS NULL AND is_active = 1
         AND status NOT IN ('Completed', 'Cancelled', 'Archived')`,
      [clientId],
    );
  }

  static async getProjects(clientId: string): Promise<ClientProjectSummary[]> {
    await assertClientVisible(clientId);

    const rows = await query<Record<string, unknown>>(
      `SELECT id, name, status, priority, completion_percentage,
              estimated_start_date, estimated_end_date, worked_hours, estimated_hours
       FROM projects
       WHERE client_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [clientId],
    );

    return rows as unknown as ClientProjectSummary[];
  }

  static async getUpcomingDeliveries(clientId: string, limit = 5) {
    await assertClientVisible(clientId);

    const today = new Date().toISOString().slice(0, 10);
    return query(
      `SELECT m.id, m.title, m.estimated_date, m.status, p.name AS project_name
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       WHERE p.client_id = ? AND p.deleted_at IS NULL AND m.deleted_at IS NULL
         AND m.estimated_date IS NOT NULL AND m.estimated_date >= ?
         AND m.status != 'Completed'
       ORDER BY m.estimated_date ASC
       LIMIT ?`,
      [clientId, today, limit],
    );
  }

  static async getLastActivity(clientId: string) {
    await assertClientVisible(clientId);

    return queryOne(
      `SELECT al.id, al.action, al.entity, al.created_at,
              u.first_name AS user_first_name, u.last_name AS user_last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ((al.entity = 'Client' AND al.entity_id = ?)
              OR (al.entity_id IN (SELECT id FROM projects WHERE client_id = ?)))
       ORDER BY al.created_at DESC
       LIMIT 1`,
      [clientId, clientId],
    );
  }

  static async getAssignedIntermediary(clientId: string): Promise<AssignedIntermediary | null> {
    await assertClientVisible(clientId);

    const row = await queryOne<Record<string, unknown>>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active
       FROM clients c
       JOIN users u ON u.id = c.intermediary_id
       WHERE c.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [clientId],
    );

    if (!row) return null;
    return { ...(row as unknown as AssignedIntermediary), is_active: !!row.is_active };
  }

  static async getClientHistory(
    clientId: string,
    filters: ClientHistoryFilters = {},
  ): Promise<ClientHistoryResult> {
    await assertClientVisible(clientId);

    const { search, category, page = 1, pageSize = 20 } = filters;

    // The client history aggregates events about the client itself plus events
    // recorded on its projects and on comments attached to it or its projects.
    const scopeConditions = [
      "(al.entity = 'Client' AND al.entity_id = ?)",
      "p.client_id = ?",
      "pp.client_id = ?",
      "cc.client_id = ?",
    ];
    const args: InValue[] = [clientId, clientId, clientId, clientId];

    const filterConditions: string[] = [];

    if (category) {
      const actions = CLIENT_HISTORY_ACTIONS[category];
      filterConditions.push(`al.action IN (${actions.map(() => "?").join(", ")})`);
      args.push(...actions);
    }

    if (search) {
      const pattern = `%${search.toLowerCase()}%`;
      filterConditions.push(
        "(lower(al.action) LIKE ? OR lower(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) LIKE ? OR lower(coalesce(al.old_value, '')) LIKE ? OR lower(coalesce(al.new_value, '')) LIKE ?)",
      );
      args.push(pattern, pattern, pattern, pattern);
    }

    const fromClause = `
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN projects p ON al.entity = 'Project' AND al.entity_id = p.id
      LEFT JOIN project_comments pc ON al.entity = 'Comment' AND al.entity_id = pc.id
      LEFT JOIN projects pp ON pp.id = pc.project_id
      LEFT JOIN client_comments cc ON al.entity = 'Comment' AND al.entity_id = cc.id`;
    const whereClause = `((${scopeConditions.join(") OR (")})${
      filterConditions.length > 0 ? ` AND ${filterConditions.join(" AND ")}` : ""
    })`;

    const total = await countRows(`SELECT COUNT(*) AS total ${fromClause} WHERE ${whereClause}`, args);

    const data = await query<ActivityLog>(
      `SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.old_value, al.new_value,
              al.created_at, u.first_name AS user_first_name, u.last_name AS user_last_name
       ${fromClause}
       WHERE ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    return { data, total, page, pageSize };
  }

  static async listAvailableIntermediaries(): Promise<AssignedIntermediary[]> {
    const rows = await query<Record<string, unknown>>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar, u.is_active
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'Intermediary' AND u.deleted_at IS NULL AND u.is_active = 1
       ORDER BY u.first_name ASC, u.last_name ASC`,
    );

    return rows.map((row) => ({
      ...(row as unknown as AssignedIntermediary),
      is_active: !!row.is_active,
    }));
  }

  static async assignIntermediary(clientId: string, intermediaryId: string) {
    await assertClientVisible(clientId);

    const current = await ClientsService.getAssignedIntermediary(clientId);
    if (current?.id === intermediaryId) {
      throw new Error("This intermediary is already assigned to this client.");
    }

    const intermediary = await queryOne<{ id: string; first_name: string; last_name: string }>(
      `SELECT u.id, u.first_name, u.last_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND r.name = 'Intermediary' AND u.deleted_at IS NULL AND u.is_active = 1
       LIMIT 1`,
      [intermediaryId],
    );

    if (!intermediary) throw new Error("Intermediary not found.");

    await query(`UPDATE clients SET intermediary_id = ?, updated_at = ? WHERE id = ?`, [
      intermediaryId,
      new Date().toISOString(),
      clientId,
    ]);

    return `${intermediary.first_name} ${intermediary.last_name}`;
  }

  static async removeIntermediary(clientId: string): Promise<{ id: string; name: string } | null> {
    await assertClientVisible(clientId);

    const current = await queryOne<{
      intermediary_id: string;
      first_name: string;
      last_name: string;
    }>(
      `SELECT c.intermediary_id, u.first_name, u.last_name
       FROM clients c
       JOIN users u ON u.id = c.intermediary_id
       WHERE c.id = ? LIMIT 1`,
      [clientId],
    );

    if (!current?.intermediary_id) return null;

    await query(
      `UPDATE clients SET intermediary_id = NULL, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), clientId],
    );
    return {
      id: current.intermediary_id,
      name: `${current.first_name} ${current.last_name}`,
    };
  }

  static async archive(id: string) {
    // A client cannot be archived while it still has active projects.
    const activeProjects = await ClientsService.getActiveProjectsCount(id);
    if (activeProjects > 0) {
      throw new Error("This client has active projects and cannot be archived.");
    }

    await query(
      `UPDATE clients SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), new Date().toISOString(), id],
    );
  }

  static async restore(id: string) {
    await query(
      `UPDATE clients SET is_active = 1, deleted_at = NULL, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  }
}
