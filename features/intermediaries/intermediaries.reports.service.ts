import { query, queryOne } from "@/lib/turso/client";
import { getUser, hasPermission } from "@/lib/auth";

export const FINALIZED_PROJECT_STATUSES = "'Completed', 'Cancelled', 'Archived'";

export interface IntermediaryReportProject {
  id: string;
  name: string;
  status: string;
  priority: string;
  completion_percentage: number | null;
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  estimated_hours: number | null;
  worked_hours: number | null;
  client_name: string;
}

export interface IntermediaryReportClient {
  id: string;
  company_name: string;
  status: string;
  is_active: number;
  active_projects: number;
  completed_projects: number;
}

export interface UpcomingDelivery {
  id: string;
  type: "Milestone" | "Project";
  title: string;
  project_name: string | null;
  due_date: string;
}

interface IntermediaryProductivity {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  estimatedHours: number;
  workedHours: number;
  hourUtilizationRate: number;
}

interface IntermediaryReportSummary {
  activeProjects: number;
  completedProjects: number;
  totalClients: number;
  activeClients: number;
  productivity: IntermediaryProductivity;
}

export interface IntermediaryReport {
  intermediary: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  summary: IntermediaryReportSummary;
  projects: IntermediaryReportProject[];
  clients: IntermediaryReportClient[];
  upcomingDeliveries: UpcomingDelivery[];
}

interface ProjectRow {
  id: string;
  name: string;
  status: string;
  priority: string;
  completion_percentage: number | null;
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  estimated_hours: number | null;
  worked_hours: number | null;
  client_name: string;
}

function num(value: unknown): number {
  return Number(value ?? 0);
}

/**
 * Portfolio report for one intermediary (Historia 5.12).
 * All queries are scoped by the clients assigned to the intermediary,
 * mirroring the visibility rules in lib/auth-scope.ts.
 */
export class IntermediaryReportsService {
  static async getReport(intermediaryId: string): Promise<IntermediaryReport> {
    const intermediary = await queryOne<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      role_name: string;
    }>(
      `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.deleted_at IS NULL LIMIT 1`,
      [intermediaryId],
    );

