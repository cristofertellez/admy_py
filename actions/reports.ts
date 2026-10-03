"use server";

import { ReportsService, ReportCenterService, isReportId } from "@/features/reports";
import { ProjectExportService } from "@/features/projects";
import { hasPermission, requirePermission } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";
import { countRows } from "@/lib/turso/client";
import { ActivityService } from "@/services/activity.service";

export async function getProjectReport(projectId: string) {
  await requirePermission("reports.view");

  try {
    return await ReportsService.getProjectReport(projectId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load report." };
  }
}

// Historia 6.19 â€” datos del proyecto para generar el PDF de exportaciÃ³n en el
// cliente. Requiere permiso de exportaciÃ³n ademÃ¡s del acceso al proyecto.
export async function getProjectExportData(projectId: string) {
  const user = await requirePermission("reports.export");

  try {
    if (!hasPermission(user, "reports.view")) {
      return { error: "You do not have access to project reports." };
    }

    return await ProjectExportService.getExportData(projectId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load export data." };
  }
}

export async function getGlobalReport() {
  try {
    const user = await requirePermission("reports.view");

    if (!hasFullAccess(user.role)) {
      return { error: "You do not have access to global reports." };
    }

    const [
      totalProjects,
      activeProjects,
      totalClients,
      activeClients,
      totalTasks,
      completedTasks,
    ] = await Promise.all([
      countRows(`SELECT COUNT(*) AS total FROM projects WHERE deleted_at IS NULL`),
      countRows(`SELECT COUNT(*) AS total FROM projects WHERE status = 'Active'`),
      countRows(`SELECT COUNT(*) AS total FROM clients WHERE deleted_at IS NULL`),
      countRows(`SELECT COUNT(*) AS total FROM clients WHERE status = 'active'`),
      countRows(`SELECT COUNT(*) AS total FROM tasks WHERE deleted_at IS NULL`),
      countRows(`SELECT COUNT(*) AS total FROM tasks WHERE status = 'Completed'`),
    ]);

    return {
      totalProjects,
      activeProjects,
      totalClients,
      activeClients,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load report." };
  }
}
// ============================================================
// Epica 12 — Centro de Reportes
// ============================================================

export async function getModuleReport(reportId: string, filters: Record<string, string>) {
  const user = await requirePermission("reports.view");
  try {
    if (!isReportId(reportId)) return { error: "Unknown report." };

    const cleanFilters: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value) cleanFilters[key] = value;
    }

    const report = await ReportCenterService.getModuleReport(reportId, cleanFilters);

    // Auditoria (Historia 12.15): reporte generado.
    await ActivityService.log({
      user_id: user.id,
      action: "generated_report",
      entity: "Report",
      entity_id: reportId,
      new_value: { filters: cleanFilters },
    });

    return { success: true as const, report };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load report." };
  }
}

// La exportacion PDF ocurre en el cliente; la auditoria se registra con esta
// accion exportada. CSV/XLSX auditan dentro del Route Handler.
export async function logReportExported(reportId: string, format: string) {
  const user = await requirePermission("reports.export");
  try {
    if (!isReportId(reportId)) return { error: "Unknown report." };

    await ActivityService.log({
      user_id: user.id,
      action: "exported_report",
      entity: "Report",
      entity_id: reportId,
      new_value: { format },
    });

    return { success: "Export logged." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to log export." };
  }
}

export async function getReportFilterOptions() {
  await requirePermission("reports.view");
  try {
    return await ReportCenterService.getFilterOptions();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load filters." };
  }
}
