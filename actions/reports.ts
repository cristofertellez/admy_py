"use server";

import { ReportsService } from "@/features/reports";
import { ProjectExportService } from "@/features/projects";
import { hasPermission, requirePermission } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";
import { countRows } from "@/lib/turso/client";

export async function getProjectReport(projectId: string) {
  await requirePermission("reports.view");

  try {
    return await ReportsService.getProjectReport(projectId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load report." };
  }
}

// Historia 6.19 — datos del proyecto para generar el PDF de exportación en el
// cliente. Requiere permiso de exportación además del acceso al proyecto.
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
