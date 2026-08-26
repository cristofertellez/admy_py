import { query, queryOne } from "@/lib/turso/client";
import { assertProjectVisible } from "@/lib/auth-scope";
import {
  buildProjectMetrics,
  type ProjectMetricsInput,
} from "./projects-indicators";
import type { ProjectMetricsBundle } from "./projects-indicators.types";

interface ProjectCoreRow {
  status: string;
  estimated_hours: number | null;
  worked_hours: number | null;
  completion_percentage: number | null;
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  real_start_date: string | null;
  real_end_date: string | null;
}

interface TaskAggregateRow {
  total: number;
  completed: number;
  blocked: number;
  overdue: number;
  estimated_hours_sum: number | null;
  worked_hours_sum: number | null;
  weighted_completion: number | null;
  total_weight: number | null;
  last_activity_at: string | null;
}

interface MilestoneAggregateRow {
  total: number;
  completed: number;
  overdue: number;
}

/**
 * Historias 6.6 / 6.9 / 6.15 — Estimaciones, indicadores y métricas del proyecto.
 * Toda la aritmética vive en `projects-indicators.ts` (funciones puras); este
 * servicio solo agrega los datos y aplica la autorización de capa de datos.
 */
export class ProjectIndicatorsService {
  static async getByProject(projectId: string): Promise<ProjectMetricsBundle> {
    await assertProjectVisible(projectId);

    const today = new Date().toISOString().slice(0, 10);
    const workloadCutoff = new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [
      core,
      taskAggregates,
      milestoneAggregates,
      dependencies,
      taskStatusRows,
      totalLoggedHoursRow,
      dailyHours,
    ] = await Promise.all([
        queryOne<ProjectCoreRow>(
          `SELECT status, estimated_hours, worked_hours, completion_percentage,
                  estimated_start_date, estimated_end_date, real_start_date, real_end_date
           FROM projects
           WHERE id = ? AND deleted_at IS NULL
           LIMIT 1`,
          [projectId],
        ),
        queryOne<TaskAggregateRow>(
          `SELECT COUNT(*) AS total,
                  COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed,
                  COALESCE(SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END), 0) AS blocked,
                  COALESCE(SUM(CASE WHEN status NOT IN ('Completed', 'Cancelled')
                      AND estimated_end IS NOT NULL AND estimated_end < ?
                    THEN 1 ELSE 0 END), 0) AS overdue,
                  COALESCE(SUM(estimated_hours), 0) AS estimated_hours_sum,
                  COALESCE(SUM(worked_hours), 0) AS worked_hours_sum,
                  COALESCE(SUM(weight * completion_percentage), 0) AS weighted_completion,
                  COALESCE(SUM(weight), 0) AS total_weight,
                  MAX(updated_at) AS last_activity_at
           FROM tasks
           WHERE project_id = ? AND deleted_at IS NULL`,
          [today, projectId],
        ),
        queryOne<MilestoneAggregateRow>(
          `SELECT COUNT(*) AS total,
                  COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed,
                  COALESCE(SUM(CASE WHEN status <> 'Completed'
                      AND estimated_date IS NOT NULL AND estimated_date < ?
                    THEN 1 ELSE 0 END), 0) AS overdue
           FROM milestones
           WHERE project_id = ? AND deleted_at IS NULL`,
          [today, projectId],
        ),
        queryOne<{ total: number }>(
          `SELECT COUNT(*) AS total
           FROM task_dependencies td
           JOIN tasks a ON a.id = td.task_id
           JOIN tasks b ON b.id = td.depends_on_task_id
           WHERE a.project_id = ? AND a.deleted_at IS NULL AND b.deleted_at IS NULL
             AND a.status NOT IN ('Completed', 'Cancelled')
             AND b.status NOT IN ('Completed', 'Cancelled')`,
          [projectId],
        ),
        query<{ status: string; count: number }>(
          `SELECT status, COUNT(*) AS count
           FROM tasks
           WHERE project_id = ? AND deleted_at IS NULL
           GROUP BY status`,
          [projectId],
        ),
        queryOne<{ total: number }>(
          `SELECT COALESCE(SUM(te.total_hours), 0) AS total
           FROM time_entries te
           JOIN tasks t ON t.id = te.task_id
           WHERE t.project_id = ? AND t.deleted_at IS NULL`,
          [projectId],
        ),
        query<{ day: string; hours: number }>(
          `SELECT te.date AS day, SUM(te.total_hours) AS hours
           FROM time_entries te
           JOIN tasks t ON t.id = te.task_id
           WHERE t.project_id = ? AND t.deleted_at IS NULL AND te.date >= ?
           GROUP BY te.date
           ORDER BY te.date ASC`,
          [projectId, workloadCutoff],
        ),
      ]);

    if (!core || !taskAggregates || !milestoneAggregates) {
      throw new Error("Project not found.");
    }

    const input: ProjectMetricsInput = {
      status: core.status,
      estimatedHours: core.estimated_hours === null ? null : Number(core.estimated_hours),
      workedHours: core.worked_hours === null ? null : Number(core.worked_hours),
      completionPercentage:
        core.completion_percentage === null ? null : Number(core.completion_percentage),
      estimatedStartDate: core.estimated_start_date,
      estimatedEndDate: core.estimated_end_date,
      realStartDate: core.real_start_date,
      realEndDate: core.real_end_date,
      tasks: {
        total: Number(taskAggregates.total),
        completed: Number(taskAggregates.completed),
        blocked: Number(taskAggregates.blocked),
        overdue: Number(taskAggregates.overdue),
        statusCounts: taskStatusRows.map((row) => ({
          status: row.status,
          count: Number(row.count),
        })),
        estimatedHoursSum: Number(taskAggregates.estimated_hours_sum ?? 0),
        workedHoursSum: Number(taskAggregates.worked_hours_sum ?? 0),
        weightedCompletionSum: Number(taskAggregates.weighted_completion ?? 0),
        totalWeight: Number(taskAggregates.total_weight ?? 0),
        lastActivityAt: taskAggregates.last_activity_at,
      },
      milestones: {
        total: Number(milestoneAggregates.total),
        completed: Number(milestoneAggregates.completed),
        overdue: Number(milestoneAggregates.overdue),
      },
      pendingDependencies: Number(dependencies?.total ?? 0),
      totalLoggedHours: Number(totalLoggedHoursRow?.total ?? 0),
      dailyHours: dailyHours.map((row) => ({ day: row.day, hours: Number(row.hours) })),
    };

    return buildProjectMetrics(input);
  }
}