    if (!intermediary) throw new Error("Intermediary not found.");
    if (intermediary.role_name !== "Intermediary") {
      throw new Error("Reports are only available for intermediary accounts.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [projects, clients, taskStatusRows, hoursRow, milestoneDeliveries, projectDeliveries] =
      await Promise.all([
        query<ProjectRow>(
          `SELECT p.id, p.name, p.status, p.priority, p.completion_percentage,
                  p.estimated_start_date, p.estimated_end_date, p.estimated_hours, p.worked_hours,
                  c.company_name AS client_name
           FROM projects p
           JOIN clients c ON c.id = p.client_id
           WHERE c.intermediary_id = ?
             AND c.deleted_at IS NULL AND c.is_active = 1
             AND p.deleted_at IS NULL
           ORDER BY CASE WHEN p.status IN (${FINALIZED_PROJECT_STATUSES}) THEN 1 ELSE 0 END,
                    p.estimated_end_date ASC`,
          [intermediaryId],
        ),
        query<IntermediaryReportClient>(
          `SELECT c.id, c.company_name, c.status, c.is_active,
                  COALESCE(SUM(CASE WHEN p.id IS NOT NULL AND p.deleted_at IS NULL
                        AND p.status NOT IN (${FINALIZED_PROJECT_STATUSES}) THEN 1 ELSE 0 END), 0) AS active_projects,
                  COALESCE(SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed_projects
           FROM clients c
           LEFT JOIN projects p ON p.client_id = c.id
           WHERE c.intermediary_id = ? AND c.deleted_at IS NULL
           GROUP BY c.id, c.company_name, c.status, c.is_active
           ORDER BY c.company_name ASC`,
          [intermediaryId],
        ),
        query<{ status: string; total: number }>(
          `SELECT t.status, COUNT(*) AS total
           FROM tasks t
           JOIN projects p ON p.id = t.project_id
           JOIN clients c ON c.id = p.client_id
           WHERE c.intermediary_id = ?
             AND c.deleted_at IS NULL AND c.is_active = 1
             AND p.deleted_at IS NULL AND t.deleted_at IS NULL
           GROUP BY t.status`,
          [intermediaryId],
        ),
        queryOne<{ estimated_hours: number | null; worked_hours: number | null }>(
          `SELECT COALESCE(SUM(p.estimated_hours), 0) AS estimated_hours,
                  COALESCE(SUM(p.worked_hours), 0) AS worked_hours
           FROM projects p
           JOIN clients c ON c.id = p.client_id
           WHERE c.intermediary_id = ?
             AND c.deleted_at IS NULL AND c.is_active = 1 AND p.deleted_at IS NULL`,
          [intermediaryId],
        ),
        query<UpcomingDeliveryRaw>(
          `SELECT m.id, m.title, m.estimated_date AS due_date, m.status, p.name AS project_name
           FROM milestones m
           JOIN projects p ON p.id = m.project_id
           JOIN clients c ON c.id = p.client_id
           WHERE c.intermediary_id = ?
             AND c.deleted_at IS NULL AND c.is_active = 1
             AND p.deleted_at IS NULL AND m.deleted_at IS NULL AND m.is_active = 1
             AND m.status NOT IN ('Completed', 'Cancelled')
             AND m.estimated_date IS NOT NULL
             AND m.estimated_date >= ? AND m.estimated_date <= ?`,
          [intermediaryId, today, horizon],
        ),
        query<UpcomingDeliveryRaw>(
          `SELECT p.id, p.name AS title, p.estimated_end_date AS due_date, p.status, NULL AS project_name
           FROM projects p
           JOIN clients c ON c.id = p.client_id
           WHERE c.intermediary_id = ?
             AND c.deleted_at IS NULL AND c.is_active = 1
             AND p.deleted_at IS NULL AND p.is_active = 1
             AND p.status NOT IN (${FINALIZED_PROJECT_STATUSES})
             AND p.estimated_end_date IS NOT NULL
             AND p.estimated_end_date >= ? AND p.estimated_end_date <= ?`,
          [intermediaryId, today, horizon],
        ),
      ]);

    const tasksByStatus = new Map(taskStatusRows.map((row) => [row.status, num(row.total)]));
    const totalTasks = taskStatusRows.reduce((sum, row) => sum + num(row.total), 0);
    const completedTasks = tasksByStatus.get("Completed") ?? 0;

    const estimatedHours = num(hoursRow?.estimated_hours);
    const workedHours = num(hoursRow?.worked_hours);

    const deliveries = [
      ...milestoneDeliveries.map((row) => ({
        id: row.id,
        type: "Milestone" as const,
        title: row.title,
        project_name: row.project_name,
        due_date: row.due_date,
        status: row.status,
      })),
      ...projectDeliveries.map((row) => ({
        id: row.id,
        type: "Project" as const,
        title: row.title,
        project_name: null,
        due_date: row.due_date,
        status: row.status,
      })),
    ]
      .sort((a, b) => (a.due_date > b.due_date ? 1 : -1))
      .map(({ status: _status, ...delivery }) => delivery);

    const activeProjects = projects.filter(
      (p) => !["Completed", "Cancelled", "Archived"].includes(p.status),
    ).length;
    const completedProjects = projects.filter((p) => p.status === "Completed").length;

    return {
      intermediary: {
        id: intermediary.id,
        first_name: intermediary.first_name,
        last_name: intermediary.last_name,
        email: intermediary.email,
      },
      summary: {
        activeProjects,
        completedProjects,
        totalClients: clients.length,
        activeClients: clients.filter((c) => c.is_active === 1).length,
        productivity: {
          totalTasks,
          pendingTasks: tasksByStatus.get("Pending") ?? 0,
          inProgressTasks: tasksByStatus.get("In Progress") ?? 0,
          blockedTasks: tasksByStatus.get("Blocked") ?? 0,
          completedTasks,
          taskCompletionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
          estimatedHours,
          workedHours,
          hourUtilizationRate: estimatedHours ? Math.round((workedHours / estimatedHours) * 100) : 0,
        },
      },
      projects,
      clients: clients.map((c) => ({
        ...c,
        is_active: num(c.is_active),
        active_projects: num(c.active_projects),
        completed_projects: num(c.completed_projects),
      })),
      upcomingDeliveries: deliveries,
    };
  }

  /** Authorization for viewing/exporting an intermediary report. */
  static async assertCanAccessReport(intermediaryId: string): Promise<void> {
    const user = await getUser();
    if (!user) throw new Error("Unauthorized.");

    if (user.id === intermediaryId) return;
    if (hasPermission(user, "intermediaries.read")) return;

    throw new Error("You do not have access to this report.");
  }
}

interface UpcomingDeliveryRaw {
  id: string;
  title: string;
  project_name: string | null;
  due_date: string;
  status: string;
}
