import { query, queryOne, type InValue } from "@/lib/turso/client";
import { clientScope, projectScope, requireScopedUser } from "@/lib/auth-scope";
import { hasFullAccess } from "@/lib/roles";

// ============================================================
// Épica 12 — Centro de Reportes
// Todas las consultas pasan por los scopes de lib/auth-scope, de modo que
// Client/Intermediary solo ven datos de sus proyectos/clientes asignados
// (Historias 12.12 / 12.13 / 12.16) sin lógica duplicada por reporte.
// ============================================================

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  clientId?: string;
  intermediaryId?: string;
  status?: string;
  priority?: string;
  userId?: string;
}

interface ReportKpi {
  label: string;
  value: string | number;
  hint?: string;
}

interface ReportTable {
  columns: string[];
  rows: (string | number)[][];
}

interface ReportChartItem {
  label: string;
  value: number;
}

export interface ModuleReport {
  id: string;
  title: string;
  kpis: ReportKpi[];
  table: ReportTable;
  chart?: { title: string; type: "bar" | "pie" | "line"; items: ReportChartItem[] };
  generatedAt: string;
}

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  { id: "projects", title: "Projects", description: "Status, progress, effort and risk per project.", category: "Operations" },
  { id: "tasks", title: "Tasks", description: "Workload, completion, blockers and delays.", category: "Operations" },
  { id: "milestones", title: "Milestones", description: "Completion, delays and on-time compliance.", category: "Operations" },
  { id: "hours", title: "Hours", description: "Estimated vs. real hours and deviation.", category: "Operations" },
  { id: "clients", title: "Clients", description: "Active clients, project volume and recent activity.", category: "People" },
  { id: "intermediaries", title: "Intermediaries", description: "Assigned clients and projects with average progress.", category: "People" },
  { id: "productivity", title: "Productivity", description: "Delivery trends, hours and deadline compliance.", category: "Performance" },
];

export type ReportId = (typeof REPORT_DEFINITIONS)[number]["id"];

export function isReportId(id: string): id is ReportId {
  return REPORT_DEFINITIONS.some((report) => report.id === id);
}

export interface ReportFilterOptions {
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  intermediaries: { id: string; name: string }[];
}

interface Where {
  conditions: string[];
  args: InValue[];
}

function toWhere(where: Where): string {
  return where.conditions.length > 0 ? `WHERE ${where.conditions.join(" AND ")}` : "";
}

function pushDateRange(where: Where, column: string, filters: ReportFilters) {
  if (filters.dateFrom) {
    where.conditions.push(`${column} >= ?`);
    where.args.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    where.conditions.push(`${column} <= ?`);
    where.args.push(filters.dateTo);
  }
}

