import { TasksService } from "@/features/tasks";
import { TasksTable } from "./tasks-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const { data } = await TasksService.list({ pageSize: 100 });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Tasks</h1>
        <p className="mt-1 text-body-sm text-muted">All tasks across projects.</p>
      </div>
      <TasksTable initialTasks={(data || []) as unknown as Record<string, unknown>[]} />
    </div>
  );
}
