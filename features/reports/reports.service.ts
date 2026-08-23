import { countRows, query, queryOne } from "@/lib/turso/client";

interface ActivityLogDbRow {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
}

export class ReportsService {
  static async getProjectReport(projectId: string) {
    const [project, totalTasks, completedTasks] = await Promise.all([
      queryOne<Record<string, unknown>>(
        `SELECT * FROM projects WHERE id = ? LIMIT 1`,
        [projectId],
      ),
      countRows(`SELECT COUNT(*) AS total FROM tasks WHERE project_id = ?`, [projectId]),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks WHERE project_id = ? AND status = 'Completed'`,
        [projectId],
      ),
    ]);

    return {
      project,
      totalTasks,
      completedTasks,
      completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  static async getActivityLogs(entity: string, entityId: string, limit = 20) {
    const rows = await query<ActivityLogDbRow>(
      `SELECT al.*, u.first_name AS user_first_name, u.last_name AS user_last_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.entity = ? AND al.entity_id = ?
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [entity, entityId, limit],
    );

    return rows.map<Record<string, unknown>>(({ user_first_name, user_last_name, ...log }) => ({
      ...log,
      users:
        user_first_name !== null && user_last_name !== null
          ? { first_name: user_first_name, last_name: user_last_name }
          : null,
    }));
  }
}
