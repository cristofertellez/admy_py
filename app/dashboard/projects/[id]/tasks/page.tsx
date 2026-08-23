import { TasksService } from "@/features/tasks";
import { TasksTable } from "@/app/dashboard/tasks/tasks-table";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Tasks — ${id.slice(0, 8)}` };
}

export default async function ProjectTasksPage({ params }: Props) {
  const { id } = await params;
  const { data } = await TasksService.list({ projectId: id, pageSize: 100 });

  return (
    <div className="space-y-6">
      <h1 className="text-display-sm text-ink">Tasks</h1>
      <TasksTable initialTasks={(data || []) as unknown as Record<string, unknown>[]} projectId={id} />
    </div>
  );
}
