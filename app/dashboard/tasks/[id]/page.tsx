import { TasksService } from "@/features/tasks";
import { CommentsService } from "@/features/comments";
import { ChecklistsService } from "@/features/checklists";
import { getUser } from "@/lib/auth";
import { TaskDetail } from "./task-detail";
import { Card, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

const statusColors: Record<string, "success" | "error" | "warning" | "default"> = {
  Completed: "success", Blocked: "error", "In Progress": "warning", "In Review": "default", QA: "default",
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
  const taskWithSubtasks = await TasksService.getWithSubtasks(id) as unknown as Record<string, unknown>;
  const subtasks = (taskWithSubtasks.subtasks as { id: string; title: string; status: string; priority: string; completion_percentage: number; estimated_hours: number }[]) || [];
  const dependencies = (taskWithSubtasks.dependencies as { id: string; depends_on: { id: string; title: string; status: string } }[]) || [];
  const task = taskWithSubtasks as Record<string, unknown>;
  const comments = await CommentsService.listByTask(id);
  const checklists = await ChecklistsService.listByTask(id).catch(() => []);
  const availableTasks = (await TasksService.getAvailableTasksForDependency(id, task.project_id as string)) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/tasks" className="text-body-sm text-muted hover:text-body-strong">← Back to Tasks</Link>
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

      {task.description ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-body-sm text-body">{task.description as string}</p>
          </CardContent>
        </Card>
      ) : null}

      <TaskDetail task={task} subtasks={subtasks} dependencies={dependencies} availableTasks={availableTasks} comments={comments} checklists={checklists} userId={user?.id} />
    </div>
  );
}
