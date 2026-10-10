import { BarChart } from "@/components/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import {
  ActivityCard,
  AtRiskProjectsCard,
  CommentsCard,
  DonezoDashboard,
  FilesCard,
  MilestonesCard,
} from "@/components/dashboard";
import type { DeveloperDashboardData } from "@/features/dashboard";

interface DeveloperPanelProps {
  data: DeveloperDashboardData;
  widgets: { id: string; label: string }[];
  filterSlot?: React.ReactNode;
}

export function DeveloperPanel({ data, widgets, filterSlot }: DeveloperPanelProps) {
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

  const hasAdditionalWidgets = widgets && widgets.length > 0;

  return (
    <DonezoDashboard
      data={data}
      filterSlot={filterSlot}
      additionalWidgetsSlot={
        hasAdditionalWidgets ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {widgets.map((widget) => {
              const node = widgetById[widget.id];
              return node ? (
                <div key={widget.id} className="min-w-0">
                  {node}
                </div>
              ) : null;
            })}
          </div>
        ) : undefined
      }
    />
  );
}

