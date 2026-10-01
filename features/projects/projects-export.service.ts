import { query } from "@/lib/turso/client";
import { assertProjectVisible } from "@/lib/auth-scope";
import { MilestonesService } from "@/features/milestones";
import { formatActivityUserName, type ActivityLog } from "@/features/activity";
import { ProjectIndicatorsService } from "./projects-indicators.service";
import { ProjectsService } from "./projects.service";
import type { ProjectWithRelations } from "./projects.types";
import type { ProjectMetricsBundle } from "./projects-indicators.types";

export interface ProjectExportHoursByUser {
  user: string;
  total_hours: number;
  entries: number;
  first_date: string | null;
  last_date: string | null;
}

export interface ProjectExportActivityItem {
  date: string;
  action: string;
  entity: string;
  user: string;
}

export interface ProjectExportMilestone {
  title: string;
  description: string | null;
  status: string;
  estimated_date: string | null;
  completed_date: string | null;
  completion_percentage: number;
}

/**
 * Historia 6.19 — Datos de exportación del proyecto: información general,
 * cronograma, indicadores, progreso (vía indicators), horas y actividad.
 */
export interface ProjectExportData {
  projectId: string;
  projectName: string;
  general: ProjectWithRelations;
  schedule: ProjectExportMilestone[];
  indicators: ProjectMetricsBundle;
  hoursByUser: ProjectExportHoursByUser[];
  activity: ProjectExportActivityItem[];
}

interface HoursRow {
  user: string | null;
  total_hours: number | null;
  entries: number | null;
  first_date: string | null;
  last_date: string | null;
}

/**
 * Agrega todos los datos exportables de un proyecto. La autorización vive en la
 * capa de datos (`assertProjectVisible`), por lo que cada rol solo recibe
 * información de proyectos visibles para él.
 */
export class ProjectExportService {
  static async getExportData(projectId: string): Promise<ProjectExportData> {
    await assertProjectVisible(projectId);

    const [general, milestones, indicators, hoursRows, history] = await Promise.all([
      ProjectsService.getById(projectId),
      MilestonesService.listByProject(projectId),
      ProjectIndicatorsService.getByProject(projectId),
      query<HoursRow>(
        `SELECT u.first_name || ' ' || u.last_name AS user,
                SUM(te.total_hours) AS total_hours,
                COUNT(*) AS entries,
                MIN(te.date) AS first_date,
                MAX(te.date) AS last_date
         FROM time_entries te
         JOIN tasks t ON t.id = te.task_id
         LEFT JOIN users u ON u.id = te.user_id
         WHERE t.project_id = ? AND t.deleted_at IS NULL
         GROUP BY te.user_id
         ORDER BY SUM(te.total_hours) DESC`,
        [projectId],
      ),
      // Historia 6.17 — la bitácora excluye eventos de acceso y se limita a los
      // 100 eventos más recientes para mantener el archivo ligero.
      ProjectsService.getHistory(projectId, { pageSize: 100 }),
    ]);

    const activity: ProjectExportActivityItem[] = history.data.map((entry: ActivityLog) => ({
      date: entry.created_at,
      action: entry.action,
      entity: entry.entity,
      user: formatActivityUserName(entry),
    }));

    return {
      projectId,
      projectName: general.name,
      general,
      schedule: milestones.map((milestone) => ({
        title: milestone.title,
        description: milestone.description ?? null,
        status: milestone.status,
        estimated_date: milestone.estimated_date ?? null,
        completed_date: milestone.completed_date ?? null,
        completion_percentage: milestone.completion_percentage ?? 0,
      })),
      indicators,
      hoursByUser: hoursRows.map((row) => ({
        user: row.user ?? "Unknown",
        total_hours: Number(row.total_hours ?? 0),
        entries: Number(row.entries ?? 0),
        first_date: row.first_date,
        last_date: row.last_date,
      })),
      activity,
    };
  }
}
