"use client";

import { Badge } from "@/components/shared/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface KanbanTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  estimated_end?: string | null;
  project_name?: string | null;
  assignee_name?: string | null;
}

export type { KanbanTask };

interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
  color: string;
}

export interface KanbanColumnConfig {
  id: string;
  title: string;
  color?: string;
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  columns?: KanbanColumnConfig[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  renderTask?: (task: KanbanTask) => React.ReactNode;
}

const DEFAULT_COLUMNS: KanbanColumnConfig[] = [
  { id: "Pending", title: "Pending", color: "bg-surface-card-elevated" },
  { id: "In Progress", title: "In Progress", color: "bg-primary/10" },
  { id: "In Review", title: "In Review", color: "bg-accent-violet/10" },
  { id: "QA", title: "QA", color: "bg-accent-cyan/10" },
  { id: "Blocked", title: "Blocked", color: "bg-error/10" },
  { id: "Completed", title: "Completed", color: "bg-success/10" },
];

export function KanbanBoard({ tasks, columns = DEFAULT_COLUMNS, onStatusChange, renderTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const boardColumns: KanbanColumn[] = columns.map((col) => ({
    id: col.id,
    title: col.title,
    color: col.color ?? "bg-surface-card-elevated",
    tasks: tasks.filter((t) => t.status === col.id),
  }));

  function handleDragStart(taskId: string) {
    setDraggedTask(taskId);
  }

  function handleDrop(status: string) {
    if (draggedTask && onStatusChange) {
      onStatusChange(draggedTask, status);
    }
    setDraggedTask(null);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-4 pb-4">
        {boardColumns.map((column) => (
          <div
            key={column.id}
            className="w-64 flex-shrink-0 rounded-xl border border-hairline p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-caption-uppercase text-muted">{column.title}</span>
              <Badge>{column.tasks.length}</Badge>
            </div>
            <div className={cn("min-h-[100px] space-y-2 rounded-lg p-1", column.color)}>
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  className="cursor-grab rounded-lg bg-surface-card p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  {renderTask ? (
                    renderTask(task)
                  ) : (
                    <>
                      <p className="text-body-sm text-body-strong">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={task.priority === "Critical" ? "error" : "default"}>
                          {task.priority}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {column.tasks.length === 0 && (
                <p className="px-2 py-4 text-center text-caption text-muted-soft">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
