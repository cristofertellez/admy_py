import { Badge } from "@/components/shared/badge";
import {
  CommentsCard,
  DueSoonCard,
  KpiCard,
  ListCard,
} from "@/components/dashboard";
import type { IntermediaryPanelData, PendingTaskSummary } from "@/features/dashboard";

// Historia 11.4 — Dashboard del Intermediary: portfolio of assigned clients
// and their projects. Since Historia 11.5 this panel consumes the same shared
// widgets as the other role dashboards.

const DUE_SOON_WINDOW_DAYS = 30;

export function IntermediaryPanel({
  data,
  widgets,
}: {
  data: IntermediaryPanelData;
  widgets: { id: string; label: string }[];
}) {
  const { stats, dueSoonProjects, pendingTasks, recentComments } = data;

  const widgetById: Record<string, React.ReactNode> = {
    dueSoonProjects: <DueSoonCard key="dueSoonProjects" projects={dueSoonProjects} />,
    pendingTasks: <PendingTasksCard key="pendingTasks" tasks={pendingTasks} />,
    recentComments: (
      <div key="recentComments" className="lg:col-span-2">
        <CommentsCard
          comments={recentComments}
          emptyMessage="No comments on your clients or projects yet."
        />
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard href="/dashboard/clients" value={stats.activeClients} label="Active Clients" />
        <KpiCard
          href="/dashboard/projects"
          value={stats.activeProjects}
          label="Active Projects"
        />
        <KpiCard
          href="/dashboard/projects"
          value={stats.dueSoonProjects}
          label={`Due in ${DUE_SOON_WINDOW_DAYS} Days`}
        />
        <KpiCard href="/dashboard/tasks" value={stats.pendingTasks} label="Pending Tasks" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {widgets.map((widget) => {
          const node = widgetById[widget.id];
          return node ? (
            <div key={widget.id} className="min-w-0">
              {node}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

function PendingTasksCard({ tasks }: { tasks: PendingTaskSummary[] }) {
  return (
    <ListCard title="Pending Tasks" badge={String(tasks.length)} emptyMessage="No pending tasks across your projects." itemCount={tasks.length}>
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
          <span className="truncate text-body-sm font-medium text-body-strong">
            {task.title}
          </span>
          <span className="truncate text-caption text-muted">{task.project_name}</span>
          <span className="ml-auto flex items-center gap-3">
            {task.estimated_end ? (
              <time dateTime={task.estimated_end} className="text-caption text-muted">
                {new Date(task.estimated_end).toLocaleDateString()}
              </time>
            ) : null}
            <Badge variant={task.priority === "Urgent" || task.priority === "Critical" ? "error" : "default"}>
              {task.priority}
            </Badge>
          </span>
        </li>
      ))}
    </ListCard>
  );
}
