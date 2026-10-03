import { query, queryOne, newId, type InValue } from "@/lib/turso/client";
import {
  assertMilestoneVisible,
  assertProjectVisible,
  assertTaskVisible,
  projectScope,
} from "@/lib/auth-scope";
import type { Milestone } from "@/types";
import { ACCESS_AUDIT_ACTIONS, type ActivityLog } from "@/features/activity";
import type {
  MilestoneListFilters,
  MilestoneProjectTask,
  MilestoneSummary,
  MilestoneWithStats,
  UpcomingMilestone,
} from "./milestones.types";

// Access audit events are global-only and never part of the milestone history.
function accessAuditExclusion(): { sql: string; args: InValue[] } {
  return {
    sql: `al.action NOT IN (${ACCESS_AUDIT_ACTIONS.map(() => "?").join(", ")})`,
    args: [...ACCESS_AUDIT_ACTIONS],
  };
}

const TASK_AGGREGATE_SELECT = `
  COUNT(t.id) AS task_count,
  COALESCE(SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed_tasks,
  COALESCE(SUM(t.estimated_hours), 0) AS estimated_hours_sum,
  COALESCE(SUM(t.worked_hours), 0) AS worked_hours_sum
`;

function mapMilestone<T extends Milestone>(row: T): T {
  return { ...row, is_active: Number(row.is_active) === 1 };
}

/**
 * Historia 8.1 — Administración de hitos.
 * Task aggregates are resolved in the same query (LEFT JOIN + GROUP BY) so the
 * list endpoint never triggers N+1 per-milestone task lookups.
 */
export class MilestonesService {
  static async listByProject(
    projectId: string,
    filters: MilestoneListFilters = {},
  ): Promise<MilestoneWithStats[]> {
    await assertProjectVisible(projectId);

    const conditions = ["m.project_id = ?", "m.deleted_at IS NULL", "m.is_active = 1"];
    const args: InValue[] = [projectId];

    if (filters.search) {
      conditions.push("(LOWER(m.title) LIKE LOWER(?) OR LOWER(COALESCE(m.description, '')) LIKE LOWER(?))");
      args.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.status) {
      conditions.push("m.status = ?");
      args.push(filters.status);
    }

    const rows = await query<MilestoneWithStats>(
      `SELECT m.*, ${TASK_AGGREGATE_SELECT}
       FROM milestones m
       LEFT JOIN tasks t ON t.milestone_id = m.id AND t.deleted_at IS NULL AND t.is_active = 1
       WHERE ${conditions.join(" AND ")}
       GROUP BY m.id
       ORDER BY m.sort_order ASC, m.created_at ASC`,
      args,
    );

    return rows.map(mapMilestone);
  }

  static async getById(id: string): Promise<MilestoneWithStats> {
    const row = await queryOne<MilestoneWithStats>(
      `SELECT m.*, ${TASK_AGGREGATE_SELECT}
       FROM milestones m
       LEFT JOIN tasks t ON t.milestone_id = m.id AND t.deleted_at IS NULL AND t.is_active = 1
       WHERE m.id = ? AND m.deleted_at IS NULL
       GROUP BY m.id
       LIMIT 1`,
      [id],
    );

    if (!row) throw new Error("Milestone not found.");
    await assertProjectVisible(row.project_id);

    return mapMilestone(row);
  }

