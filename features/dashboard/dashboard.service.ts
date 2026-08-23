import { countRows, query } from "@/lib/turso/client";

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  pendingTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completedTasks: number;
  totalEstimatedHours: number;
  totalWorkedHours: number;
  averageProgress: number;
}

interface ProjectHoursRow {
  estimated_hours: number | null;
  worked_hours: number | null;
  completion_percentage: number | null;
}

export class DashboardService {
  static async getDeveloperStats(): Promise<DashboardStats> {
    const [
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      completedTasks,
    ] = await Promise.all([
      countRows(`SELECT COUNT(*) AS total FROM clients`),
      countRows(`SELECT COUNT(*) AS total FROM clients WHERE is_active = 1`),
      countRows(`SELECT COUNT(*) AS total FROM projects`),
      countRows(
        `SELECT COUNT(*) AS total FROM projects
         WHERE is_active = 1 AND status NOT IN ('Completed', 'Cancelled', 'Archived')`,
      ),
      countRows(`SELECT COUNT(*) AS total FROM projects WHERE status = 'Completed'`),
      countRows(`SELECT COUNT(*) AS total FROM tasks WHERE status = 'Pending'`),
      countRows(`SELECT COUNT(*) AS total FROM tasks WHERE status = 'In Progress'`),
      countRows(`SELECT COUNT(*) AS total FROM tasks WHERE status = 'Blocked'`),
      countRows(`SELECT COUNT(*) AS total FROM tasks WHERE status = 'Completed'`),
    ]);

    const hours = await query<ProjectHoursRow>(
      `SELECT estimated_hours, worked_hours, completion_percentage FROM projects`,
    );

    const totalEstimatedHours = hours.reduce((sum, p) => sum + (p.estimated_hours || 0), 0);
    const totalWorkedHours = hours.reduce((sum, p) => sum + (p.worked_hours || 0), 0);
    const avgCount = hours.length || 1;
    const progressSum = hours.reduce((sum, p) => sum + (p.completion_percentage || 0), 0);
    const averageProgress = progressSum / avgCount;

    return {
      totalClients,
      activeClients,
      inactiveClients: totalClients - activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects: 0,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      completedTasks,
      totalEstimatedHours,
      totalWorkedHours,
      averageProgress,
    };
  }
}
