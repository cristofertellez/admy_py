import { query, queryOne, countRows, newId, type InValue } from "@/lib/turso/client";
import { assertProjectVisible, projectScope } from "@/lib/auth-scope";
import { ACCESS_AUDIT_ACTIONS, type ActivityLog } from "@/features/activity";
import { TagsService } from "@/features/tags";
import type { Project } from "@/types";
import type {
  ProjectFilters,
  ProjectWithRelations,
  ProjectMember,
  ProjectMemberCandidate,
  ProjectHistoryFilters,
  ProjectHistoryResult,
} from "./projects.types";
import { PROJECT_HISTORY_ACTIONS } from "./projects.types";

const SORTABLE_COLUMNS = new Set([
  "created_at",
  "updated_at",
  "name",
  "status",
  "priority",
  "estimated_end_date",
]);

// A project cannot be archived while work remains open (Historia 6.11).
const CLOSED_TASK_STATUSES = ["Completed", "Cancelled"];

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
      isActive,
      tagId,
      page = 1,
      pageSize = 20,
      sortBy = "created_at",
      sortOrder = "desc",
    } = filters;

    const conditions: string[] = [];
    const args: InValue[] = [];

    if (search) {
      conditions.push(
        "(lower(p.name) LIKE ? OR lower(p.code) LIKE ? OR lower(p.description) LIKE ? OR lower(c.company_name) LIKE ?)",
      );
      const pattern = `%${search.toLowerCase()}%`;
      args.push(pattern, pattern, pattern, pattern);
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
    if (isActive !== undefined) {
      conditions.push("p.is_active = ?");
      args.push(isActive ? 1 : 0);
    }
    if (tagId) {
      // Tag filter (Historias 6.1 / 6.10): projects carrying the selected tag.
      conditions.push(
        "EXISTS (SELECT 1 FROM project_tags pt WHERE pt.project_id = p.id AND pt.tag_id = ?)",
      );
      args.push(tagId);
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
      `SELECT COUNT(*) AS total
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       ${where}`,
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

    // Tags of the page's projects are resolved in one batched query (Historia
    // 6.10) instead of one lookup per row.
    const tagsByProject = await TagsService.listByProjectIds(
      rows.map((row) => String(row.id)),
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
        tags: tagsByProject.get(String(row.id)) ?? [],
      })) as unknown as ProjectWithRelations[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * Épica 17 (17.10) — resolves a project for CSV imports by name
   * (case-insensitive, exact match), respecting the caller's scope.
   */
  static async findByName(value: string) {
    const scope = await projectScope("p.id");
    const needle = value.trim().toLowerCase();

    const project = await queryOne<Record<string, unknown>>(
      `SELECT p.* FROM projects p
       WHERE p.deleted_at IS NULL AND LOWER(p.name) = ?
       ${scope.sql ? `AND ${scope.sql}` : ""}
       LIMIT 1`,
      [needle, ...scope.args],
    );

    return project ? toBoolean(project) : null;
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

    const tags = await TagsService.listByProject(id);

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
      tags,
    } as unknown as ProjectWithRelations;
  }

  // Business rules for project creation (Historia 6.2): the client must exist,
  // the optional intermediary must be an active Intermediary user and the name
  // must be unique among the client's active projects.
  private static async assertCreateInputValid(input: {
    name: string;
    client_id: string;
    intermediary_id?: string | null;
  }) {
    const client = await queryOne<{ id: string }>(
      "SELECT id FROM clients WHERE id = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1",
      [input.client_id],
    );
    if (!client) throw new Error("The selected client does not exist or is inactive.");

    if (input.intermediary_id) {
      const intermediary = await queryOne<{ id: string }>(
        `SELECT u.id FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = ? AND r.name = 'Intermediary' AND u.deleted_at IS NULL AND u.is_active = 1
         LIMIT 1`,
        [input.intermediary_id],
      );
      if (!intermediary) throw new Error("The selected intermediary is not an active intermediary.");
    }

    const duplicate = await queryOne<{ id: string }>(
      "SELECT id FROM projects WHERE lower(name) = lower(?) AND client_id = ? AND deleted_at IS NULL LIMIT 1",
      [input.name, input.client_id],
    );
    if (duplicate) throw new Error("A project with this name already exists for this client.");
  }

  static async create(input: Omit<Project, "id" | "created_at" | "updated_at">): Promise<ProjectWithRelations> {
    await ProjectsService.assertCreateInputValid(input);

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

    return ProjectsService.getById(id);
  }

  static async update(id: string, input: Partial<Project>): Promise<ProjectWithRelations> {
    const { set, args } = buildSetClause({ ...input, updated_at: new Date().toISOString() });

    if (set.length > 0) {
      await query(`UPDATE projects SET ${set.join(", ")} WHERE id = ?`, [...args, id]);
    }

    return ProjectsService.getById(id);
  }

  // Archiving is blocked while the project still has open work (Historia 6.11):
  // unfinished tasks or milestones must be closed before the project is archived.
  static async getOpenWorkCounts(id: string) {
    const [tasks, milestones] = await Promise.all([
      queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM tasks
         WHERE project_id = ? AND deleted_at IS NULL AND status NOT IN (${CLOSED_TASK_STATUSES.map(() => "?").join(", ")})`,
        [id, ...CLOSED_TASK_STATUSES],
      ),
      queryOne<{ total: number }>(
        "SELECT COUNT(*) AS total FROM milestones WHERE project_id = ? AND deleted_at IS NULL AND status <> 'Completed'",
        [id],
      ),
    ]);

    return { tasks: tasks?.total ?? 0, milestones: milestones?.total ?? 0 };
  }

  static async archive(id: string) {
    const { tasks, milestones } = await ProjectsService.getOpenWorkCounts(id);
    if (tasks > 0 || milestones > 0) {
      const reasons = [
        tasks > 0 ? `${tasks} unfinished ${tasks === 1 ? "task" : "tasks"}` : null,
        milestones > 0
          ? `${milestones} incomplete ${milestones === 1 ? "milestone" : "milestones"}`
          : null,
      ].filter(Boolean);
      throw new Error(`This project cannot be archived while it has ${reasons.join(" and ")}.`);
    }

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

  // Change history for a project (Historias 6.3 / 6.14 / 6.17): business events
  // about the project itself plus events recorded on its comments and files.
  // Access-level audit events (viewed_project, downloaded_file) stay out of the
  // timeline. Search covers the action, the actor and the stored JSON values;
  // category filters map to PROJECT_HISTORY_ACTIONS (Historia 6.14).
  static async getHistory(
    projectId: string,
    filters: ProjectHistoryFilters = {},
  ): Promise<ProjectHistoryResult> {
    await assertProjectVisible(projectId);

    const { search, category, page = 1, pageSize = 20 } = filters;
    const normalizedPage = Math.max(1, page);
    const normalizedPageSize = Math.min(100, Math.max(1, pageSize));

    const scopeSql = `((al.entity = 'Project' AND al.entity_id = ?)
      OR (al.entity = 'Comment' AND EXISTS (
        SELECT 1 FROM project_comments pc WHERE pc.id = al.entity_id AND pc.project_id = ?
      )))`;
    const exclusionSql = `al.action NOT IN (${ACCESS_AUDIT_ACTIONS.map(() => "?").join(", ")})`;

    const filterConditions: string[] = [];
    const filterArgs: InValue[] = [];

    if (category) {
      const actions: readonly string[] = PROJECT_HISTORY_ACTIONS[category];
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

    const whereParts = [`(${scopeSql})`, exclusionSql, ...filterConditions];
    const whereArgs: InValue[] = [projectId, projectId, ...ACCESS_AUDIT_ACTIONS, ...filterArgs];
    const where = `WHERE ${whereParts.join(" AND ")}`;

    const total = await countRows(
      `SELECT COUNT(*) AS total
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}`,
      whereArgs,
    );

    const data = await query<ActivityLog>(
      `SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.old_value, al.new_value,
              al.created_at, u.first_name AS user_first_name, u.last_name AS user_last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereArgs, normalizedPageSize, (normalizedPage - 1) * normalizedPageSize],
    );

    return { data, total, page: normalizedPage, pageSize: normalizedPageSize };
  }

  // Historia 6.7 — Asignación de Responsables. Members are active staff users
  // (Developer or Intermediary roles); clients access projects through their
  // client record instead of project_members.
  private static async assertMemberInputValid(userIds: string[]) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("Select at least one member to assign.");
    }

    for (const userId of userIds) {
      const member = await queryOne<{ id: string }>(
        `SELECT u.id FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = ? AND r.name IN ('Developer', 'Intermediary')
           AND u.deleted_at IS NULL AND u.is_active = 1
         LIMIT 1`,
        [userId],
      );
      if (!member) throw new Error("Only active Developers or Intermediaries can be assigned.");
    }
  }

  static async listMembers(projectId: string): Promise<ProjectMember[]> {
    await assertProjectVisible(projectId);

    const rows = await query<Record<string, unknown>>(
      `SELECT pm.id, pm.user_id, u.first_name, u.last_name, u.email, r.name AS role,
              u.is_active, pm.created_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       JOIN roles r ON r.id = u.role_id
       WHERE pm.project_id = ?
       ORDER BY r.name ASC, u.first_name ASC, u.last_name ASC`,
      [projectId],
    );

    return rows.map((row) => ({
      ...(row as unknown as ProjectMember),
      is_active: !!row.is_active,
    }));
  }

  static async listAvailableMembers(projectId: string): Promise<ProjectMemberCandidate[]> {
    await assertProjectVisible(projectId);

    return query<ProjectMemberCandidate>(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name IN ('Developer', 'Intermediary')
         AND u.deleted_at IS NULL AND u.is_active = 1
         AND u.id NOT IN (SELECT user_id FROM project_members WHERE project_id = ?)
       ORDER BY r.name ASC, u.first_name ASC, u.last_name ASC`,
      [projectId],
    );
  }

  // Already-assigned members are skipped without failing so the multi-select
  // stays idempotent; only genuinely new members are inserted and returned.
  static async assignMembers(
    projectId: string,
    userIds: string[],
    actorId: string | null,
  ): Promise<ProjectMemberCandidate[]> {
    await assertProjectVisible(projectId);
    await ProjectsService.assertMemberInputValid(userIds);

    const uniqueIds = [...new Set(userIds)];
    const existing = await query<{ user_id: string }>(
      `SELECT user_id FROM project_members WHERE project_id = ?
       AND user_id IN (${uniqueIds.map(() => "?").join(", ")})`,
      [projectId, ...uniqueIds],
    );
    const existingIds = new Set(existing.map((row) => row.user_id));
    const toInsert = uniqueIds.filter((id) => !existingIds.has(id));

    if (toInsert.length === 0) return [];

    for (const userId of toInsert) {
      await query(
        `INSERT INTO project_members (id, project_id, user_id, created_by)
         VALUES (?, ?, ?, ?)`,
        [newId(), projectId, userId, actorId],
      );
    }

    return query<ProjectMemberCandidate>(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id IN (${toInsert.map(() => "?").join(", ")})
       ORDER BY r.name ASC, u.first_name ASC`,
      toInsert,
    );
  }

  static async removeMember(
    projectId: string,
    userId: string,
  ): Promise<{ user_id: string; name: string } | null> {
    await assertProjectVisible(projectId);

    const current = await queryOne<{ id: string; first_name: string; last_name: string }>(
      `SELECT pm.id, u.first_name, u.last_name
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? AND pm.user_id = ?
       LIMIT 1`,
      [projectId, userId],
    );

    if (!current) return null;

    await query(`DELETE FROM project_members WHERE id = ?`, [current.id]);
    return { user_id: userId, name: `${current.first_name} ${current.last_name}` };
  }
}
