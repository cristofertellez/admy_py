import { assertProjectVisible, assertTaskVisible, projectScope } from "@/lib/auth-scope";
import { countRows, newId, query, queryOne, type InValue } from "@/lib/turso/client";
import type { Task } from "@/types";
import { ACCESS_AUDIT_ACTIONS, type ActivityLog } from "@/features/activity";
import type { TaskFilters, TaskWithFullRelations, TaskWithRelations } from "./tasks.types";

// Access audit events are global-only and never part of the task history.
function accessAuditExclusion(): { sql: string; args: InValue[] } {
  return {
    sql: `al.action NOT IN (${ACCESS_AUDIT_ACTIONS.map(() => "?").join(", ")})`,
    args: [...ACCESS_AUDIT_ACTIONS],
  };
}

interface TaskListRow extends Task {
  project_name: string | null;
  assignee_first_name: string | null;
  assignee_last_name: string | null;
}

interface DependencyRow {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: string;
  dep_id: string;
  dep_title: string;
  dep_status: string;
  dep_project_id: string;
}

// Whitelist of columns the list endpoint may sort by (Historia 7.1). Exposed
// so route handlers can validate the URL `sort` parameter against it.
export const TASK_SORTABLE_COLUMNS: Record<string, string> = {
  position: "t.position",
  title: "t.title",
  status: "t.status",
  priority: "t.priority",
  created_at: "t.created_at",
  updated_at: "t.updated_at",
  estimated_start: "t.estimated_start",
  estimated_end: "t.estimated_end",
};

const SORTABLE_COLUMNS = TASK_SORTABLE_COLUMNS;

function mapTask<T extends Task>(row: T): T {
  return { ...row, is_active: Number(row.is_active) === 1 };
}

