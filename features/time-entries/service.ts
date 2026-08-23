import { assertTaskVisible, projectScope, requireScopedUser } from "@/lib/auth-scope";
import { newId, query, queryOne } from "@/lib/turso/client";

interface TimeEntryAuthorColumns {
  author_first_name: string | null;
  author_last_name: string | null;
}

interface TimeEntryTaskColumns {
  entry_task_title: string | null;
  entry_task_project_id: string | null;
}

export class TimeEntriesService {
  static async listByTask(taskId: string) {
    const scope = await projectScope("t.project_id");
    const rows = await query<Record<string, unknown> & TimeEntryAuthorColumns>(
      `SELECT te.*, u.first_name AS author_first_name, u.last_name AS author_last_name
       FROM time_entries te
       JOIN tasks t ON t.id = te.task_id
       LEFT JOIN users u ON u.id = te.user_id
       WHERE te.task_id = ? AND t.deleted_at IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY te.date DESC`,
      [taskId, ...scope.args],
    );

    return rows.map(({ author_first_name, author_last_name, ...entry }) => ({
      ...entry,
      users:
        author_first_name != null
          ? { first_name: author_first_name, last_name: author_last_name ?? "" }
          : null,
    }));
  }

  static async listByUser(userId: string) {
    const scope = await projectScope("t.project_id");
    const rows = await query<Record<string, unknown> & TimeEntryTaskColumns>(
      `SELECT te.*, t.title AS entry_task_title, t.project_id AS entry_task_project_id
       FROM time_entries te
       JOIN tasks t ON t.id = te.task_id
       WHERE te.user_id = ? AND t.deleted_at IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY te.date DESC`,
      [userId, ...scope.args],
    );

    return rows.map(({ entry_task_title, entry_task_project_id, ...entry }) => ({
      ...entry,
      tasks:
        entry_task_title != null
          ? { title: entry_task_title, project_id: entry_task_project_id ?? null }
          : null,
    }));
  }

  static async create(input: {
    task_id: string;
    user_id: string;
    date: string;
    start_time?: string;
    end_time?: string;
    total_hours: number;
    description?: string;
  }) {
    await assertTaskVisible(input.task_id);

    const id = newId();
    await query(
      `INSERT INTO time_entries (id, task_id, user_id, date, start_time, end_time, total_hours, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.task_id,
        input.user_id,
        input.date,
        input.start_time ?? null,
        input.end_time ?? null,
        input.total_hours,
        input.description ?? null,
      ],
    );

    return queryOne("SELECT * FROM time_entries WHERE id = ?", [id]);
  }

  static async update(id: string, input: {
    total_hours?: number;
    description?: string;
    start_time?: string;
    end_time?: string;
  }) {
    const existing = await queryOne<{ task_id: string }>(
      "SELECT task_id FROM time_entries WHERE id = ?",
      [id],
    );
    if (!existing) throw new Error("Time entry not found.");

    await assertTaskVisible(existing.task_id);

    const entries = Object.entries(input).filter(([, value]) => value !== undefined);
    const assignments = [...entries.map(([key]) => `${key} = ?`), "updated_at = ?"];
    await query(`UPDATE time_entries SET ${assignments.join(", ")} WHERE id = ?`, [
      ...entries.map(([, value]) => value),
      new Date().toISOString(),
      id,
    ]);

    return queryOne("SELECT * FROM time_entries WHERE id = ?", [id]);
  }

  static async remove(id: string) {
    const user = await requireScopedUser();
    const existing = await queryOne<{ task_id: string; user_id: string }>(
      "SELECT task_id, user_id FROM time_entries WHERE id = ?",
      [id],
    );
    if (!existing) return true;

    if (user.role !== "Developer" && existing.user_id !== user.id) {
      throw new Error("You can only delete your own time entries.");
    }

    await assertTaskVisible(existing.task_id);
    await query("DELETE FROM time_entries WHERE id = ?", [id]);
    return true;
  }
}
