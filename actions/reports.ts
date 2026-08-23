"use server";

import { ReportsService } from "@/features/reports";
import { getUser } from "@/lib/auth";
import { countRows } from "@/lib/turso/client";

export async function getProjectReport(projectId: string) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    return await ReportsService.getProjectReport(projectId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load report." };
  }
}

export async function getGlobalReport() {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

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