export class TasksService {
  static async list(filters: TaskFilters = {}) {
    const scope = await projectScope("t.project_id");
    const {
      search,
      projectId,
      assignedTo,
      status,
      priority,
      archived,
      page = 1,
      pageSize = 20,
      sortBy = "position",
      sortOrder = "asc",
    } = filters;

    const visibility = archived
      ? ["t.deleted_at IS NOT NULL", "t.is_active = 0"]
      : ["t.deleted_at IS NULL", "t.is_active = 1"];
    const conditions = [...visibility, ...(scope.sql ? [scope.sql] : [])];
    const args: InValue[] = [...(scope.sql ? scope.args : [])];

    if (search) {
      // Historia 7.21 — global search matches title, description, assignee,
      // project, status, priority and tags in a single predicate.
      const pattern = `%${search.toLowerCase()}%`;
      conditions.push(
        `(LOWER(t.title) LIKE ?
          OR LOWER(COALESCE(t.description, '')) LIKE ?
          OR LOWER(t.status) LIKE ?
          OR LOWER(t.priority) LIKE ?
          OR LOWER(COALESCE(p.name, '')) LIKE ?
          OR LOWER(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) LIKE ?
          OR EXISTS (
            SELECT 1 FROM task_tags tt
            JOIN tags tg ON tg.id = tt.tag_id
            WHERE tt.task_id = t.id AND LOWER(tg.name) LIKE ?
          ))`,
      );
      args.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }
    if (projectId) {
      conditions.push("t.project_id = ?");
      args.push(projectId);
    }
    if (assignedTo) {
      conditions.push("t.assigned_to = ?");
      args.push(assignedTo);
    }
    if (status) {
      conditions.push("t.status = ?");
      args.push(status);
    }
    if (priority) {
      conditions.push("t.priority = ?");
      args.push(priority);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const orderBy = SORTABLE_COLUMNS[sortBy] ?? SORTABLE_COLUMNS.position;
    const direction = sortOrder === "desc" ? "DESC" : "ASC";
    const offset = (page - 1) * pageSize;

    const total = await countRows(
      `SELECT COUNT(*) AS total FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       ${where}`,
      args,
    );

    const rows = await query<TaskListRow>(
      `SELECT t.*, p.name AS project_name,
              u.first_name AS assignee_first_name, u.last_name AS assignee_last_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       ${where}
       ORDER BY ${orderBy} ${direction}
       LIMIT ? OFFSET ?`,
      [...args, pageSize, offset],
    );

    return {
      data: rows.map((row) => this.toTaskWithRelations(row)),
      total,
      page,
      pageSize,
    };
  }

  private static toTaskWithRelations(row: TaskListRow): TaskWithRelations {
    const { assignee_first_name, assignee_last_name, ...task } = row;
    return {
      ...mapTask(task),
      projects: task.project_name != null ? { name: task.project_name } : null,
      users:
        assignee_first_name != null
          ? { first_name: assignee_first_name, last_name: assignee_last_name ?? null }
          : null,
    } as unknown as TaskWithRelations;
  }

  private static async getTaskWithRelations(id: string): Promise<TaskWithFullRelations> {
    const scope = await projectScope("t.project_id");
    const row = await queryOne<TaskListRow>(
      `SELECT t.*, p.name AS project_name,
              u.first_name AS assignee_first_name, u.last_name AS assignee_last_name
       FROM tasks t
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.id = ? AND t.deleted_at IS NULL AND t.is_active = 1${scope.sql ? ` AND ${scope.sql}` : ""}`,
      [id, ...scope.args],
    );

    if (!row) throw new Error("Task not found.");

    const task = this.toTaskWithRelations(row);
    const [project, assignee, milestone] = await Promise.all([
      queryOne<Record<string, unknown>>("SELECT * FROM projects WHERE id = ?", [task.project_id]),
      task.assigned_to
        ? queryOne<Record<string, unknown>>("SELECT * FROM users WHERE id = ?", [task.assigned_to])
        : Promise.resolve(null),
      task.milestone_id
        ? queryOne<Record<string, unknown>>("SELECT * FROM milestones WHERE id = ?", [task.milestone_id])
        : Promise.resolve(null),
    ]);

    return { ...task, projects: project ?? undefined, users: assignee ?? undefined, milestones: milestone ?? undefined };
  }
  static async getById(id: string) {
    return this.getTaskWithRelations(id);
  }

  static async create(input: Omit<Task, "id" | "created_at" | "updated_at">) {
    await assertProjectVisible(input.project_id);

    const id = newId();
    const entries = Object.entries(input).filter(([, value]) => value !== undefined);
    const columns = ["id", ...entries.map(([key]) => key)];
    const placeholders = columns.map(() => "?").join(", ");
    const args: InValue[] = [id, ...entries.map(([, value]) => value as InValue)];

    await query(
      `INSERT INTO tasks (${columns.join(", ")}) VALUES (${placeholders})`,
      args,
    );

    const row = await queryOne<Task>("SELECT * FROM tasks WHERE id = ?", [id]);
    return mapTask(row!);
  }

  static async update(id: string, input: Partial<Task>) {
    await assertTaskVisible(id);

    const entries = Object.entries(input).filter(([, value]) => value !== undefined);
    const assignments = [...entries.map(([key]) => `${key} = ?`), "updated_at = ?"];
    const args: InValue[] = [
      ...entries.map(([, value]) => value as InValue),
      new Date().toISOString(),
      id,
    ];

    await query(`UPDATE tasks SET ${assignments.join(", ")} WHERE id = ?`, args);

    const row = await queryOne<Task>("SELECT * FROM tasks WHERE id = ?", [id]);
    return mapTask(row!);
  }

  static async archive(id: string) {
    await assertTaskVisible(id);

    const now = new Date().toISOString();
    await query("UPDATE tasks SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);
  }

  static async restore(id: string) {
    await assertTaskVisible(id);

    await query("UPDATE tasks SET is_active = 1, deleted_at = NULL, updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      id,
    ]);
  }

  // Change history of a task (Historia 7.3): audit events recorded on the task
  // itself, newest first, with the same pagination contract as client history.
  static async getHistory(taskId: string, filters: { page?: number; pageSize?: number } = {}) {
    await assertTaskVisible(taskId);

    const { page = 1, pageSize = 20 } = filters;
    const exclusion = accessAuditExclusion();

    const total = await countRows(
      `SELECT COUNT(*) AS total
       FROM activity_logs al
       WHERE al.entity = 'Task' AND al.entity_id = ? AND ${exclusion.sql}`,
      [taskId, ...exclusion.args],
    );

    const data = await query<ActivityLog>(
      `SELECT al.id, al.user_id, al.action, al.entity, al.entity_id, al.old_value, al.new_value,
              al.created_at, u.first_name AS user_first_name, u.last_name AS user_last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.entity = 'Task' AND al.entity_id = ? AND ${exclusion.sql}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [taskId, ...exclusion.args, pageSize, (page - 1) * pageSize],
    );

    return { data, total, page, pageSize };
  }

  static async getSubtasks(parentTaskId: string) {
    const scope = await projectScope("t.project_id");
    const rows = await query<
      Task & { assignee_first_name: string | null; assignee_last_name: string | null }
    >(
      `SELECT t.*, u.first_name AS assignee_first_name, u.last_name AS assignee_last_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.parent_task_id = ? AND t.is_active = 1 AND t.deleted_at IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY t.position ASC`,
      [parentTaskId, ...scope.args],
    );

    return rows.map(({ assignee_first_name, assignee_last_name, ...task }) =>
      ({
        ...mapTask(task),
        users:
          assignee_first_name != null
            ? { first_name: assignee_first_name, last_name: assignee_last_name ?? null }
            : null,
      }) as unknown as TaskWithRelations,
    );
  }

  // Swaps the subtask with its neighbour and renumbers the whole sibling list
  // so legacy rows sharing position 0 end up with a stable explicit order.
  static async moveSubtask(parentTaskId: string, subtaskId: string, direction: "up" | "down") {
    if (direction !== "up" && direction !== "down") {
      throw new Error("Invalid move direction.");
    }

    await assertTaskVisible(parentTaskId);

    const scope = await projectScope("t.project_id");
    const siblings = await query<{ id: string }>(
      `SELECT t.id FROM tasks t
       WHERE t.parent_task_id = ? AND t.is_active = 1 AND t.deleted_at IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY t.position ASC, t.created_at ASC`,
      [parentTaskId, ...scope.args],
    );

    const ids = siblings.map((sibling) => sibling.id);
    const index = ids.indexOf(subtaskId);
    if (index === -1) throw new Error("Subtask not found.");

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;

    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];

    const now = new Date().toISOString();
    for (let i = 0; i < ids.length; i++) {
      await query("UPDATE tasks SET position = ?, updated_at = ? WHERE id = ?", [
        i,
        now,
        ids[i],
      ]);
    }
  }

  static async getWithSubtasks(id: string) {
    const task = await this.getTaskWithRelations(id);
    const [subtasks, dependencies] = await Promise.all([
      this.getSubtasks(id),
      this.getDependencies(id),
    ]);

    return { ...task, subtasks, dependencies };
  }

  static async getDependencies(taskId: string) {
    const scope = await projectScope("dt.project_id");
    const rows = await query<DependencyRow>(
      `SELECT d.*, dt.id AS dep_id, dt.title AS dep_title, dt.status AS dep_status, dt.project_id AS dep_project_id
       FROM task_dependencies d
       JOIN tasks dt ON dt.id = d.depends_on_task_id
       WHERE d.task_id = ?${scope.sql ? ` AND ${scope.sql}` : ""}`,
      [taskId, ...scope.args],
    );

    return rows.map(({ dep_id, dep_title, dep_status, dep_project_id, ...dependency }) => ({
      ...dependency,
      depends_on: { id: dep_id, title: dep_title, status: dep_status, project_id: dep_project_id },
    }));
  }

  /**
   * Historia 7.9 — validates that adding `dependsOnTaskId` does not create
   * a dependency cycle. Walks the graph starting from the proposed
   * predecessor; if the target task is reachable, the link is circular.
   */
  private static async assertNoDependencyCycle(taskId: string, dependsOnTaskId: string): Promise<void> {
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const current = queue.pop() as string;
      if (current === taskId) {
        throw new Error("This dependency would create a circular chain.");
      }
      if (visited.has(current)) continue;
      visited.add(current);

      const next = await query<{ depends_on_task_id: string }>(
        "SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?",
        [current],
      );
      queue.push(...next.map((row) => row.depends_on_task_id));
    }
  }

  static async addDependency(taskId: string, dependsOnTaskId: string, dependencyType = "Finish to Start") {
    await assertTaskVisible(taskId);
    await assertTaskVisible(dependsOnTaskId);

    const duplicate = await queryOne<{ id: string }>(
      "SELECT id FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ? LIMIT 1",
      [taskId, dependsOnTaskId],
    );
    if (duplicate) throw new Error("This dependency already exists.");

    await TasksService.assertNoDependencyCycle(taskId, dependsOnTaskId);

    const id = newId();
    await query(
      "INSERT INTO task_dependencies (id, task_id, depends_on_task_id, dependency_type) VALUES (?, ?, ?, ?)",
      [id, taskId, dependsOnTaskId, dependencyType],
    );

    return queryOne("SELECT * FROM task_dependencies WHERE id = ?", [id]);
  }

  /**
   * Historia 7.9 — open dependencies that still block a task from being
   * completed. Only unfinished predecessors are returned.
   */
  static async getUnfinishedDependencies(taskId: string) {
    return query<{ id: string; title: string; status: string }>(
      `SELECT dt.id, dt.title, dt.status
       FROM task_dependencies d
       JOIN tasks dt ON dt.id = d.depends_on_task_id
       WHERE d.task_id = ? AND dt.status NOT IN ('Completed', 'Cancelled')`,
      [taskId],
    );
  }

  static async removeDependency(id: string): Promise<string | null> {
    const dependency = await queryOne<{ task_id: string }>(
      "SELECT task_id FROM task_dependencies WHERE id = ?",
      [id],
    );
    if (!dependency) throw new Error("Dependency not found.");

    await assertTaskVisible(dependency.task_id);
    await query("DELETE FROM task_dependencies WHERE id = ?", [id]);

    return dependency.task_id;
  }

  static async getAvailableTasksForDependency(taskId: string, projectId: string) {
    const scope = await projectScope("t.project_id");
    const existing = await query<{ depends_on_task_id: string }>(
      "SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?",
      [taskId],
    );

    const excludeIds = [taskId, ...existing.map((d) => d.depends_on_task_id)];
    const placeholders = excludeIds.map(() => "?").join(", ");

    const rows = await query<{ id: string; title: string; status: string; project_id: string }>(
      `SELECT id, title, status, project_id
       FROM tasks t
       WHERE t.project_id = ? AND t.is_active = 1 AND t.deleted_at IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}
         AND t.id NOT IN (${placeholders})
       ORDER BY t.title ASC`,
      [projectId, ...scope.args, ...excludeIds],
    );

    return rows;
  }
}
