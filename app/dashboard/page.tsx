import { getUser } from "@/lib/auth";
import { DashboardService } from "@/features/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { DashboardCharts } from "./dashboard-charts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getUser();
  const stats = await DashboardService.getDeveloperStats();

  const statCards = [
    { label: "Active Projects", value: stats.activeProjects, color: "text-primary" },
    { label: "Completed Projects", value: stats.completedProjects, color: "text-success" },
    { label: "Total Tasks", value: stats.pendingTasks + stats.inProgressTasks + stats.blockedTasks + stats.completedTasks, color: "text-accent-violet" },
    { label: "Completed Tasks", value: stats.completedTasks, color: "text-success" },
    { label: "Active Clients", value: stats.activeClients, color: "text-accent-cyan" },
    { label: "Avg Progress", value: `${Math.round(stats.averageProgress)}%`, color: "text-warning" },
  ];

  const taskData = [
    { label: "Pending", value: stats.pendingTasks, color: "#6B7280" },
    { label: "In Progress", value: stats.inProgressTasks, color: "#3B82F6" },
    { label: "Blocked", value: stats.blockedTasks, color: "#EF4444" },
    { label: "Completed", value: stats.completedTasks, color: "#10B981" },
  ];

  const projectData = [
    { label: "Active", value: stats.activeProjects, color: "#3B82F6" },
    { label: "Completed", value: stats.completedProjects, color: "#10B981" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Welcome, {user?.first_name}</h1>
        <p className="mt-1 text-body-sm text-muted">Here&apos;s what&apos;s happening with your projects.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-display-md ${s.color}`}>{s.value}</p>
              <p className="text-caption text-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tasks by Status</CardTitle></CardHeader>
          <CardContent><DashboardCharts taskData={taskData} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Project Completion</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center pt-4">
            <DashboardCharts projectData={projectData} avgProgress={stats.averageProgress} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
