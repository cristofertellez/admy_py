import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import {
  CommentsCard,
  DueSoonCard,
  FilesCard,
  KpiCard,
  MilestonesCard,
} from "@/components/dashboard";
import { ListCard } from "@/components/dashboard";
import type { ClientDashboardData, ClientDashboardProject } from "@/features/dashboard";

// Historia 11.3 — Dashboard del Cliente: read-only monitoring of their own
// projects (status, progress, upcoming milestones/deliveries, shared files and
// recent conversations). All data is scoped at the data layer.

interface ClientPanelProps {
  data: ClientDashboardData;
  widgets: { id: string; label: string }[];
}

const DUE_SOON_WINDOW_DAYS = 30;

function ProjectRow({ project }: { project: ClientDashboardProject }) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !!project.estimated_end_date && project.estimated_end_date < today;

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="group block"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="truncate text-body-sm font-medium text-body-strong group-hover:text-ink">
            {project.name}
          </span>
          <Badge variant={project.status === "Completed" ? "success" : "default"}>{project.status}</Badge>
          <span className="ml-auto flex items-center gap-3">
            {project.estimated_end_date && (
              <time
                dateTime={project.estimated_end_date}
                className={`text-caption ${overdue ? "text-error" : "text-muted"}`}
              >
                {new Date(project.estimated_end_date).toLocaleDateString()}
              </time>
            )}
            <span className="text-caption text-muted">{project.completion_percentage}%</span>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-card-elevated">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${project.completion_percentage}%`,
              backgroundColor: project.completion_percentage >= 100 ? "#10B981" : overdue ? "#EF4444" : "#3B82F6",
            }}
          />
        </div>
      </Link>
    </li>
  );
}

export function ClientPanel({ data, widgets }: ClientPanelProps) {
  const { stats } = data;

  const widgetById: Record<string, React.ReactNode> = {
    myProjects: (
      <ListCard
        key="myProjects"
        title="My Projects"
        badge={String(data.projects.length)}
        emptyMessage="No active projects right now."
        itemCount={data.projects.length}
      >
        {data.projects.map((project) => (
          <ProjectRow key={project.id} project={project} />
        ))}
      </ListCard>
    ),
    upcomingMilestones: (
      <MilestonesCard
        key="upcomingMilestones"
        milestones={data.upcomingMilestones}
        title="Upcoming Milestones"
        emptyMessage="No upcoming milestones on your projects."
      />
    ),
    upcomingDeliveries: (
      <div key="upcomingDeliveries" className="lg:col-span-2">
        <DueSoonCard
          projects={data.dueSoonProjects}
          title="Upcoming Deliveries"
          emptyMessage={`No deliveries scheduled within ${DUE_SOON_WINDOW_DAYS} days.`}
        />
      </div>
    ),
    recentComments: (
      <CommentsCard
        key="recentComments"
        comments={data.recentComments}
        emptyMessage="No recent comments on your projects."
      />
    ),
    recentFiles: (
      <FilesCard
        key="recentFiles"
        files={data.recentFiles}
        emptyMessage="No files shared on your projects yet."
      />
    ),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard href="/dashboard/projects" value={stats.activeProjects} label="Active Projects" tone="primary" />
        <KpiCard href="/dashboard/projects" value={stats.completedProjects} label="Completed Projects" tone="success" />
        <KpiCard value={`${Math.round(stats.averageProgress)}%`} label="Average Progress" tone="warning" />
        <KpiCard value={data.dueSoonProjects.length} label={`Deliveries in ${DUE_SOON_WINDOW_DAYS} Days`} tone="cyan" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {widgets.map((widget) => widgetById[widget.id] ?? null)}
      </div>
    </div>
  );
}
