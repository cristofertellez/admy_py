import { TasksService } from "@/features/tasks";
import { CommentsService } from "@/features/comments";
import { ChecklistsService } from "@/features/checklists";
import { TagsService } from "@/features/tags";
import { TimeEntriesService } from "@/features/time-entries";
import { UsersService } from "@/features/users";
import { getCatalogOptions } from "@/features/settings";
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/constants";
import { ActivityTimeline } from "@/app/dashboard/activity/activity-timeline";
import { getUser, hasPermission } from "@/lib/auth";
import { isAccessDeniedError } from "@/lib/auth-scope";
import { redirect } from "next/navigation";
import { TaskDetail } from "./task-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

const statusColors: Record<string, "success" | "error" | "warning" | "default"> = {
  Completed: "success", Blocked: "error", Cancelled: "error", "In Progress": "warning", "In Review": "default", QA: "default",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const task = await TasksService.getById(id) as unknown as Record<string, unknown>;
    return { title: (task.title as string) || "Task" };
  } catch {
    return { title: "Task" };
  }
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser();

  let taskWithSubtasks: Record<string, unknown>;
  try {
    taskWithSubtasks = await TasksService.getWithSubtasks(id) as unknown as Record<string, unknown>;
  } catch (err) {
    if (isAccessDeniedError(err)) redirect("/unauthorized");
    throw err;
  }

  const subtasks = (taskWithSubtasks.subtasks as { id: string; title: string; status: string; priority: string; completion_percentage: number; estimated_hours: number }[]) || [];
  const dependencies = (taskWithSubtasks.dependencies as { id: string; depends_on: { id: string; title: string; status: string } }[]) || [];
  const task = taskWithSubtasks as Record<string, unknown>;
  const [comments, checklists, availableTasks, history, assignees, tags, taskTags, timeEntryRows] = await Promise.all([
    CommentsService.listByTask(id),
    ChecklistsService.listByTask(id).catch(() => []),
    TasksService.getAvailableTasksForDependency(id, task.project_id as string) as Promise<Record<string, unknown>[]>,
    TasksService.getHistory(id).catch(() => ({ data: [], total: 0, page: 1, pageSize: 20 })),
    UsersService.listAssigneeOptions(),
    TagsService.list().catch(() => []),
    TagsService.listByTask(id).catch(() => []),
    TimeEntriesService.listByTask(id).catch(() => []),
  ]);

  const timeEntries = (timeEntryRows as Array<Record<string, unknown>>).map((entry) => ({
    id: entry.id as string,
    task_id: entry.task_id as string,
    user_id: entry.user_id as string,
    date: entry.date as string,
    start_time: (entry.start_time as string | null) ?? null,
    end_time: (entry.end_time as string | null) ?? null,
    total_hours: Number(entry.total_hours ?? 0),
    description: (entry.description as string | null) ?? null,
    created_at: entry.created_at as string,
    updated_at: entry.updated_at as string,
    users: (entry.users as { first_name: string; last_name: string } | null) ?? null,
  }));

  // Historia 7.18 — pure indicator computation (delay, productivity, health).
  const estimatedHours = Number(task.estimated_hours ?? 0);
  const workedHours = Number(task.worked_hours ?? 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const estimatedEnd = (task.estimated_end as string | null) ?? null;
  const isOverdue =
    estimatedEnd !== null && estimatedEnd < todayKey && task.status !== "Completed" && task.status !== "Cancelled";
  const delayDays = isOverdue && estimatedEnd
    ? Math.max(1, Math.round((Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${estimatedEnd}T00:00:00Z`)) / 86400000))
    : 0;
  const hoursRatio = estimatedHours > 0 ? workedHours / estimatedHours : 0;
  const taskIndicators = {
    isOverdue,
    delayLabel: isOverdue ? `+${delayDays}d` : "On time",
    productivityLabel: estimatedHours > 0 ? `${Math.round(hoursRatio * 100)}%` : "—",
    healthVariant:
      task.status === "Completed"
        ? ("success" as const)
        : task.status === "Blocked" || isOverdue
          ? ("error" as const)
          : hoursRatio > 1
            ? ("warning" as const)
            : ("default" as const),
    healthLabel:
      task.status === "Completed"
        ? "Completed"
        : task.status === "Blocked"
          ? "Blocked"
          : isOverdue
            ? "At risk"
            : hoursRatio > 1
              ? "Hours overrun"
              : "Healthy",
  };

  const [statusOptions, priorityOptions] = await Promise.all([
    getCatalogOptions("task_statuses", TASK_STATUS_OPTIONS),
    getCatalogOptions("task_priorities", TASK_PRIORITY_OPTIONS),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/tasks" className="text-body-sm text-muted hover:text-body-strong">&larr; Back to Tasks</Link>
          <h1 className="mt-2 text-display-sm text-ink">{task.title as string}</h1>
          {task.projects ? (
            <Link
              href={`/dashboard/projects/${task.project_id}`}
              className="mt-1 inline-block text-body-sm text-primary hover:underline"
            >
              {(task.projects as Record<string, unknown>).name as string}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColors[task.status as string] || "default"}>{task.status as string}</Badge>
          <Badge>{task.priority as string}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{task.completion_percentage as number}%</p><p className="text-caption text-muted">Progress</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{task.estimated_hours as number}h</p><p className="text-caption text-muted">Estimated</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{task.worked_hours as number}h</p><p className="text-caption text-muted">Worked</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{subtasks.length}</p><p className="text-caption text-muted">Subtasks</p></CardContent></Card>
      </div>

      {/* Historia 7.18 — automatic indicators: remaining hours, delay,
          productivity and general health derived from the task data. */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{Math.max(0, Number(task.estimated_hours ?? 0) - Number(task.worked_hours ?? 0))}h</p><p className="text-caption text-muted">Remaining</p></CardContent></Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className={`text-display-md ${taskIndicators.isOverdue ? "text-error" : "text-ink"}`}>{taskIndicators.delayLabel}</p>
            <p className="text-caption text-muted">Delay</p>
          </CardContent>
        </Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{taskIndicators.productivityLabel}</p><p className="text-caption text-muted">Productivity</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Badge variant={taskIndicators.healthVariant}>{taskIndicators.healthLabel}</Badge><p className="mt-1 text-caption text-muted">General status</p></CardContent></Card>
      </div>

      {task.description ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-body-sm text-body">{task.description as string}</p>
          </CardContent>
        </Card>
      ) : null}

      <TaskDetail
        task={task}
        subtasks={subtasks}
        dependencies={dependencies}
        availableTasks={availableTasks}
        comments={comments}
        checklists={checklists}
        timeEntries={timeEntries}
        tags={tags}
        taskTags={taskTags}
        assigneeOptions={assignees}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        userId={user?.id}
        canCreateTasks={user ? hasPermission(user, "tasks.create") : false}
        canUpdateTasks={user ? hasPermission(user, "tasks.update") : false}
        canDeleteTasks={user ? hasPermission(user, "tasks.delete") : false}
        canCreateTimeEntries={user ? hasPermission(user, "time-entries.create") : false}
        canDeleteTimeEntries={user ? hasPermission(user, "time-entries.delete") : false}
      />

      <Card>
        <CardHeader><CardTitle>History</CardTitle></CardHeader>
        <CardContent>
          <ActivityTimeline logs={history.data} total={history.total} pageIndex={0} pageSize={20} />
          {history.total > history.data.length ? (
            <p className="mt-3 text-caption text-muted">
              Showing the latest {history.data.length} of {history.total} events.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
