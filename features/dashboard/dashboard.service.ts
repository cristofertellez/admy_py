import { countRows, query, type InValue } from "@/lib/turso/client";
import { clientScope, projectScope, requireScopedUser } from "@/lib/auth-scope";
import type { SessionProfile } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";
import { ActivityLogService, type ActivityLog } from "@/features/activity";
import { MilestonesService, type UpcomingMilestone } from "@/features/milestones";

// Historia 11.12 — global dashboard filters. All values are optional and
// validated against option lists in the page before reaching the service.
export interface DashboardFilters {
  projectId?: string;
  clientId?: string;
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
}

function projectFilterFragment(filters: DashboardFilters, alias = "p"): { sql: string; args: InValue[] } {
  const parts: string[] = [];
  const args: InValue[] = [];
  if (filters.projectId) {
    parts.push(`${alias}.id = ?`);
    args.push(filters.projectId);
  }
  if (filters.clientId) {
    parts.push(`${alias}.client_id = ?`);
    args.push(filters.clientId);
  }
  if (filters.status) {
    parts.push(`${alias}.status = ?`);
    args.push(filters.status);
  }
  if (filters.from) {
    parts.push(`${alias}.estimated_start_date >= ?`);
    args.push(filters.from);
  }
  if (filters.to) {
    parts.push(`${alias}.estimated_end_date <= ?`);
    args.push(filters.to);
  }
  return { sql: parts.join(" AND "), args };
}

function taskFilterFragment(filters: DashboardFilters, alias = "t"): { sql: string; args: InValue[] } {
  const parts: string[] = [];
  const args: InValue[] = [];
  if (filters.projectId) {
    parts.push(`${alias}.project_id = ?`);
    args.push(filters.projectId);
  }
  if (filters.priority) {
    parts.push(`${alias}.priority = ?`);
    args.push(filters.priority);
  }
  if (filters.from) {
    parts.push(`${alias}.estimated_end >= ?`);
    args.push(filters.from);
  }
  if (filters.to) {
    parts.push(`${alias}.estimated_end <= ?`);
    args.push(filters.to);
  }
  return { sql: parts.join(" AND "), args };
}

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

// Historia 11.5 — comments widget model shared by every role dashboard. The
// context link is resolved centrally so panels never duplicate href rules.
export type CommentContextType = "client" | "project" | "milestone" | "task";

export interface RecentCommentItem {
  id: string;
  message: string;
  created_at: string;
  author_first_name: string | null;
  author_last_name: string | null;
  context_type: CommentContextType;
  context_id: string;
  context_title: string;
  project_id: string | null;
}

export function getCommentContextHref(comment: Pick<RecentCommentItem, "context_type" | "context_id" | "project_id">): string | null {
  switch (comment.context_type) {
    case "client":
      return `/dashboard/clients/${comment.context_id}`;
    case "project":
      return `/dashboard/projects/${comment.context_id}`;
    case "milestone":
      return comment.project_id ? `/dashboard/projects/${comment.project_id}/milestones` : null;
    case "task":
      return `/dashboard/tasks/${comment.context_id}`;
  }
}

export interface RecentFileItem {
  id: string;
  filename: string;
  created_at: string;
  project_id: string;
  project_name: string;
}

export interface ProjectStatusCount {
  status: string;
  total: number;
}

export interface DashboardAtRiskProject {
  id: string;
  name: string;
  client_name: string;
  status: string;
  completion_percentage: number;
  overdue_tasks: number;
  blocked_tasks: number;
  overdue_milestones: number;
  hours_overrun: boolean;
  risk: "medium" | "high";
  reasons: string[];
}

export interface DeveloperDashboardData {
  stats: DashboardStats;
  overdueTasks: number;
  upcomingMilestones: UpcomingMilestone[];
  atRiskProjects: DashboardAtRiskProject[];
  statusBreakdown: ProjectStatusCount[];
  recentComments: RecentCommentItem[];
  recentFiles: RecentFileItem[];
  recentActivity: ActivityLog[];
  activeIntermediaries: number;
}

export interface ClientDashboardProject {
  id: string;
  name: string;
  status: string;
  completion_percentage: number;
  estimated_end_date: string | null;
}

