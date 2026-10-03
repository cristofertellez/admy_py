import { BarChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import {
  ActivityCard,
  AtRiskProjectsCard,
  CommentsCard,
  FilesCard,
  KpiCard,
  MilestonesCard,
} from "@/components/dashboard";
import type { DeveloperDashboardData } from "@/features/dashboard";

// Historia 11.2 / 11.11 — Dashboard del Developer: the most complete panel of
// the platform. Widgets render in the user's saved order (personalizable);
// the KPI row always stays visible.

interface DeveloperPanelProps {
  data: DeveloperDashboardData;
  widgets: { id: string; label: string }[];
}

export function DeveloperPanel({ data, widgets }: DeveloperPanelProps) {
  const { stats } = data;

  const taskData = [
    { label: "Pending", value: stats.pendingTasks, color: "#6B7280" },
    { label: "In Progress", value: stats.inProgressTasks, color: "#3B82F6" },
    { label: "Blocked", value: stats.blockedTasks, color: "#EF4444" },
    { label: "Completed", value: stats.completedTasks, color: "#10B981" },
  ];

  const projectData = data.statusBreakdown.map((row) => ({
    label: row.status,
    value: row.total,
  }));

  const hoursData = [
    { label: "Estimated", value: Math.round(stats.totalEstimatedHours), color: "#3B82F6" },
    { label: "Worked", value: Math.round(stats.totalWorkedHours), color: "#10B981" },
  ];

  const widgetById: Record<string, React.ReactNode> = {
    taskStatusChart: (
      <Card key="taskStatusChart">
        <CardHeader><CardTitle>Tasks by Status</CardTitle></CardHeader>
        <CardContent><BarChart data={taskData} /></CardContent>
      </Card>
    ),
    projectStatusChart: (
      <Card key="projectStatusChart">
        <CardHeader><CardTitle>Projects by Status</CardTitle></CardHeader>
        <CardContent><BarChart data={projectData} /></CardContent>
      </Card>
    ),
    hoursChart: (
      <Card key="hoursChart">
        <CardHeader><CardTitle>Hours — Estimated vs Worked</CardTitle></CardHeader>
        <CardContent>
          <BarChart data={hoursData} />
          <p className="mt-3 text-caption text-muted">
            Average project progress: {Math.round(stats.averageProgress)}%
          </p>
        </CardContent>
      </Card>
    ),
    upcomingMilestones: <MilestonesCard key="upcomingMilestones" milestones={data.upcomingMilestones} />,
    atRiskProjects: <AtRiskProjectsCard key="atRiskProjects" projects={data.atRiskProjects} />,
    recentActivity: <ActivityCard key="recentActivity" logs={data.recentActivity} />,
    recentComments: <CommentsCard key="recentComments" comments={data.recentComments} />,
    recentFiles: <FilesCard key="recentFiles" files={data.recentFiles} />,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard href="/dashboard/projects" value={stats.activeProjects} label="Active Projects" tone="primary" />
        <KpiCard value={data.atRiskProjects.length} label="Projects at Risk" tone={data.atRiskProjects.length > 0 ? "danger" : "success"} />
        <KpiCard href="/dashboard/tasks" value={data.overdueTasks} label="Overdue Tasks" tone={data.overdueTasks > 0 ? "danger" : "default"} />
        <KpiCard href="/dashboard/tasks" value={stats.pendingTasks} label="Pending Tasks" />
        <KpiCard href="/dashboard/projects" value={stats.completedProjects} label="Completed Projects" tone="success" />
        <KpiCard href="/dashboard/projects" value={stats.delayedProjects} label="Delayed Projects" tone={stats.delayedProjects > 0 ? "warning" : "default"} />
        <KpiCard href="/dashboard/clients" value={stats.activeClients} label="Active Clients" tone="cyan" />
        <KpiCard href="/dashboard/intermediaries" value={data.activeIntermediaries} label="Active Intermediaries" tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {widgets.map((widget) => widgetById[widget.id] ?? null)}
      </div>
    </div>
  );
}
