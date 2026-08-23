import { query, queryOne, countRows, newId, type InValue } from "@/lib/turso/client";
import { assertProjectVisible, projectScope } from "@/lib/auth-scope";
import type { Project } from "@/types";
import type { ProjectFilters, ProjectWithRelations } from "./projects.types";

const SORTABLE_COLUMNS = new Set(["created_at", "updated_at", "name", "status", "priority"]);

function toBoolean(row: Record<string, unknown>): Project {
  return {
    ...(row as unknown as Project),
    is_active: !!row.is_active,
  };
}

function buildSetClause(input: Record<string, unknown>): { set: string[]; args: InValue[] } {
  const allowedColumns = [
    "code",
    "name",
    "description",
    "client_id",
    "intermediary_id",
    "status",
    "priority",
    "estimated_start_date",
    "estimated_end_date",
    "real_start_date",
    "real_end_date",
    "estimated_hours",
    "worked_hours",
    "completion_percentage",
    "budget",
    "visibility",
    "notes",
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

export class ProjectsService {
  static async list(filters: ProjectFilters = {}) {
    const {
      search,
      status,
      clientId,
      intermediaryId,
      priority,
      page = 1,
      pageSize = 20,
      sortBy = "created_at",
      sortOrder = "desc",
    } = filters;

    const conditions: string[] = [];
    const args: InValue[] = [];

    if (search) {
      conditions.push("(lower(p.name) LIKE ? OR lower(p.description) LIKE ?)");
      const pattern = `%${search.toLowerCase()}%`;
      args.push(pattern, pattern);
    }
    if (status) {
      conditions.push("p.status = ?");
      args.push(status);
    }
    if (clientId) {
      conditions.push("p.client_id = ?");
      args.push(clientId);
    }
    if (intermediaryId) {
      conditions.push("p.intermediary_id = ?");
      args.push(intermediaryId);
    }
    if (priority) {
      conditions.push("p.priority = ?");
      args.push(priority);
    }

    const scope = await projectScope("p.id");
    if (scope.sql) {
      conditions.push(scope.sql);
      args.push(...scope.args);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : "created_at";
    const direction = sortOrder === "asc" ? "ASC" : "DESC";

    const total = await countRows(
      `SELECT COUNT(*) AS total FROM projects p ${where}`,
      args,
    );

    const rows = await query<Record<string, unknown>>(
      `SELECT p.*, c.company_name AS client_company_name, u.first_name AS intermediary_first_name, u.last_name AS intermediary_last_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN users u ON u.id = p.intermediary_id
       ${where}
       ORDER BY p.${sortColumn} ${direction}
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    return {
      data: rows.map((row) => ({
        ...toBoolean(row),
        clients: row.client_company_name
          ? { company_name: row.client_company_name }
          : null,
        users: row.intermediary_first_name
          ? { first_name: row.intermediary_first_name, last_name: row.intermediary_last_name }
          : null,
      })) as unknown as ProjectWithRelations[],
      total,
      page,
      pageSize,
    };
  }

  static async getById(id: string) {
    const project = await queryOne<Record<string, unknown>>(
      `SELECT p.*,
              c.id AS client_id_ref, c.company_name, c.contact_name, c.email AS client_email,
              c.phone AS client_phone, c.address, c.country, c.city, c.website, c.logo AS client_logo,
              u.id AS user_id_ref, u.first_name, u.last_name, u.email AS intermediary_email, u.phone AS user_phone
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN users u ON u.id = p.intermediary_id
       WHERE p.id = ?
       LIMIT 1`,
      [id],
    );

    if (!project) throw new Error("Project not found.");
    await assertProjectVisible(id);

    return {
      ...toBoolean(project),
      clients: project.client_id_ref
        ? {
            id: project.client_id_ref,
            company_name: project.company_name,
            contact_name: project.contact_name,
            email: project.client_email,
            phone: project.client_phone,
            address: project.address,
            country: project.country,
            city: project.city,
            website: project.website,
            logo: project.client_logo,
          }
        : null,
      users: project.user_id_ref
        ? {
            id: project.user_id_ref,
            first_name: project.first_name,
            last_name: project.last_name,
            email: project.intermediary_email,
            phone: project.user_phone,
          }
        : null,
    } as unknown as ProjectWithRelations;
  }

  static async create(input: Omit<Project, "id" | "created_at" | "updated_at">) {
    const id = newId();

    await query(
      `INSERT INTO projects (
        id, code, name, description, client_id, intermediary_id, status, priority,
        estimated_start_date, estimated_end_date, real_start_date, real_end_date,
        estimated_hours, worked_hours, completion_percentage, budget, visibility, notes,
        created_by, updated_by, deleted_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.code ?? null,
        input.name,
        input.description ?? null,
        input.client_id,
        input.intermediary_id ?? null,
        input.status,
        input.priority,
        input.estimated_start_date ?? null,
        input.estimated_end_date ?? null,
        input.real_start_date ?? null,
        input.real_end_date ?? null,
        input.estimated_hours ?? 0,
        input.worked_hours ?? 0,
        input.completion_percentage ?? 0,
        input.budget ?? null,
        input.visibility,
        input.notes ?? null,
        input.created_by ?? null,
        input.updated_by ?? null,
        input.deleted_at ?? null,
        input.is_active ? 1 : 0,
      ],
    );

    return ProjectsService.getById(id) as Promise<Project>;
  }

  static async update(id: string, input: Partial<Project>) {
    const { set, args } = buildSetClause({ ...input, updated_at: new Date().toISOString() });

    if (set.length > 0) {
      await query(`UPDATE projects SET ${set.join(", ")} WHERE id = ?`, [...args, id]);
    }

    return ProjectsService.getById(id) as Promise<Project>;
  }

  static async archive(id: string) {
    await query(
      `UPDATE projects SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), new Date().toISOString(), id],
    );
  }

  static async restore(id: string) {
    await query(
      `UPDATE projects SET is_active = 1, deleted_at = NULL, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  }
}