function applyProjectFilters(where: Where, filters: ReportFilters) {
  if (filters.projectId) {
    where.conditions.push("p.id = ?");
    where.args.push(filters.projectId);
  }
  if (filters.clientId) {
    where.conditions.push("p.client_id = ?");
    where.args.push(filters.clientId);
  }
  if (filters.intermediaryId) {
    where.conditions.push("p.intermediary_id = ?");
    where.args.push(filters.intermediaryId);
  }
  if (filters.status) {
    where.conditions.push("p.status = ?");
    where.args.push(filters.status);
  }
  if (filters.priority) {
    where.conditions.push("p.priority = ?");
    where.args.push(filters.priority);
  }
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0) || 0;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class ReportCenterService {
  static getCatalog(): ReportDefinition[] {
    return REPORT_DEFINITIONS;
  }

  // Opciones de filtros avanzados (Historia 12.9), siempre limitadas a la
  // visibilidad del usuario autenticado.
  static async getFilterOptions(): Promise<ReportFilterOptions> {
    const user = await requireScopedUser();
    const pScope = await projectScope("p.id");
    const cScope = await clientScope("c.id");

    const projects = await query<{ id: string; name: string }>(
      `SELECT p.id, p.name FROM projects p WHERE p.deleted_at IS NULL
       ${pScope.sql ? `AND ${pScope.sql}` : ""} ORDER BY p.name`,
      pScope.args,
    );
    const clients = hasFullAccess(user.role) || user.role === "Intermediary"
      ? await query<{ id: string; name: string }>(
          `SELECT c.id, c.company_name AS name FROM clients c WHERE c.deleted_at IS NULL
           ${cScope.sql ? `AND ${cScope.sql}` : ""} ORDER BY c.company_name`,
          cScope.args,
        )
      : [];
    const intermediaries = hasFullAccess(user.role)
      ? await query<{ id: string; name: string }>(
          `SELECT id, first_name || ' ' || last_name AS name
           FROM users WHERE role = 'Intermediary' AND is_active = 1 ORDER BY first_name`,
        )
      : [];

    return {
      projects,
      clients: clients.map((c) => ({ id: c.id, name: c.name })),
      intermediaries,
    };
  }

  // ============================================================
  // Historia 12.2 — Reporte de Proyectos
  // ============================================================
  static async getProjectsReport(filters: ReportFilters): Promise<ModuleReport> {
    const scope = await projectScope("p.id");
    const where: Where = { conditions: ["p.deleted_at IS NULL"], args: [] };
    if (scope.sql) {
      where.conditions.push(scope.sql);
      where.args.push(...scope.args);
    }
    applyProjectFilters(where, filters);
    pushDateRange(where, "date(p.created_at)", filters);
    const whereSql = toWhere(where);

    interface ProjectRow {
      code: string | null;
      name: string;
      client_name: string | null;
      status: string;
      priority: string;
      completion_percentage: number;
      estimated_hours: number;
      worked_hours: number;
      estimated_end_date: string | null;
      total_tasks: number;
      completed_tasks: number;
    }

    const rows = await query<ProjectRow>(
      `SELECT p.code, p.name, c.company_name AS client_name, p.status, p.priority,
              p.completion_percentage, p.estimated_hours, p.worked_hours, p.estimated_end_date,
              (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL) AS total_tasks,
              (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL AND t.status = 'Completed') AS completed_tasks
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       ${whereSql}
       ORDER BY p.name`,
      where.args,
    );

    const total = rows.length;
    const active = rows.filter((r) => r.status === "Active").length;
    const completed = rows.filter((r) => r.status === "Completed").length;
    const cancelled = rows.filter((r) => r.status === "Cancelled").length;
    const overdue = rows.filter(
      (r) => r.estimated_end_date && r.estimated_end_date < today() && r.status !== "Completed" && r.status !== "Cancelled",
    ).length;
    const estimatedHours = rows.reduce((sum, r) => sum + num(r.estimated_hours), 0);
    const workedHours = rows.reduce((sum, r) => sum + num(r.worked_hours), 0);
    const avgProgress = total ? Math.round(rows.reduce((sum, r) => sum + num(r.completion_percentage), 0) / total) : 0;

    const byStatus = new Map<string, number>();
    for (const row of rows) byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);

    return {
      id: "projects",
      title: "Projects Report",
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: "Total projects", value: total },
        { label: "Active", value: active },
        { label: "Completed", value: completed },
        { label: "Cancelled", value: cancelled },
        { label: "Avg. progress", value: `${avgProgress}%` },
        { label: "Estimated hours", value: estimatedHours },
        { label: "Worked hours", value: workedHours },
        { label: "At risk (overdue)", value: overdue },
      ],
      table: {
        columns: ["Code", "Project", "Client", "Status", "Priority", "Progress %", "Tasks", "Completed", "Est. hours", "Worked hours", "Deadline"],
        rows: rows.map((r) => [
          r.code ?? "",
          r.name,
          r.client_name ?? "",
          r.status,
          r.priority,
          num(r.completion_percentage),
          num(r.total_tasks),
          num(r.completed_tasks),
          num(r.estimated_hours),
          num(r.worked_hours),
          r.estimated_end_date ?? "",
        ]),
      },
      chart: {
        title: "Projects by status",
        type: "pie",
        items: [...byStatus.entries()].map(([label, value]) => ({ label, value })),
      },
    };
  }

  // ============================================================
  // Historia 12.3 — Reporte de Clientes
  // ============================================================
  static async getClientsReport(filters: ReportFilters): Promise<ModuleReport> {
    await requireScopedUser();
    const cScope = await clientScope("c.id");
    const where: Where = { conditions: ["c.deleted_at IS NULL"], args: [] };
    if (cScope.sql) {
      where.conditions.push(cScope.sql);
      where.args.push(...cScope.args);
    }
    if (filters.clientId) {
      where.conditions.push("c.id = ?");
      where.args.push(filters.clientId);
    }
    if (filters.intermediaryId) {
      where.conditions.push("c.intermediary_id = ?");
      where.args.push(filters.intermediaryId);
    }
    if (filters.status) {
      where.conditions.push("c.status = ?");
      where.args.push(filters.status);
    }
    pushDateRange(where, "date(c.created_at)", filters);

    interface ClientRow {
      company_name: string;
      status: string;
      projects_count: number;
      active_projects: number;
      last_activity: string | null;
    }

    const rows = await query<ClientRow>(
      `SELECT c.company_name, c.status,
              (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.deleted_at IS NULL) AS projects_count,
              (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id AND p.deleted_at IS NULL AND p.status = 'Active') AS active_projects,
              (SELECT MAX(al.created_at) FROM activity_logs al
                JOIN projects p ON p.id = al.entity_id AND al.entity = 'Project'
                WHERE p.client_id = c.id) AS last_activity
       FROM clients c
       ${toWhere(where)}
       ORDER BY c.company_name`,
      where.args,
    );

    const active = rows.filter((r) => r.status === "active").length;

    return {
      id: "clients",
      title: "Clients Report",
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: "Total clients", value: rows.length },
        { label: "Active clients", value: active },
        { label: "Inactive clients", value: rows.length - active },
        { label: "Total projects", value: rows.reduce((sum, r) => sum + num(r.projects_count), 0) },
      ],
      table: {
        columns: ["Client", "Status", "Projects", "Active projects", "Last activity"],
        rows: rows.map((r) => [
          r.company_name,
          r.status,
          num(r.projects_count),
          num(r.active_projects),
          r.last_activity ? r.last_activity.slice(0, 10) : "—",
        ]),
      },
      chart: {
        title: "Clients by status",
        type: "pie",
        items: [
          { label: "Active", value: active },
          { label: "Inactive", value: rows.length - active },
        ],
      },
    };
  }

  // ============================================================
  // Historia 12.4 — Reporte de Intermediarios
  // ============================================================
  static async getIntermediariesReport(filters: ReportFilters): Promise<ModuleReport> {
    const user = await requireScopedUser();
    const where: Where = { conditions: ["u.role = 'Intermediary'", "u.is_active = 1"], args: [] };
    // Un Intermediary solo ve su propio reporte (Historia 12.13).
    if (!hasFullAccess(user.role)) {
      where.conditions.push("u.id = ?");
      where.args.push(user.id);
    } else if (filters.intermediaryId) {
      where.conditions.push("u.id = ?");
      where.args.push(filters.intermediaryId);
    }

    interface IntermediaryRow {
      name: string;
      clients_count: number;
      projects_count: number;
      avg_progress: number;
      completed_projects: number;
    }

    const rows = await query<IntermediaryRow>(
      `SELECT u.first_name || ' ' || u.last_name AS name,
              (SELECT COUNT(*) FROM clients c WHERE c.intermediary_id = u.id AND c.deleted_at IS NULL) AS clients_count,
              (SELECT COUNT(*) FROM projects p WHERE p.intermediary_id = u.id AND p.deleted_at IS NULL) AS projects_count,
              (SELECT COALESCE(AVG(p.completion_percentage), 0) FROM projects p WHERE p.intermediary_id = u.id AND p.deleted_at IS NULL) AS avg_progress,
              (SELECT COUNT(*) FROM projects p WHERE p.intermediary_id = u.id AND p.deleted_at IS NULL AND p.status = 'Completed') AS completed_projects
       FROM users u
       ${toWhere(where)}
       ORDER BY u.first_name`,
      where.args,
    );

    return {
      id: "intermediaries",
      title: "Intermediaries Report",
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: "Intermediaries", value: rows.length },
        { label: "Assigned clients", value: rows.reduce((sum, r) => sum + num(r.clients_count), 0) },
        { label: "Assigned projects", value: rows.reduce((sum, r) => sum + num(r.projects_count), 0) },
        {
          label: "Avg. progress",
          value: rows.length
            ? `${Math.round(rows.reduce((sum, r) => sum + num(r.avg_progress), 0) / rows.length)}%`
            : "0%",
        },
      ],
      table: {
        columns: ["Intermediary", "Clients", "Projects", "Completed", "Avg. progress %"],
        rows: rows.map((r) => [
          r.name,
          num(r.clients_count),
          num(r.projects_count),
          num(r.completed_projects),
          Math.round(num(r.avg_progress)),
        ]),
      },
      chart: {
        title: "Projects per intermediary",
        type: "bar",
        items: rows.map((r) => ({ label: r.name, value: num(r.projects_count) })),
      },
    };
  }

  // ============================================================
  // Historia 12.5 — Reporte de Tareas
  // ============================================================
  static async getTasksReport(filters: ReportFilters): Promise<ModuleReport> {
    const scope = await projectScope("p.id");
    const where: Where = { conditions: ["t.deleted_at IS NULL"], args: [] };
    if (scope.sql) {
      where.conditions.push(scope.sql);
      where.args.push(...scope.args);
    }
    applyProjectFilters(where, filters);
    if (filters.userId) {
      where.conditions.push("t.assigned_to = ?");
      where.args.push(filters.userId);
    }

    interface TaskRow {
      title: string;
      project_name: string;
      assignee: string | null;
      status: string;
      priority: string;
      estimated_hours: number;
      worked_hours: number;
      estimated_end: string | null;
    }

    const rows = await query<TaskRow>(
      `SELECT t.title, p.name AS project_name,
              u.first_name || ' ' || u.last_name AS assignee,
              t.status, t.priority, t.estimated_hours, t.worked_hours, t.estimated_end
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       ${toWhere(where)}
       ORDER BY t.title`,
      where.args,
    );

    const total = rows.length;
    const completed = rows.filter((r) => r.status === "Completed").length;
    const pending = rows.filter((r) => r.status === "Pending").length;
    const blocked = rows.filter((r) => r.status === "Blocked").length;
    const delayed = rows.filter(
      (r) => r.estimated_end && r.estimated_end < today() && r.status !== "Completed",
    ).length;

    const byStatus = new Map<string, number>();
    for (const row of rows) byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);

    return {
      id: "tasks",
      title: "Tasks Report",
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: "Total tasks", value: total },
        { label: "Completed", value: completed },
        { label: "Pending", value: pending },
        { label: "Blocked", value: blocked },
        { label: "Delayed", value: delayed },
        {
          label: "Productivity",
          value: total ? `${Math.round((completed / total) * 100)}%` : "0%",
          hint: "Completed vs. total tasks",
        },
      ],
      table: {
        columns: ["Task", "Project", "Assignee", "Status", "Priority", "Est. hours", "Worked hours", "Deadline"],
        rows: rows.map((r) => [
          r.title,
          r.project_name,
          r.assignee?.trim() || "",
          r.status,
          r.priority,
          num(r.estimated_hours),
          num(r.worked_hours),
          r.estimated_end ?? "",
        ]),
      },
      chart: {
        title: "Tasks by status",
        type: "bar",
        items: [...byStatus.entries()].map(([label, value]) => ({ label, value })),
      },
    };
  }

  // ============================================================
  // Historia 12.6 — Reporte de Hitos
  // ============================================================
  static async getMilestonesReport(filters: ReportFilters): Promise<ModuleReport> {
    const scope = await projectScope("p.id");
    const where: Where = { conditions: ["m.deleted_at IS NULL"], args: [] };
    if (scope.sql) {
      where.conditions.push(scope.sql);
      where.args.push(...scope.args);
    }
    applyProjectFilters(where, filters);

    interface MilestoneRow {
      title: string;
      project_name: string;
      status: string;
      estimated_date: string | null;
      completed_date: string | null;
      completion_percentage: number;
    }

    const rows = await query<MilestoneRow>(
      `SELECT m.title, p.name AS project_name, m.status, m.estimated_date, m.completed_date, m.completion_percentage
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       ${toWhere(where)}
       ORDER BY m.estimated_date, m.title`,
      where.args,
    );

    const total = rows.length;
    const completed = rows.filter((r) => r.status === "Completed").length;
    const pending = total - completed;
    const delayed = rows.filter(
      (r) => r.estimated_date && r.estimated_date < today() && r.status !== "Completed",
    ).length;
    const onTime = rows.filter(
      (r) => r.status === "Completed" && (!r.estimated_date || !r.completed_date || r.completed_date <= r.estimated_date),
    ).length;

    return {
      id: "milestones",
      title: "Milestones Report",
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: "Total milestones", value: total },
        { label: "Completed", value: completed },
        { label: "Pending", value: pending },
        { label: "Delayed", value: delayed },
        {
          label: "On-time compliance",
          value: completed ? `${Math.round((onTime / completed) * 100)}%` : "0%",
        },
      ],
      table: {
        columns: ["Milestone", "Project", "Status", "Progress %", "Estimated date", "Completed date"],
        rows: rows.map((r) => [
          r.title,
          r.project_name,
          r.status,
          num(r.completion_percentage),
          r.estimated_date ?? "",
          r.completed_date ?? "",
        ]),
      },
      chart: {
        title: "Milestones by status",
        type: "pie",
        items: [
          { label: "Completed", value: completed },
          { label: "Pending", value: pending },
          { label: "Delayed", value: delayed },
        ],
      },
    };
  }

  // ============================================================
  // Historia 12.7 — Reporte de Horas
  // ============================================================
  static async getHoursReport(filters: ReportFilters): Promise<ModuleReport> {
    const scope = await projectScope("p.id");
    const where: Where = { conditions: ["t.deleted_at IS NULL"], args: [] };
    if (scope.sql) {
      where.conditions.push(scope.sql);
      where.args.push(...scope.args);
    }
    applyProjectFilters(where, filters);
    if (filters.userId) {
      where.conditions.push("te.user_id = ?");
      where.args.push(filters.userId);
    }
    pushDateRange(where, "te.date", filters);

    interface HoursRow {
      user: string;
      total_hours: number;
      entries: number;
      estimated_hours: number;
    }

    const rows = await query<HoursRow>(
      `SELECT u.first_name || ' ' || u.last_name AS user,
              COALESCE(SUM(te.total_hours), 0) AS total_hours,
              COUNT(te.id) AS entries,
              COALESCE(SUM(DISTINCT t.estimated_hours), 0) AS estimated_hours
       FROM time_entries te
       JOIN tasks t ON t.id = te.task_id
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = te.user_id
       ${toWhere(where)}
       GROUP BY te.user_id
       ORDER BY total_hours DESC`,
      where.args,
    );

    const totalReal = rows.reduce((sum, r) => sum + num(r.total_hours), 0);
    const totalEstimated = rows.reduce((sum, r) => sum + num(r.estimated_hours), 0);
    const deviation = totalEstimated ? Math.round(((totalReal - totalEstimated) / totalEstimated) * 100) : 0;

    return {
      id: "hours",
      title: "Hours Report",
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: "Estimated hours", value: totalEstimated },
        { label: "Real hours", value: totalReal },
        { label: "Remaining hours", value: Math.max(totalEstimated - totalReal, 0) },
        { label: "Deviation", value: `${deviation}%` },
      ],
      table: {
        columns: ["Member", "Worked hours", "Entries", "Estimated hours", "Difference"],
        rows: rows.map((r) => [
          r.user.trim() || "Unknown",
          num(r.total_hours),
          num(r.entries),
          num(r.estimated_hours),
          num(r.total_hours) - num(r.estimated_hours),
        ]),
      },
      chart: {
        title: "Hours per member",
        type: "bar",
        items: rows.map((r) => ({ label: r.user.trim() || "Unknown", value: num(r.total_hours) })),
      },
    };
  }

  // ============================================================
  // Historia 12.8 — Reporte de Productividad
  // ============================================================
  static async getProductivityReport(filters: ReportFilters): Promise<ModuleReport> {
    const scope = await projectScope("p.id");
    const projectWhere: Where = { conditions: ["p.deleted_at IS NULL"], args: [] };
    const taskWhere: Where = { conditions: ["t.deleted_at IS NULL"], args: [] };
    if (scope.sql) {
      projectWhere.conditions.push(scope.sql);
      projectWhere.args.push(...scope.args);
      taskWhere.conditions.push(scope.sql);
      taskWhere.args.push(...scope.args);
    }
    applyProjectFilters(projectWhere, filters);
    if (filters.projectId) {
      taskWhere.conditions.push("t.project_id = ?");
      taskWhere.args.push(filters.projectId);
    }

    const [projectTotals, taskTotals, monthly] = await Promise.all([
      queryOne<{ total: number; completed: number }>(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) AS completed
         FROM projects p ${toWhere(projectWhere)}`,
        projectWhere.args,
      ),
      queryOne<{ total: number; completed: number; on_time: number }>(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN t.status = 'Completed' AND (t.estimated_end IS NULL OR date(t.real_end) <= date(t.estimated_end)) THEN 1 ELSE 0 END) AS on_time
         FROM tasks t JOIN projects p ON p.id = t.project_id ${toWhere(taskWhere)}`,
        taskWhere.args,
      ),
      query<{ month: string; completed: number }>(
        `SELECT strftime('%Y-%m', t.real_end) AS month, COUNT(*) AS completed
         FROM tasks t JOIN projects p ON p.id = t.project_id
         ${toWhere({ conditions: [...taskWhere.conditions, "t.status = 'Completed'", "t.real_end IS NOT NULL"], args: taskWhere.args })}
         GROUP BY month
         ORDER BY month DESC
         LIMIT 6`,
        taskWhere.args,
      ),
    ]);

    const completedProjects = num(projectTotals?.completed);
    const completedTasks = num(taskTotals?.completed);
    const totalTasks = num(taskTotals?.total);
    const onTimeRate = completedTasks ? Math.round((num(taskTotals?.on_time) / completedTasks) * 100) : 0;

    return {
      id: "productivity",
      title: "Productivity Report",
      generatedAt: new Date().toISOString(),
      kpis: [
        { label: "Completed projects", value: completedProjects },
        { label: "Total projects", value: num(projectTotals?.total) },
        { label: "Completed tasks", value: completedTasks },
        { label: "Task completion", value: totalTasks ? `${Math.round((completedTasks / totalTasks) * 100)}%` : "0%" },
        { label: "Deadline compliance", value: `${onTimeRate}%` },
      ],
      table: {
        columns: ["Month", "Completed tasks"],
        rows: monthly.map((m) => [m.month, num(m.completed)]),
      },
      chart: {
        title: "Completed tasks per month",
        type: "line",
        items: [...monthly].reverse().map((m) => ({ label: m.month, value: num(m.completed) })),
      },
    };
  }

  // Dispatcher central: UI, Route Handler de exportación y auditoría usan el
  // mismo punto de entrada (Historias 12.10 / 12.15).
  static async getModuleReport(id: ReportId, filters: ReportFilters): Promise<ModuleReport> {
    switch (id) {
      case "projects":
        return this.getProjectsReport(filters);
      case "clients":
        return this.getClientsReport(filters);
      case "intermediaries":
        return this.getIntermediariesReport(filters);
      case "tasks":
        return this.getTasksReport(filters);
      case "milestones":
        return this.getMilestonesReport(filters);
      case "hours":
        return this.getHoursReport(filters);
      case "productivity":
        return this.getProductivityReport(filters);
      default:
        throw new Error("Unknown report.");
    }
  }
}
