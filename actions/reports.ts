"use server";

import { ReportsService } from "@/features/reports";
import { requirePermission } from "@/lib/auth";
import { countRows } from "@/lib/turso/client";

export async function getProjectReport(projectId: string) {
  await requirePermission("reports.view");

  try {
    return await ReportsService.getProjectReport(projectId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load report." };
  }
}

export async function getGlobalReport() {
  try {
    const user = await requirePermission("reports.view");

    if (user.role !== "Developer") {
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
