import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import type {
  DueSoonProject,
  IntermediaryPanelData,
  PanelComment,
  PendingTaskSummary,
} from "@/features/dashboard";

const DUE_SOON_WINDOW_DAYS = 30;

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IntermediaryPanel({ data }: { data: IntermediaryPanelData }) {
  const { stats, dueSoonProjects, pendingTasks, recentComments } = data;

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
        <DueSoonCard projects={dueSoonProjects} />
        <PendingTasksCard tasks={pendingTasks} />
      </div>

      <LatestCommentsCard comments={recentComments} />
    </div>
  );
}

function KpiCard({
  href,
  value,
  label,
}: {
  href: string;
  value: string | number;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-surface-card transition-colors hover:bg-surface-card-elevated focus-visible:outline-2 focus-visible:outline-primary"
    >
      <CardContent className="pt-6 text-center">
        <p className="text-display-md text-ink">{value}</p>
        <p className="text-caption text-muted">{label}</p>
      </CardContent>
    </Link>
  );
}

function DueSoonCard({ projects }: { projects: DueSoonProject[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects Due Soon</CardTitle>
        <Badge>Next {DUE_SOON_WINDOW_DAYS} days</Badge>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-body-sm text-muted-soft">No projects due in the next {DUE_SOON_WINDOW_DAYS} days.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {projects.map((project) => (
              <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="group flex flex-wrap items-center gap-x-3 gap-y-1"
                >
                  <span className="text-body-sm font-medium text-body-strong group-hover:text-ink truncate">
                    {project.name}
                  </span>
                  <span className="text-caption text-muted truncate">{project.client_name}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <time dateTime={project.estimated_end_date} className="text-caption text-muted">
                      {new Date(project.estimated_end_date).toLocaleDateString()}
                    </time>
                    <Badge
                      variant={project.status === "Delivered" ? "success" : "default"}
                    >
                      {project.status}
                    </Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PendingTasksCard({ tasks }: { tasks: PendingTaskSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Tasks</CardTitle>
        <Badge>{tasks.length}</Badge>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-body-sm text-muted-soft">No pending tasks across your projects.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                <span className="text-body-sm font-medium text-body-strong truncate">
                  {task.title}
                </span>
                <span className="text-caption text-muted truncate">{task.project_name}</span>
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
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LatestCommentsCard({ comments }: { comments: PanelComment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-body-sm text-muted-soft">No comments on your clients or projects yet.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {comments.map((comment) => {
              const author =
                [comment.author_first_name, comment.author_last_name]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || "Unknown user";
              const href =
                comment.context_type === "client"
                  ? `/dashboard/clients/${comment.context_id}`
                  : `/dashboard/projects/${comment.context_id}`;

              return (
                <li key={`${comment.context_type}-${comment.id}`} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-body-sm font-medium text-body-strong">{author}</span>
                    <Badge>{comment.context_title}</Badge>
                    <time
                      dateTime={comment.created_at}
                      title={new Date(comment.created_at).toLocaleString()}
                      className="ml-auto text-caption text-muted"
                    >
                      {formatCommentDate(comment.created_at)}
                    </time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-body-sm text-muted">{comment.message}</p>
                  <Link href={href} className="text-caption text-muted hover:text-body-strong">
                    View {comment.context_type === "client" ? "client" : "project"} →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