  // Quick indicators for the milestones header (total/completed/in-progress/overdue).
  static async getProjectSummary(projectId: string): Promise<MilestoneSummary> {
    await assertProjectVisible(projectId);

    const today = new Date().toISOString().slice(0, 10);
    const row = await queryOne<MilestoneSummary & { in_progress: number }>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN m.status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed,
              COALESCE(SUM(CASE WHEN m.status = 'In Progress' THEN 1 ELSE 0 END), 0) AS in_progress,
              COALESCE(SUM(CASE WHEN m.status NOT IN ('Completed', 'Cancelled')
                   AND m.estimated_date IS NOT NULL AND m.estimated_date < ?
                 THEN 1 ELSE 0 END), 0) AS overdue
       FROM milestones m
       WHERE m.project_id = ? AND m.deleted_at IS NULL AND m.is_active = 1`,
      [today, projectId],
    );

    return {
      total: row?.total ?? 0,
      completed: row?.completed ?? 0,
      inProgress: row?.in_progress ?? 0,
      overdue: row?.overdue ?? 0,
    };
  }

  static async create(
    input: Omit<Milestone, "id" | "created_at" | "updated_at" | "completed_date">,
  ): Promise<Milestone> {
    await assertProjectVisible(input.project_id);

    const { sort_order, ...rest } = input;
    const nextOrder = sort_order ?? (await this.nextSortOrder(input.project_id));

    const id = newId();
    const entries = Object.entries(rest).filter(([, value]) => value !== undefined);
    const columns = ["id", "sort_order", ...entries.map(([key]) => key)];
    const placeholders = columns.map(() => "?").join(", ");
    const args: InValue[] = [id, nextOrder, ...entries.map(([, value]) => value as InValue)];

    await query(`INSERT INTO milestones (${columns.join(", ")}) VALUES (${placeholders})`, args);

    const row = await queryOne<Milestone>("SELECT * FROM milestones WHERE id = ?", [id]);
    return mapMilestone(row!);
  }

  // New milestones are appended after the last visible sibling so the default
  // timeline order matches the creation order without explicit input.
  private static async nextSortOrder(projectId: string): Promise<number> {
    const row = await queryOne<{ next: number | null }>(
      "SELECT MAX(sort_order) + 1 AS next FROM milestones WHERE project_id = ? AND deleted_at IS NULL",
      [projectId],
    );
    return row?.next ?? 0;
  }

  static async update(id: string, input: Partial<Milestone>): Promise<Milestone> {
    await assertMilestoneVisible(id);

    const entries = Object.entries(input).filter(([, value]) => value !== undefined);
    const assignments = [...entries.map(([key]) => `${key} = ?`), "updated_at = ?"];
    const args: InValue[] = [
      ...entries.map(([, value]) => value as InValue),
      new Date().toISOString(),
      id,
    ];

    await query(`UPDATE milestones SET ${assignments.join(", ")} WHERE id = ?`, args);

    const row = await queryOne<Milestone>("SELECT * FROM milestones WHERE id = ?", [id]);
    return mapMilestone(row!);
  }

  static async archive(id: string): Promise<void> {
    await assertMilestoneVisible(id);

    const now = new Date().toISOString();
    await query(
      "UPDATE milestones SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?",
      [now, now, id],
    );
  }

  static async restore(id: string): Promise<void> {
    await assertMilestoneVisible(id);

    await query("UPDATE milestones SET is_active = 1, deleted_at = NULL, updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      id,
    ]);
  }

  // Swaps the milestone with its neighbour and renumbers the whole list so the
  // sort order stays explicit and stable (same contract as subtask reordering).
  static async moveMilestone(projectId: string, milestoneId: string, direction: "up" | "down") {
    if (direction !== "up" && direction !== "down") {
      throw new Error("Invalid move direction.");
    }

    await assertProjectVisible(projectId);

    const siblings = await query<{ id: string }>(
      `SELECT id FROM milestones
       WHERE project_id = ? AND deleted_at IS NULL AND is_active = 1
       ORDER BY sort_order ASC, created_at ASC`,
      [projectId],
    );

    const ids = siblings.map((sibling) => sibling.id);
    const index = ids.indexOf(milestoneId);
    if (index === -1) throw new Error("Milestone not found.");

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;

    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];

    const now = new Date().toISOString();
    for (let i = 0; i < ids.length; i++) {
      await query("UPDATE milestones SET sort_order = ?, updated_at = ? WHERE id = ?", [
        i,
        now,
        ids[i],
      ]);
    }
  }

  // Historia 8.5 — Asignación de tareas: link a task to a milestone. The task
  // must belong to the same project; moving is a reassignment of this link.
  static async assignTaskToMilestone(milestoneId: string, taskId: string): Promise<void> {
    const milestone = await this.getById(milestoneId);

    const task = await queryOne<{ project_id: string }>(
      "SELECT project_id FROM tasks WHERE id = ? AND deleted_at IS NULL",
      [taskId],
    );
    if (!task) throw new Error("Task not found.");
    await assertTaskVisible(taskId);

    if (task.project_id !== milestone.project_id) {
      throw new Error("The task does not belong to this project.");
    }

    await query("UPDATE tasks SET milestone_id = ?, updated_at = ? WHERE id = ?", [
      milestoneId,
      new Date().toISOString(),
      taskId,
    ]);
  }

  // Detaches the task from its milestone; returns the previous milestone id so
  // callers can revalidate and audit the right entity.
  static async removeTaskFromMilestone(taskId: string): Promise<string | null> {
    await assertTaskVisible(taskId);

    const task = await queryOne<{ milestone_id: string | null }>(
      "SELECT milestone_id FROM tasks WHERE id = ? AND deleted_at IS NULL",
      [taskId],
    );
    if (!task || !task.milestone_id) return null;

    await assertMilestoneVisible(task.milestone_id);

    await query("UPDATE tasks SET milestone_id = NULL, updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      taskId,
    ]);

    return task.milestone_id;
  }

  static async listProjectTasksForAssignment(projectId: string): Promise<MilestoneProjectTask[]> {
    await assertProjectVisible(projectId);

    const scope = await projectScope("t.project_id");

    const rows = await query<MilestoneProjectTask>(
      `SELECT t.id, t.title, t.status, t.priority, t.milestone_id, m.title AS milestone_title
       FROM tasks t
       LEFT JOIN milestones m ON m.id = t.milestone_id
       WHERE t.project_id = ? AND t.deleted_at IS NULL AND t.is_active = 1
         AND t.parent_task_id IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY t.position ASC, t.created_at ASC`,
      [projectId, ...scope.args],
    );

    return rows;
  }

  // Recent business events on the project's milestones (Historia 8.3),
  // resolved with a single scoped query for the whole milestones page; access
  // audit events are excluded from change histories by contract (4.7 / 5.5).
  static async getProjectHistory(projectId: string, limit = 10): Promise<ActivityLog[]> {
    await assertProjectVisible(projectId);
    const exclusion = accessAuditExclusion();

    return query<ActivityLog>(
      `SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.old_value, al.new_value,
              al.created_at, u.first_name AS user_first_name, u.last_name AS user_last_name
       FROM activity_logs al
       JOIN milestones m ON m.id = al.entity_id AND m.project_id = ?
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.entity = 'Milestone' AND m.deleted_at IS NULL AND ${exclusion.sql}
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [projectId, ...exclusion.args, limit],
    );
  }

  /**
   * Upcoming milestones across every project visible to the current user.
   * Shared by the role dashboards (Historias 8.10/8.11/11.2/11.3) through the
   * project scope fragment, so authorization stays at the data layer.
   */
  static async getUpcomingForScope(limit = 6, projectId?: string): Promise<UpcomingMilestone[]> {
    const scope = await projectScope("p.id");

    return query<UpcomingMilestone>(
      `SELECT m.id, m.title, m.status, m.estimated_date, m.completion_percentage,
              p.id AS project_id, p.name AS project_name, c.company_name AS client_name
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN clients c ON c.id = p.client_id
       WHERE m.deleted_at IS NULL AND m.is_active = 1
         AND p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
         AND m.status NOT IN ('Completed', 'Cancelled')
         AND m.estimated_date IS NOT NULL${scope.sql ? ` AND ${scope.sql}` : ""}
         ${projectId ? "AND m.project_id = ?" : ""}
       ORDER BY m.estimated_date ASC
       LIMIT ?`,
      projectId ? [...scope.args, projectId, limit] : [...scope.args, limit],
    );
  }

  /**
   * Historia 8.8 — dependency CRUD between milestones with cycle
   * validation, mirroring the task dependency flow.
   */
  static async getDependencies(milestoneId: string) {
    const predecessors = await query<{
      id: string;
      dependency_type: string;
      created_at: string;
      dep_id: string;
      dep_title: string;
      dep_status: string;
      dep_estimated_date: string | null;
    }>(
      `SELECT d.id, d.dependency_type, d.created_at,
              m.id AS dep_id, m.title AS dep_title, m.status AS dep_status,
              m.estimated_date AS dep_estimated_date
       FROM milestone_dependencies d
       JOIN milestones m ON m.id = d.depends_on_milestone_id
       WHERE d.milestone_id = ?
       ORDER BY d.created_at ASC`,
      [milestoneId],
    );

    const successors = await query<{
      id: string;
      dependency_type: string;
      created_at: string;
      dep_id: string;
      dep_title: string;
      dep_status: string;
      dep_estimated_date: string | null;
    }>(
      `SELECT d.id, d.dependency_type, d.created_at,
              m.id AS dep_id, m.title AS dep_title, m.status AS dep_status,
              m.estimated_date AS dep_estimated_date
       FROM milestone_dependencies d
       JOIN milestones m ON m.id = d.milestone_id
       WHERE d.depends_on_milestone_id = ?
       ORDER BY d.created_at ASC`,
      [milestoneId],
    );

    const mapRow = (row: (typeof predecessors)[number]) => ({
      id: row.id,
      dependency_type: row.dependency_type,
      created_at: row.created_at,
      milestone: {
        id: row.dep_id,
        title: row.dep_title,
        status: row.dep_status,
        estimated_date: row.dep_estimated_date,
      },
    });

    return {
      predecessors: predecessors.map(mapRow),
      successors: successors.map(mapRow),
    };
  }

  /** All dependencies of a project's milestones in one query (batch UI). */
  static async getProjectDependencies(projectId: string) {
    const rows = await query<{
      id: string;
      milestone_id: string;
      depends_on_milestone_id: string;
      dependency_type: string;
      from_title: string;
      to_title: string;
    }>(
      `SELECT d.id, d.milestone_id, d.depends_on_milestone_id, d.dependency_type,
              m1.title AS from_title, m2.title AS to_title
       FROM milestone_dependencies d
       JOIN milestones m1 ON m1.id = d.milestone_id
       JOIN milestones m2 ON m2.id = d.depends_on_milestone_id
       WHERE m1.project_id = ? AND m2.project_id = ?
       ORDER BY d.created_at ASC`,
      [projectId, projectId],
    );
    return rows;
  }

  private static async assertNoDependencyCycle(
    milestoneId: string,
    dependsOnMilestoneId: string,
  ): Promise<void> {
    const visited = new Set<string>();
    const queue = [dependsOnMilestoneId];

    while (queue.length > 0) {
      const current = queue.pop() as string;
      if (current === milestoneId) {
        throw new Error("This dependency would create a circular chain.");
      }
      if (visited.has(current)) continue;
      visited.add(current);

      const next = await query<{ depends_on_milestone_id: string }>(
        "SELECT depends_on_milestone_id FROM milestone_dependencies WHERE milestone_id = ?",
        [current],
      );
      queue.push(...next.map((row) => row.depends_on_milestone_id));
    }
  }

  static async addMilestoneDependency(
    milestoneId: string,
    dependsOnMilestoneId: string,
    dependencyType = "Finish to Start",
  ) {
    await assertMilestoneVisible(milestoneId);
    await assertMilestoneVisible(dependsOnMilestoneId);

    const duplicate = await queryOne<{ id: string }>(
      `SELECT id FROM milestone_dependencies
       WHERE milestone_id = ? AND depends_on_milestone_id = ? LIMIT 1`,
      [milestoneId, dependsOnMilestoneId],
    );
    if (duplicate) throw new Error("This dependency already exists.");

    await MilestonesService.assertNoDependencyCycle(milestoneId, dependsOnMilestoneId);

    const id = newId();
    await query(
      `INSERT INTO milestone_dependencies (id, milestone_id, depends_on_milestone_id, dependency_type)
       VALUES (?, ?, ?, ?)`,
      [id, milestoneId, dependsOnMilestoneId, dependencyType],
    );

    return queryOne("SELECT * FROM milestone_dependencies WHERE id = ?", [id]);
  }

  static async removeMilestoneDependency(id: string): Promise<string | null> {
    const dependency = await queryOne<{ milestone_id: string }>(
      "SELECT milestone_id FROM milestone_dependencies WHERE id = ?",
      [id],
    );
    if (!dependency) throw new Error("Dependency not found.");

    await assertMilestoneVisible(dependency.milestone_id);
    await query("DELETE FROM milestone_dependencies WHERE id = ?", [id]);

    return dependency.milestone_id;
  }

  static async getAvailableMilestonesForDependency(milestoneId: string, projectId: string) {
    const existing = await query<{ depends_on_milestone_id: string }>(
      "SELECT depends_on_milestone_id FROM milestone_dependencies WHERE milestone_id = ?",
      [milestoneId],
    );
    const excludeIds = [milestoneId, ...existing.map((d) => d.depends_on_milestone_id)];
    const placeholders = excludeIds.map(() => "?").join(", ");

    return query<{ id: string; title: string; status: string; estimated_date: string | null }>(
      `SELECT id, title, status, estimated_date
       FROM milestones
       WHERE project_id = ? AND deleted_at IS NULL AND is_active = 1
         AND id NOT IN (${placeholders})
       ORDER BY sort_order ASC`,
      [projectId, ...excludeIds],
    );
  }

  /**
   * Historia 7.15 — milestone deliveries inside a calendar month,
   * respecting the caller's project visibility scope.
   */
  static async getCalendarMilestones(
    year: number,
    month: number,
    projectId?: string,
  ): Promise<UpcomingMilestone[]> {
    const scope = await projectScope("p.id");
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

    return query<UpcomingMilestone>(
      `SELECT m.id, m.title, m.status, m.estimated_date, m.completion_percentage,
              p.id AS project_id, p.name AS project_name, c.company_name AS client_name
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN clients c ON c.id = p.client_id
       WHERE m.deleted_at IS NULL AND m.is_active = 1
         AND p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
         AND m.estimated_date LIKE ?${projectId ? " AND m.project_id = ?" : ""}${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY m.estimated_date ASC`,
      projectId
        ? [`${monthPrefix}%`, projectId, ...scope.args]
        : [`${monthPrefix}%`, ...scope.args],
    );
  }
}
