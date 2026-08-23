import { assertProjectVisible, assertTaskVisible, projectScope } from "@/lib/auth-scope";
import { countRows, newId, query, queryOne, type InValue } from "@/lib/turso/client";
import type { Task } from "@/types";
import type { TaskFilters, TaskWithFullRelations, TaskWithRelations } from "./tasks.types";

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

const SORTABLE_COLUMNS: Record<string, string> = {
  position: "t.position",
  title: "t.title",
  status: "t.status",
  priority: "t.priority",
  created_at: "t.created_at",
  updated_at: "t.updated_at",
  estimated_start: "t.estimated_start",
  estimated_end: "t.estimated_end",
};

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
      page = 1,
      pageSize = 20,
      sortBy = "position",
      sortOrder = "asc",
    } = filters;

    const conditions = ["t.deleted_at IS NULL", "t.is_active = 1", ...(scope.sql ? [scope.sql] : [])];
    const args: InValue[] = [...(scope.sql ? scope.args : [])];

    if (search) {
      conditions.push("LOWER(t.title) LIKE LOWER(?)");
      args.push(`%${search}%`);
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

    const total = await countRows(`SELECT COUNT(*) AS total FROM tasks t ${where}`, args);

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

  static async addDependency(taskId: string, dependsOnTaskId: string, dependencyType = "Finish to Start") {
    await assertTaskVisible(taskId);
    await assertTaskVisible(dependsOnTaskId);

    const id = newId();
    await query(
      "INSERT INTO task_dependencies (id, task_id, depends_on_task_id, dependency_type) VALUES (?, ?, ?, ?)",
      [id, taskId, dependsOnTaskId, dependencyType],
    );

    return queryOne("SELECT * FROM task_dependencies WHERE id = ?", [id]);
  }

  static async removeDependency(id: string) {
    const dependency = await queryOne<{ task_id: string }>(
      "SELECT task_id FROM task_dependencies WHERE id = ?",
      [id],
    );
    if (!dependency) throw new Error("Dependency not found.");

    await assertTaskVisible(dependency.task_id);
    await query("DELETE FROM task_dependencies WHERE id = ?", [id]);
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
