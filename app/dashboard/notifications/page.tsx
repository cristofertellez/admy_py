import { NotificationsService, NOTIFICATION_TYPES } from "@/features/notifications";
import { ProjectsService } from "@/features/projects";
import { getUser } from "@/lib/auth";
import { NotificationsList } from "./notifications-list";
import { NotificationPreferencesCard } from "./notification-preferences";
import { KpiCard } from "@/components/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<string, string> = {
  project_updated: "Project updated",
  comment_created: "New comment",
  task_created: "New task",
  project_completed: "Project completed",
  project_delayed: "Project delayed",
  deadline_upcoming: "Upcoming deadline",
  project_created: "New project",
  project_status_changed: "Project status",
  task_assigned: "Task assigned",
  task_status_changed: "Task status",
  task_completed: "Task completed",
  task_due_soon: "Task due",
  task_blocked: "Task blocked",
  subtask_created: "New subtask",
  milestone_completed: "Milestone completed",
  file_uploaded: "File uploaded",
  reminder: "Reminder",
};

interface NotificationsPageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    read?: string;
    project?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await getUser();
  if (!user) return null;

  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const type = params.type && NOTIFICATION_TYPES.includes(params.type as never) ? params.type : undefined;
  const isRead = params.read === "unread" ? false : params.read === "read" ? true : undefined;
  const from = params.from || undefined;
  const to = params.to || undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  // Time-based notifications (delays / upcoming deadlines / reminders) are
  // generated idempotently on load; dedupe keys prevent duplicates (13.5).
  await NotificationsService.syncTimeBasedNotifications();

  // Historia 13.10 — the project filter is validated against the visible
  // project options before reaching the service.
  const projectList = await ProjectsService.list({ pageSize: 200 }).catch(() => ({ data: [], total: 0 }));
  const projectOptions = projectList.data.map((project) => ({ id: project.id, name: project.name }));
  const projectId = projectOptions.some((option) => option.id === params.project)
    ? params.project
    : undefined;

  const [{ data: notifications, total }, stats, preferences] = await Promise.all([
    NotificationsService.list(user.id, { isRead, type, search, projectId, from, to, page, pageSize: PAGE_SIZE }),
    NotificationsService.getStats(user.id),
    NotificationsService.getPreferences(user.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display-sm text-ink">Notifications</h1>
          <p className="mt-1 text-body-sm text-muted">
            {stats.unread > 0 ? `${stats.unread} unread notifications` : "All caught up!"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total" value={stats.total} />
        <KpiCard label="Unread" value={stats.unread} tone={stats.unread > 0 ? "warning" : "success"} />
        <KpiCard label="Today" value={stats.today} />
        <KpiCard label="This week" value={stats.thisWeek} />
      </div>

      <NotificationsList
        notifications={notifications}
        total={total}
        page={page}
        totalPages={totalPages}
        typeLabels={TYPE_LABELS}
        projectOptions={projectOptions}
        initialFilters={{
          search: search ?? "",
          type: type ?? "",
          read: params.read ?? "",
          project: projectId ?? "",
          from: from ?? "",
          to: to ?? "",
        }}
      />

      <NotificationPreferencesCard preferences={preferences} typeLabels={TYPE_LABELS} />
    </div>
  );
}