export interface ClientDashboardData {
  stats: DashboardStats;
  projects: ClientDashboardProject[];
  upcomingMilestones: UpcomingMilestone[];
  dueSoonProjects: DueSoonProject[];
  recentComments: RecentCommentItem[];
  recentFiles: RecentFileItem[];
}

export interface IntermediaryPanelData {
  stats: IntermediaryPanelStats;
  dueSoonProjects: DueSoonProject[];
  pendingTasks: PendingTaskSummary[];
  recentComments: RecentCommentItem[];
}

interface AtRiskRow {
  id: string;
  name: string;
  status: string;
  completion_percentage: number | null;
  estimated_hours: number | null;
  worked_hours: number | null;
  client_name: string;
  overdue_tasks: number;
  blocked_tasks: number;
  overdue_milestones: number;
}

/**
 * Historia 11.10 — Proyectos en Riesgo. Pure assessment so the thresholds can
 * be reused by reports without re-running the aggregate query.
 */
export function assessAtRiskProject(row: AtRiskRow): DashboardAtRiskProject | null {
  const hoursOverrun = !!row.estimated_hours && row.estimated_hours > 0 && (row.worked_hours || 0) > row.estimated_hours;
  const reasons: string[] = [];

  if (row.overdue_milestones > 0) reasons.push(`${row.overdue_milestones} overdue milestone${row.overdue_milestones === 1 ? "" : "s"}`);
  if (row.overdue_tasks > 0) reasons.push(`${row.overdue_tasks} overdue task${row.overdue_tasks === 1 ? "" : "s"}`);
  if (row.blocked_tasks > 0) reasons.push(`${row.blocked_tasks} blocked task${row.blocked_tasks === 1 ? "" : "s"}`);
  if (hoursOverrun) reasons.push("Hours overrun");

  if (reasons.length === 0) return null;

  const risk: "medium" | "high" =
    row.overdue_milestones > 0 || row.overdue_tasks >= 3 || (hoursOverrun && row.overdue_tasks > 0)
      ? "high"
      : "medium";

  return {
    id: row.id,
    name: row.name,
    client_name: row.client_name,
    status: row.status,
    completion_percentage: row.completion_percentage ?? 0,
    overdue_tasks: row.overdue_tasks,
    blocked_tasks: row.blocked_tasks,
    overdue_milestones: row.overdue_milestones,
    hours_overrun: hoursOverrun,
    risk,
    reasons,
  };
}

export class DashboardService {
  static async getStats(user?: SessionProfile, filters: DashboardFilters = {}): Promise<DashboardStats> {
    const actor = user ?? (await requireScopedUser());

    if (hasFullAccess(actor.role)) {
      return DashboardService.getDeveloperStats(filters);
    }

    return DashboardService.getScopedStats(filters);
  }

  private static async getScopedStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
    const clientClause = await clientScope("id");
    const projectClause = await projectScope("p.id");
    const taskClause = await projectScope("t.project_id");
    const today = new Date().toISOString().slice(0, 10);
    const projectFilter = projectFilterFragment(filters);
    const taskFilter = taskFilterFragment(filters);

