"use client";

import Link from "next/link";
import { useTransition } from "react";
import { KanbanBoard, type KanbanColumnConfig } from "@/components/tables/kanban-board";
import { bulkUpdateTaskStatus } from "@/actions/tasks";
import { Badge } from "@/components/shared/badge";

interface KanbanTaskItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  assignee_name?: string | null;
  project_name?: string | null;
  estimated_end?: string | null;
}

interface KanbanTasksProps {
  tasks: KanbanTaskItem[];
  statusOptions: { value: string; label: string }[];
  canUpdate: boolean;
}

const COLUMN_COLORS: Record<string, string> = {
  Pending: "bg-surface-card-elevated",
  Planned: "bg-surface-card-elevated",
  "In Progress": "bg-primary/10",
  "In Review": "bg-accent-violet/10",
  QA: "bg-accent-cyan/10",
  Blocked: "bg-error/10",
  Completed: "bg-success/10",
  Cancelled: "bg-surface-card-elevated",
};

/**
 * Historia 7.13 — Kanban over the global task list. Drag & drop moves the
 * task to a new status through the audited bulk action, so transitions and
 * dependencies are validated server-side.
 */
export function KanbanTasks({ tasks, statusOptions, canUpdate }: KanbanTasksProps) {
  const [isPending, startTransition] = useTransition();

  const columns: KanbanColumnConfig[] = statusOptions.map((option) => ({
    id: option.value,
    title: option.label,
    color: COLUMN_COLORS[option.value] ?? "bg-surface-card-elevated",
  }));

  function handleStatusChange(taskId: string, newStatus: string) {
    if (!canUpdate) return;
    startTransition(async () => {
      await bulkUpdateTaskStatus([taskId], newStatus);
    });
  }

  return (
    <div className={isPending ? "pointer-events-none opacity-70" : ""}>
      <KanbanBoard
        tasks={tasks}
        columns={columns}
        onStatusChange={canUpdate ? handleStatusChange : undefined}
        renderTask={(task) => {
          const item = tasks.find((t) => t.id === task.id) ?? task;
          const isOverdue =
            item.estimated_end !== null &&
            item.estimated_end !== undefined &&
            item.estimated_end < new Date().toISOString().slice(0, 10) &&
            task.status !== "Completed";

          return (
            <div>
              <Link
                href={`/dashboard/tasks/${task.id}`}
                className="text-body-sm font-medium text-body-strong hover:text-primary"
              >
                {task.title}
              </Link>
              {item.project_name && (
                <p className="truncate text-caption text-muted">{item.project_name}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={task.priority === "Critical" || task.priority === "Urgent" ? "error" : "default"}>
                  {task.priority}
                </Badge>
                {isOverdue && <Badge variant="error">Overdue</Badge>}
                {item.assignee_name && (
                  <span className="text-caption text-muted">{item.assignee_name}</span>
                )}
              </div>
            </div>
          );
        }}
      />
      {!canUpdate && (
        <p className="mt-2 text-caption text-muted">
          Read-only view: drag & drop requires task update permission.
        </p>
      )}
    </div>
  );
}
