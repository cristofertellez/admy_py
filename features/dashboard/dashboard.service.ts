import { countRows, query } from "@/lib/turso/client";
import { clientScope, projectScope, requireScopedUser } from "@/lib/auth-scope";
import type { SessionProfile } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";

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

const FINALIZED_PROJECT_STATUSES = "('Completed', 'Cancelled', 'Archived')";

export interface IntermediaryPanelStats {
  totalClients: number;
  activeClients: number;
  activeProjects: number;
  completedProjects: number;
  dueSoonProjects: number;
  pendingTasks: number;
}

export interface DueSoonProject {
  id: string;
  name: string;
  status: string;
  completion_percentage: number | null;
  estimated_end_date: string;
  client_name: string;
}

export interface PendingTaskSummary {
  id: string;
  title: string;
  priority: string;
  estimated_end: string | null;
  project_name: string;
}

export interface PanelComment {
  id: string;
  message: string;
  created_at: string;
  author_first_name: string | null;
  author_last_name: string | null;
  context_type: "client" | "project";
  context_id: string;
  context_title: string;
}

export interface IntermediaryPanelData {
  stats: IntermediaryPanelStats;
  dueSoonProjects: DueSoonProject[];
  pendingTasks: PendingTaskSummary[];
  recentComments: PanelComment[];
}

export class DashboardService {
  static async getStats(user?: SessionProfile): Promise<DashboardStats> {
    const actor = user ?? (await requireScopedUser());

    if (hasFullAccess(actor.role)) {
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

  /**
   * Panel exclusivo del rol Intermediary (Historia 5.6). Todos los conteos y
   * listados se resuelven con los fragmentos de alcance (clientScope /
   * projectScope), de modo que la autorización ocurre en la capa de datos.
   */
  static async getIntermediaryPanel(actor: SessionProfile): Promise<IntermediaryPanelData> {
    if (actor.role !== "Intermediary") {
      throw new Error("Only intermediaries can access this panel.");
    }

    const clientClause = await clientScope("id");
    const projectClause = await projectScope("p.id");
    const taskClause = await projectScope("t.project_id");
    const projectCommentClause = await projectScope("pc.project_id");

    const today = new Date().toISOString().slice(0, 10);
    const dueSoonLimit = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [
      totalClients,
      activeClients,
      activeProjects,
      completedProjects,
      pendingTasksCount,
      dueSoonProjects,
      pendingTaskRows,
      clientCommentRows,
      projectCommentRows,
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
        `SELECT COUNT(*) AS total FROM projects p
         WHERE p.deleted_at IS NULL AND p.is_active = 1 AND p.status NOT IN (${FINALIZED_PROJECT_STATUSES})
           AND ${projectClause.sql}`,
        projectClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p
         WHERE p.deleted_at IS NULL AND p.status = 'Completed' AND ${projectClause.sql}`,
        projectClause.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t
         WHERE t.deleted_at IS NULL AND t.status = 'Pending' AND ${taskClause.sql}`,
        taskClause.args,
      ),
      query<DueSoonProject>(
        `SELECT p.id, p.name, p.status, p.completion_percentage, p.estimated_end_date,
                c.company_name AS client_name
         FROM projects p
         JOIN clients c ON c.id = p.client_id
         WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
           AND p.status NOT IN (${FINALIZED_PROJECT_STATUSES})
           AND p.estimated_end_date IS NOT NULL AND p.estimated_end_date >= ? AND p.estimated_end_date <= ?
           AND ${projectClause.sql}
         ORDER BY p.estimated_end_date ASC
         LIMIT 6`,
        [today, dueSoonLimit, ...projectClause.args],
      ),
      query<PendingTaskSummary>(
        `SELECT t.id, t.title, t.priority, t.estimated_end, p.name AS project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN clients c ON c.id = p.client_id
         WHERE t.deleted_at IS NULL AND t.status = 'Pending'
           AND p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
           AND ${taskClause.sql}
         ORDER BY (t.estimated_end IS NULL) ASC, t.estimated_end ASC
         LIMIT 6`,
        [...taskClause.args],
      ),
      query<Omit<PanelComment, "context_type"> & { context_type: string }>(
        `SELECT cc.id, cc.message, cc.created_at,
                u.first_name AS author_first_name, u.last_name AS author_last_name,
                'client' AS context_type, c.id AS context_id, c.company_name AS context_title
         FROM client_comments cc
         JOIN clients c ON c.id = cc.client_id
         LEFT JOIN users u ON u.id = cc.user_id
         WHERE cc.deleted_at IS NULL AND cc.is_active = 1
           AND c.deleted_at IS NULL AND c.is_active = 1
           AND ${clientClause.sql}
         ORDER BY cc.created_at DESC
         LIMIT 6`,
        clientClause.args,
      ),
      query<Omit<PanelComment, "context_type"> & { context_type: string }>(
        `SELECT pc.id, pc.message, pc.created_at,
                u.first_name AS author_first_name, u.last_name AS author_last_name,
                'project' AS context_type, p.id AS context_id, p.name AS context_title
         FROM project_comments pc
         JOIN projects p ON p.id = pc.project_id
         JOIN clients c ON c.id = p.client_id
         LEFT JOIN users u ON u.id = pc.user_id
         WHERE pc.deleted_at IS NULL AND pc.is_active = 1
           AND p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
           AND ${projectCommentClause.sql}
         ORDER BY pc.created_at DESC
         LIMIT 6`,
        projectCommentClause.args,
      ),
    ]);

    const recentComments: PanelComment[] = [
      ...clientCommentRows,
      ...projectCommentRows,
    ]
      .map((row) => ({
        ...row,
        context_type: row.context_type === "client" ? ("client" as const) : ("project" as const),
      }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 6);

    return {
      stats: {
        totalClients,
        activeClients,
        activeProjects,
        completedProjects,
        dueSoonProjects: dueSoonProjects.length,
        pendingTasks: pendingTasksCount,
      },
      dueSoonProjects,
      pendingTasks: pendingTaskRows,
      recentComments,
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
