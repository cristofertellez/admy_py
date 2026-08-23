import { countRows, query } from "@/lib/turso/client";
import { clientScope, projectScope, requireScopedUser } from "@/lib/auth-scope";
import type { SessionProfile } from "@/lib/auth";

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

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  loginsToday: number;
  loginsThisWeek: number;
}

export interface RoleDistributionItem {
  name: string;
  userCount: number;
}

export interface RecentLogin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_name: string;
  last_login: string;
}

export interface AdminOverview {
  users: AdminUserStats;
  roleDistribution: RoleDistributionItem[];
  recentLogins: RecentLogin[];
  platform: DashboardStats;
}

export class DashboardService {
  static async getStats(user?: SessionProfile): Promise<DashboardStats> {
    const actor = user ?? (await requireScopedUser());

    if (actor.role === "Developer") {
      return DashboardService.getDeveloperStats();
    }

    return DashboardService.getScopedStats();
  }

  private static async getScopedStats(): Promise<DashboardStats> {
    const clientClause = await clientScope("id");
    const projectClause = await projectScope("p.id");
    const taskClause = await projectScope("t.project_id");

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
      countRows(
        `SELECT COUNT(*) AS total FROM clients WHERE deleted_at IS NULL AND ${clientClause.sql}`,
        clientClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM clients WHERE deleted_at IS NULL AND is_active = 1 AND ${clientClause.sql}`,
        clientClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p WHERE p.deleted_at IS NULL AND ${projectClause.sql}`,
        projectClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p
         WHERE p.deleted_at IS NULL AND p.is_active = 1 AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
           AND ${projectClause.sql}`,
        projectClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p WHERE p.deleted_at IS NULL AND p.status = 'Completed' AND ${projectClause.sql}`,
        projectClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'Pending' AND ${taskClause.sql}`,
        taskClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'In Progress' AND ${taskClause.sql}`,
        taskClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'Blocked' AND ${taskClause.sql}`,
        taskClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'Completed' AND ${taskClause.sql}`,
        taskClause.args,
      ),
    ]);

    const hours = await query<ProjectHoursRow>(
      `SELECT p.estimated_hours, p.worked_hours, p.completion_percentage
       FROM projects p
       WHERE p.deleted_at IS NULL AND ${projectClause.sql}`,
      projectClause.args,
    );

    return DashboardService.buildStats({
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      completedTasks,
      hours,
    });
  }

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

    return DashboardService.buildStats({
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      completedTasks,
      hours,
    });
  }

  private static buildStats(input: {
    totalClients: number;
    activeClients: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    pendingTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    completedTasks: number;
    hours: ProjectHoursRow[];
  }): DashboardStats {
    const { hours, ...counts } = input;

    const totalEstimatedHours = hours.reduce((sum, p) => sum + (p.estimated_hours || 0), 0);
    const totalWorkedHours = hours.reduce((sum, p) => sum + (p.worked_hours || 0), 0);
    const avgCount = hours.length || 1;
    const progressSum = hours.reduce((sum, p) => sum + (p.completion_percentage || 0), 0);
    const averageProgress = progressSum / avgCount;

    return {
      ...counts,
      inactiveClients: counts.totalClients - counts.activeClients,
      delayedProjects: 0,
      totalEstimatedHours,
      totalWorkedHours,
      averageProgress,
    };
  }

  static async getAdminOverview(): Promise<AdminOverview> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      platform,
      totalUsers,
      activeUsers,
      loginsToday,
      loginsThisWeek,
      roleRows,
      recentLogins,
    ] = await Promise.all([
      DashboardService.getDeveloperStats(),
      countRows(`SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL`),
      countRows(`SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL AND is_active = 1`),
      countRows(
        `SELECT COUNT(*) AS total FROM activity_logs WHERE action = 'logged_in' AND created_at >= ?`,
        [startOfToday.toISOString()],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM activity_logs WHERE action = 'logged_in' AND created_at >= ?`,
        [weekAgo.toISOString()],
      ),
      query<{ name: string; user_count: number }>(
        `SELECT r.name, COUNT(u.id) AS user_count
         FROM roles r
         LEFT JOIN users u ON u.role_id = r.id AND u.deleted_at IS NULL AND u.is_active = 1
         WHERE r.deleted_at IS NULL
         GROUP BY r.id, r.name
         ORDER BY user_count DESC, r.name ASC`,
      ),
      query<RecentLogin>(
        `SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role_name, u.last_login
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.deleted_at IS NULL AND u.last_login IS NOT NULL
         ORDER BY u.last_login DESC
         LIMIT 8`,
      ),
    ]);

    return {
      users: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        loginsToday,
        loginsThisWeek,
      },
      roleDistribution: roleRows.map((row) => ({ name: row.name, userCount: row.user_count })),
      recentLogins,
      platform,
    };
  }
}
