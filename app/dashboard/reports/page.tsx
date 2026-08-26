import { requireAuth } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";
import { DashboardService } from "@/features/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { ReportsCharts } from "./reports-charts";
import { countRows } from "@/lib/turso/client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await requireAuth();
  const stats = await DashboardService.getStats(user);

  const isDeveloper = hasFullAccess(user.role);
  const totalIntermediaries = isDeveloper
    ? await countRows(`SELECT COUNT(*) AS total FROM users WHERE is_active = 1`)
    : 0;

  const displayStats = [
    { label: "Total Projects", value: stats.totalProjects },
    { label: "Active Projects", value: stats.activeProjects },
    { label: "Completed Projects", value: stats.completedProjects },
    { label: "Total Tasks", value: stats.pendingTasks + stats.inProgressTasks + stats.blockedTasks + stats.completedTasks },
    { label: "Completed Tasks", value: stats.completedTasks },
    { label: "Pending Tasks", value: stats.pendingTasks },
    { label: "Total Clients", value: stats.totalClients },
    { label: "Active Clients", value: stats.activeClients },
    ...(isDeveloper ? [{ label: "Active Intermediaries", value: totalIntermediaries }] : []),
  ];

  const taskChartData = [
    { label: "Pending", value: stats.pendingTasks, color: "#6B7280" },
    { label: "In Progress", value: stats.inProgressTasks, color: "#3B82F6" },
    { label: "Blocked", value: stats.blockedTasks, color: "#EF4444" },
    { label: "Completed", value: stats.completedTasks, color: "#10B981" },
  ];
  const totalTasks = stats.pendingTasks + stats.inProgressTasks + stats.blockedTasks + stats.completedTasks;
  const taskRate = totalTasks ? Math.round((stats.completedTasks / totalTasks) * 100) : 0;
  const projectRate = stats.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Reports & Analytics</h1>
        <p className="mt-1 text-body-sm text-muted">Overview of platform metrics and performance indicators.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-display-lg text-ink">{s.value}</p>
              <p className="text-caption text-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tasks by Status</CardTitle></CardHeader>
          <CardContent><ReportsCharts taskData={taskChartData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Completion Rates</CardTitle></CardHeader>
          <CardContent>
            <ReportsCharts taskRate={taskRate} projectRate={projectRate} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