    const [
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
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
        `SELECT COUNT(*) AS total FROM projects p WHERE p.deleted_at IS NULL
           AND ${projectClause.sql}${projectFilter.sql ? ` AND (${projectFilter.sql})` : ""}`,
        [...projectClause.args, ...projectFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p
         WHERE p.deleted_at IS NULL AND p.is_active = 1 AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
           AND ${projectClause.sql}${projectFilter.sql ? ` AND (${projectFilter.sql})` : ""}`,
        [...projectClause.args, ...projectFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p WHERE p.deleted_at IS NULL AND p.status = 'Completed'
           AND ${projectClause.sql}${projectFilter.sql ? ` AND (${projectFilter.sql})` : ""}`,
        [...projectClause.args, ...projectFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p
         WHERE p.deleted_at IS NULL AND p.is_active = 1 AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
           AND p.estimated_end_date IS NOT NULL AND p.estimated_end_date < ?
           AND ${projectClause.sql}${projectFilter.sql ? ` AND (${projectFilter.sql})` : ""}`,
        [today, ...projectClause.args, ...projectFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'Pending'
           AND ${taskClause.sql}${taskFilter.sql ? ` AND (${taskFilter.sql})` : ""}`,
        [...taskClause.args, ...taskFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'In Progress'
           AND ${taskClause.sql}${taskFilter.sql ? ` AND (${taskFilter.sql})` : ""}`,
        [...taskClause.args, ...taskFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'Blocked'
           AND ${taskClause.sql}${taskFilter.sql ? ` AND (${taskFilter.sql})` : ""}`,
        [...taskClause.args, ...taskFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t WHERE t.deleted_at IS NULL AND t.status = 'Completed'
           AND ${taskClause.sql}${taskFilter.sql ? ` AND (${taskFilter.sql})` : ""}`,
        [...taskClause.args, ...taskFilter.args],
      ),
    ]);

    const hours = await query<ProjectHoursRow>(
      `SELECT p.estimated_hours, p.worked_hours, p.completion_percentage
       FROM projects p
       WHERE p.deleted_at IS NULL AND ${projectClause.sql}${projectFilter.sql ? ` AND (${projectFilter.sql})` : ""}`,
      [...projectClause.args, ...projectFilter.args],
    );

    return DashboardService.buildStats({
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      completedTasks,
      hours,
    });
  }

  static async getDeveloperStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
    const today = new Date().toISOString().slice(0, 10);
    const projectsFilter = projectFilterFragment(filters, "projects");
    const tasksFilter = taskFilterFragment(filters, "tasks");

    const [
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      pendingTasks,
      inProgressTasks,
      blockedTasks,
      completedTasks,
    ] = await Promise.all([
      countRows(`SELECT COUNT(*) AS total FROM clients WHERE deleted_at IS NULL`),
      countRows(`SELECT COUNT(*) AS total FROM clients WHERE deleted_at IS NULL AND is_active = 1`),
      countRows(
        `SELECT COUNT(*) AS total FROM projects WHERE deleted_at IS NULL${projectsFilter.sql ? ` AND (${projectsFilter.sql})` : ""}`,
        projectsFilter.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects
         WHERE deleted_at IS NULL AND is_active = 1 AND status NOT IN ('Completed', 'Cancelled', 'Archived')
           ${projectsFilter.sql ? `AND (${projectsFilter.sql})` : ""}`,
        projectsFilter.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects WHERE deleted_at IS NULL AND status = 'Completed'
           ${projectsFilter.sql ? `AND (${projectsFilter.sql})` : ""}`,
        projectsFilter.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects
         WHERE deleted_at IS NULL AND is_active = 1 AND status NOT IN ('Completed', 'Cancelled', 'Archived')
            AND estimated_end_date IS NOT NULL AND estimated_end_date < ?
            ${projectsFilter.sql ? `AND (${projectsFilter.sql})` : ""}`,
        [today, ...projectsFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks WHERE deleted_at IS NULL AND status = 'Pending'
           ${tasksFilter.sql ? `AND (${tasksFilter.sql})` : ""}`,
        tasksFilter.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks WHERE deleted_at IS NULL AND status = 'In Progress'
           ${tasksFilter.sql ? `AND (${tasksFilter.sql})` : ""}`,
        tasksFilter.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks WHERE deleted_at IS NULL AND status = 'Blocked'
           ${tasksFilter.sql ? `AND (${tasksFilter.sql})` : ""}`,
        tasksFilter.args,
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks WHERE deleted_at IS NULL AND status = 'Completed'
           ${tasksFilter.sql ? `AND (${tasksFilter.sql})` : ""}`,
        tasksFilter.args,
      ),
    ]);

    const hours = await query<ProjectHoursRow>(
      `SELECT estimated_hours, worked_hours, completion_percentage FROM projects
       WHERE deleted_at IS NULL${projectsFilter.sql ? ` AND (${projectsFilter.sql})` : ""}`,
      projectsFilter.args,
    );

    return DashboardService.buildStats({
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
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
    delayedProjects: number;
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
      totalEstimatedHours,
      totalWorkedHours,
      averageProgress,
    };
  }

  // ============================================================
  // Shared widget queries (Historia 11.5)
  // ============================================================

  // Recent comments across every visible context (client, project, task and
  // milestone conversations) resolved with one scoped query per table.
  private static async fetchRecentComments(limit = 6, filters: DashboardFilters = {}): Promise<RecentCommentItem[]> {
    const projectClause = await projectScope("p.id");
    const taskClause = await projectScope("t.project_id");
    const milestoneClause = await projectScope("m.project_id");
    const clientClause = await clientScope("cc.client_id");
    const projectFilter = projectFilterFragment(filters, "p");
    const taskFilter = taskFilterFragment(filters, "t");
    const milestoneFilter = projectFilterFragment(filters, "m");

    const [projectRows, taskRows, milestoneRows, clientRows] = await Promise.all([
      query<Omit<RecentCommentItem, "context_type"> & { context_type: string }>(
        `SELECT pc.id, pc.message, pc.created_at,
                u.first_name AS author_first_name, u.last_name AS author_last_name,
                'project' AS context_type, p.id AS context_id, p.name AS context_title, p.id AS project_id
         FROM project_comments pc
         JOIN projects p ON p.id = pc.project_id
         LEFT JOIN users u ON u.id = pc.user_id
         WHERE pc.deleted_at IS NULL AND pc.is_active = 1 AND p.deleted_at IS NULL
           ${projectClause.sql ? `AND ${projectClause.sql}` : ""}
           ${projectFilter.sql ? `AND (${projectFilter.sql})` : ""}
         ORDER BY pc.created_at DESC
         LIMIT ?`,
        [...projectClause.args, ...projectFilter.args, limit],
      ),
      query<Omit<RecentCommentItem, "context_type"> & { context_type: string }>(
        `SELECT tc.id, tc.message, tc.created_at,
                u.first_name AS author_first_name, u.last_name AS author_last_name,
                'task' AS context_type, t.id AS context_id, t.title AS context_title, t.project_id
         FROM task_comments tc
         JOIN tasks t ON t.id = tc.task_id
         LEFT JOIN users u ON u.id = tc.user_id
         WHERE tc.deleted_at IS NULL AND tc.is_active = 1 AND t.deleted_at IS NULL
           ${taskClause.sql ? `AND ${taskClause.sql}` : ""}
           ${taskFilter.sql ? `AND (${taskFilter.sql})` : ""}
         ORDER BY tc.created_at DESC
         LIMIT ?`,
        [...taskClause.args, ...taskFilter.args, limit],
      ),
      query<Omit<RecentCommentItem, "context_type"> & { context_type: string }>(
        `SELECT mc.id, mc.message, mc.created_at,
                u.first_name AS author_first_name, u.last_name AS author_last_name,
                'milestone' AS context_type, m.id AS context_id, m.title AS context_title, m.project_id
         FROM milestone_comments mc
         JOIN milestones m ON m.id = mc.milestone_id
         LEFT JOIN users u ON u.id = mc.user_id
         WHERE mc.deleted_at IS NULL AND mc.is_active = 1 AND m.deleted_at IS NULL
           ${milestoneClause.sql ? `AND ${milestoneClause.sql}` : ""}
           ${milestoneFilter.sql ? `AND (${milestoneFilter.sql})` : ""}
         ORDER BY mc.created_at DESC
         LIMIT ?`,
        [...milestoneClause.args, ...milestoneFilter.args, limit],
      ),
      query<Omit<RecentCommentItem, "context_type"> & { context_type: string }>(
        `SELECT cc.id, cc.message, cc.created_at,
                u.first_name AS author_first_name, u.last_name AS author_last_name,
                'client' AS context_type, cc.client_id AS context_id, cl.company_name AS context_title,
                NULL AS project_id
         FROM client_comments cc
         JOIN clients cl ON cl.id = cc.client_id
         LEFT JOIN users u ON u.id = cc.user_id
         WHERE cc.deleted_at IS NULL AND cc.is_active = 1 AND cl.deleted_at IS NULL
           ${clientClause.sql ? `AND ${clientClause.sql}` : ""}
           ${filters.clientId ? "AND cc.client_id = ?" : ""}
         ORDER BY cc.created_at DESC
         LIMIT ?`,
        [...clientClause.args, ...(filters.clientId ? [filters.clientId] : []), limit],
      ),
    ]);

    return [...projectRows, ...taskRows, ...milestoneRows, ...clientRows]
      .map((row) => ({
        ...row,
        context_type: row.context_type as CommentContextType,
      }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit);
  }

  private static async fetchRecentProjectFiles(limit = 5, filters: DashboardFilters = {}): Promise<RecentFileItem[]> {
    const scope = await projectScope("p.id");
    const filter = projectFilterFragment(filters, "p");

    return query<RecentFileItem>(
      `SELECT a.id, a.filename, a.created_at, p.id AS project_id, p.name AS project_name
       FROM attachments a
       JOIN projects p ON p.id = a.entity_id
       WHERE a.entity_type = 'project' AND a.deleted_at IS NULL AND a.is_active = 1
         AND p.deleted_at IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}${filter.sql ? ` AND (${filter.sql})` : ""}
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [...scope.args, ...filter.args, limit],
    );
  }

  // Active projects of the visible portfolio with a delivery date within the
  // next `days` — shared by the client and intermediary panels.
  private static async fetchDueSoonProjects(limit = 6, days = 30, filters: DashboardFilters = {}): Promise<DueSoonProject[]> {
    const scope = await projectScope("p.id");
    const filter = projectFilterFragment(filters, "p");
    const today = new Date().toISOString().slice(0, 10);
    const limitDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return query<DueSoonProject>(
      `SELECT p.id, p.name, p.status, p.completion_percentage, p.estimated_end_date,
              c.company_name AS client_name
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
         AND p.status NOT IN ${FINALIZED_PROJECT_STATUSES}
         AND p.estimated_end_date IS NOT NULL AND p.estimated_end_date >= ? AND p.estimated_end_date <= ?
         ${scope.sql ? `AND ${scope.sql}` : ""}
         ${filter.sql ? `AND (${filter.sql})` : ""}
       ORDER BY p.estimated_end_date ASC
       LIMIT ?`,
      [today, limitDate, ...scope.args, ...filter.args, limit],
    );
  }

  // ============================================================
  // Historia 11.2 — Dashboard del Developer
  // ============================================================

  static async getDeveloperDashboard(filters: DashboardFilters = {}): Promise<DeveloperDashboardData> {
    const today = new Date().toISOString().slice(0, 10);
    const taskFilter = taskFilterFragment(filters, "tasks");
    const projectFilter = projectFilterFragment(filters, "p");

    const [
      stats,
      overdueTasks,
      upcomingMilestones,
      atRiskRows,
      statusBreakdown,
      recentComments,
      recentFiles,
      activity,
      activeIntermediaries,
    ] = await Promise.all([
      DashboardService.getDeveloperStats(filters),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks
         WHERE deleted_at IS NULL AND is_active = 1
           AND status NOT IN ('Completed', 'Cancelled')
           AND estimated_end IS NOT NULL AND estimated_end < ?
           ${taskFilter.sql ? `AND (${taskFilter.sql})` : ""}`,
        [today, ...taskFilter.args],
      ),
      MilestonesService.getUpcomingForScope(6, filters.projectId),
      query<AtRiskRow>(
        `SELECT p.id, p.name, p.status, p.completion_percentage, p.estimated_hours, p.worked_hours,
                c.company_name AS client_name,
                COALESCE(SUM(CASE WHEN t.status NOT IN ('Completed', 'Cancelled')
                     AND t.estimated_end IS NOT NULL AND t.estimated_end < ?
                   THEN 1 ELSE 0 END), 0) AS overdue_tasks,
                COALESCE(SUM(CASE WHEN t.status = 'Blocked' THEN 1 ELSE 0 END), 0) AS blocked_tasks,
                (SELECT COUNT(*) FROM milestones m
                  WHERE m.project_id = p.id AND m.deleted_at IS NULL
                    AND m.status NOT IN ('Completed', 'Cancelled')
                    AND m.estimated_date IS NOT NULL AND m.estimated_date < ?) AS overdue_milestones
         FROM projects p
         JOIN clients c ON c.id = p.client_id
         LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL AND t.is_active = 1
         WHERE p.deleted_at IS NULL AND p.is_active = 1
           AND p.status NOT IN ${FINALIZED_PROJECT_STATUSES}
           ${projectFilter.sql ? `AND (${projectFilter.sql})` : ""}
         GROUP BY p.id
         ORDER BY overdue_milestones DESC, overdue_tasks DESC, blocked_tasks DESC
         LIMIT 24`,
        [today, today, ...projectFilter.args],
      ),
      query<ProjectStatusCount>(
        `SELECT status, COUNT(*) AS total
         FROM projects
         WHERE deleted_at IS NULL AND is_active = 1
           ${projectFilterFragment(filters, "projects").sql ? `AND (${projectFilterFragment(filters, "projects").sql})` : ""}
         GROUP BY status
         ORDER BY total DESC`,
        projectFilterFragment(filters, "projects").args,
      ),
      DashboardService.fetchRecentComments(6, filters),
      DashboardService.fetchRecentProjectFiles(5, filters),
      ActivityLogService.list({ pageSize: 8, entityId: filters.projectId }),
      countRows(
        `SELECT COUNT(*) AS total FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE r.name = 'Intermediary' AND u.deleted_at IS NULL AND u.is_active = 1`,
      ),
    ]);

    const atRiskProjects = atRiskRows
      .map(assessAtRiskProject)
      .filter((project): project is DashboardAtRiskProject => project !== null)
      .slice(0, 6);

    return {
      stats,
      overdueTasks,
      upcomingMilestones,
      atRiskProjects,
      statusBreakdown,
      recentComments,
      recentFiles,
      recentActivity: activity.data,
      activeIntermediaries,
    };
  }

  // ============================================================
  // Historia 11.3 — Dashboard del Cliente
  // ============================================================

  static async getClientDashboard(actor: SessionProfile, filters: DashboardFilters = {}): Promise<ClientDashboardData> {
    if (actor.role !== "Client") {
      throw new Error("Only clients can access this panel.");
    }

    const scope = await projectScope("p.id");
    const projectFilter = projectFilterFragment(filters, "p");

    const [stats, projects, upcomingMilestones, dueSoonProjects, recentComments, recentFiles] =
      await Promise.all([
        DashboardService.getScopedStats(filters),
        query<ClientDashboardProject>(
          `SELECT p.id, p.name, p.status, p.completion_percentage, p.estimated_end_date
           FROM projects p
           WHERE p.deleted_at IS NULL AND p.is_active = 1
           AND p.status NOT IN ${FINALIZED_PROJECT_STATUSES}
              ${scope.sql ? `AND ${scope.sql}` : ""}
              ${projectFilter.sql ? `AND (${projectFilter.sql})` : ""}
           ORDER BY (p.estimated_end_date IS NULL) ASC, p.estimated_end_date ASC
           LIMIT 10`,
          [...scope.args, ...projectFilter.args],
        ),
        MilestonesService.getUpcomingForScope(6, filters.projectId),
        DashboardService.fetchDueSoonProjects(6, 30, filters),
        DashboardService.fetchRecentComments(6, filters),
        DashboardService.fetchRecentProjectFiles(5, filters),
      ]);

    return {
      stats,
      projects,
      upcomingMilestones,
      dueSoonProjects,
      recentComments,
      recentFiles,
    };
  }

  /**
   * Panel exclusivo del rol Intermediary (Historia 5.6 / 11.4). Todos los conteos y
   * listados se resuelven con los fragmentos de alcance (clientScope /
   * projectScope), de modo que la autorización ocurre en la capa de datos.
   */
  static async getIntermediaryPanel(actor: SessionProfile, filters: DashboardFilters = {}): Promise<IntermediaryPanelData> {
    if (actor.role !== "Intermediary") {
      throw new Error("Only intermediaries can access this panel.");
    }

    const clientClause = await clientScope("id");
    const projectClause = await projectScope("p.id");
    const taskClause = await projectScope("t.project_id");
    const projectFilter = projectFilterFragment(filters, "p");
    const taskFilter = taskFilterFragment(filters, "t");

    const [
      totalClients,
      activeClients,
      activeProjects,
      completedProjects,
      pendingTasksCount,
      dueSoonProjects,
      pendingTaskRows,
      recentComments,
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
         WHERE p.deleted_at IS NULL AND p.is_active = 1 AND p.status NOT IN ${FINALIZED_PROJECT_STATUSES}
           AND ${projectClause.sql}${projectFilter.sql ? ` AND (${projectFilter.sql})` : ""}`,
        [...projectClause.args, ...projectFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM projects p
         WHERE p.deleted_at IS NULL AND p.status = 'Completed'
           AND ${projectClause.sql}${projectFilter.sql ? ` AND (${projectFilter.sql})` : ""}`,
        [...projectClause.args, ...projectFilter.args],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM tasks t
         WHERE t.deleted_at IS NULL AND t.status = 'Pending'
           AND ${taskClause.sql}${taskFilter.sql ? ` AND (${taskFilter.sql})` : ""}`,
        [...taskClause.args, ...taskFilter.args],
      ),
      DashboardService.fetchDueSoonProjects(6, 30, filters),
      query<PendingTaskSummary>(
        `SELECT t.id, t.title, t.priority, t.estimated_end, p.name AS project_name
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN clients c ON c.id = p.client_id
         WHERE t.deleted_at IS NULL AND t.status = 'Pending'
           AND p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
           AND ${taskClause.sql}
           ${taskFilter.sql ? `AND (${taskFilter.sql})` : ""}
         ORDER BY (t.estimated_end IS NULL) ASC, t.estimated_end ASC
         LIMIT 6`,
        [...taskClause.args, ...taskFilter.args],
      ),
      DashboardService.fetchRecentComments(6, filters),
    ]);

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

  // ============================================================
  // Historia 11.13 — Dashboard export (ModuleReport shape so the shared
  // export libraries lib/exports + lib/export-pdf can be reused as-is).
  // ============================================================

  static async getDashboardReport(user: SessionProfile, filters: DashboardFilters = {}) {
    const stats = await DashboardService.getStats(user, filters);

    const kpis = [
      { label: "Active Projects", value: stats.activeProjects },
      { label: "Completed Projects", value: stats.completedProjects },
      { label: "Delayed Projects", value: stats.delayedProjects },
      { label: "Pending Tasks", value: stats.pendingTasks },
      { label: "Blocked Tasks", value: stats.blockedTasks },
      { label: "Overdue Tasks", value: "—" },
      { label: "Estimated Hours", value: Math.round(stats.totalEstimatedHours) },
      { label: "Worked Hours", value: Math.round(stats.totalWorkedHours) },
      { label: "Average Progress", value: `${Math.round(stats.averageProgress)}%` },
    ];

    const scope = await projectScope("p.id");
    const projectFilter = projectFilterFragment(filters, "p");
    const rows = await query<{
      id: string;
      name: string;
      status: string;
      completion_percentage: number | null;
      estimated_end_date: string | null;
      estimated_hours: number | null;
      worked_hours: number | null;
      client_name: string;
    }>(
      `SELECT p.id, p.name, p.status, p.completion_percentage, p.estimated_end_date,
              p.estimated_hours, p.worked_hours, c.company_name AS client_name
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL
         ${scope.sql ? `AND ${scope.sql}` : ""}
         ${projectFilter.sql ? `AND (${projectFilter.sql})` : ""}
       ORDER BY p.name ASC
       LIMIT 100`,
      [...scope.args, ...projectFilter.args],
    );

    const overdueTasks = await countRows(
      `SELECT COUNT(*) AS total FROM tasks
       WHERE deleted_at IS NULL AND is_active = 1
         AND status NOT IN ('Completed', 'Cancelled')
         AND estimated_end IS NOT NULL AND estimated_end < ?
         ${filters.projectId ? "AND project_id = ?" : ""}
         ${filters.priority ? "AND priority = ?" : ""}`,
      [
        new Date().toISOString().slice(0, 10),
        ...(filters.projectId ? [filters.projectId] : []),
        ...(filters.priority ? [filters.priority] : []),
      ],
    );
    kpis[5] = { label: "Overdue Tasks", value: overdueTasks };

    return {
      id: "dashboard",
      title: `Dashboard — ${user.role}`,
      kpis,
      table: {
        columns: ["Project", "Client", "Status", "Progress %", "Due Date", "Estimated h", "Worked h"],
        rows: rows.map((row) => [
          row.name,
          row.client_name,
          row.status,
          row.completion_percentage ?? 0,
          row.estimated_end_date ?? "—",
          row.estimated_hours ?? 0,
          row.worked_hours ?? 0,
        ]),
      },
      chart: {
        title: "Tasks by Status",
        type: "bar" as const,
        items: [
          { label: "Pending", value: stats.pendingTasks },
          { label: "In Progress", value: stats.inProgressTasks },
          { label: "Blocked", value: stats.blockedTasks },
          { label: "Completed", value: stats.completedTasks },
        ],
      },
      generatedAt: new Date().toISOString(),
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
