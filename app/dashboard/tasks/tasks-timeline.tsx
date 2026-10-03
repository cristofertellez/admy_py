"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/shared/badge";
import { cn } from "@/lib/utils";

interface TimelineTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimated_start: string | null;
  estimated_end: string | null;
  completion_percentage: number;
  project_name?: string | null;
}

const STATUS_BAR_COLORS: Record<string, string> = {
  Pending: "bg-surface-elevated border border-hairline",
  Planned: "bg-surface-elevated border border-hairline",
  "In Progress": "bg-primary",
  "In Review": "bg-accent-violet",
  QA: "bg-accent-cyan",
  Blocked: "bg-error",
  Completed: "bg-success",
  Cancelled: "bg-muted-soft",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMs(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00Z`);
}

function formatShort(dateKey: string): string {
  return new Date(toUtcMs(dateKey)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Historia 7.16 — timeline (Gantt-style) view: bars span each task's
 * estimated start/end, colored by status with progress overlays. Tasks
 * without dates are listed as unscheduled.
 */
export function TasksTimeline({ tasks }: { tasks: TimelineTask[] }) {
  const todayKey = new Date().toISOString().slice(0, 10);

  const { scheduled, unscheduled, minDate, maxDate } = useMemo(() => {
    const scheduled = tasks.filter((task) => task.estimated_start && task.estimated_end);
    const unscheduled = tasks.filter((task) => !(task.estimated_start && task.estimated_end));
    const dates: string[] = [];
    for (const task of scheduled) {
      dates.push(task.estimated_start!, task.estimated_end!);
    }
    dates.push(todayKey);
    const minDate = dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : todayKey;
    const maxDate = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : todayKey;
    return { scheduled, unscheduled, minDate, maxDate };
  }, [tasks, todayKey]);

  const spanDays = Math.max(1, Math.ceil((toUtcMs(maxDate) - toUtcMs(minDate)) / DAY_MS) + 1);

  function barGeometry(task: TimelineTask) {
    const start = toUtcMs(task.estimated_start!);
    const end = toUtcMs(task.estimated_end!);
    const leftPct = ((start - toUtcMs(minDate)) / DAY_MS / spanDays) * 100;
    const widthPct = (Math.max(1, Math.ceil((end - start) / DAY_MS) + 1) / spanDays) * 100;
    return { leftPct, widthPct: Math.min(100 - leftPct, widthPct) };
  }

  const todayLeftPct = ((toUtcMs(todayKey) - toUtcMs(minDate)) / DAY_MS / spanDays) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-caption text-muted">
        <span>
          {formatShort(minDate)} — {formatShort(maxDate)}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden /> In progress
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-error" aria-hidden /> Blocked
          </span>
        </span>
      </div>

      {scheduled.length === 0 && unscheduled.length === 0 && (
        <p className="text-body-sm text-muted-soft">No tasks to display.</p>
      )}

      {scheduled.length > 0 && (
        <ol className="space-y-1.5" aria-label="Task timeline">
          {scheduled.map((task) => {
            const { leftPct, widthPct } = barGeometry(task);
            const isOverdue =
              task.estimated_end! < todayKey && task.status !== "Completed";
            return (
              <li key={task.id} className="grid grid-cols-[10rem_1fr] items-center gap-3">
                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  className="truncate text-body-sm text-body-strong hover:text-primary"
                  title={task.title}
                >
                  {task.title}
                </Link>
                <div className="relative h-8 rounded-md bg-surface-elevated">
                  <div
                    className={cn(
                      "absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-md",
                      STATUS_BAR_COLORS[task.status] ?? "bg-primary",
                      isOverdue && "ring-1 ring-error",
                    )}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${task.title}: ${task.estimated_start} → ${task.estimated_end} (${task.completion_percentage}% complete)`}
                  >
                    <span
                      className="h-full bg-white/25"
                      style={{ width: `${Math.min(100, Math.max(0, task.completion_percentage))}%` }}
                      aria-hidden
                    />
                    <span className="truncate px-1.5 text-[10px] font-medium text-white/90">
                      {formatShort(task.estimated_start!)} → {formatShort(task.estimated_end!)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
          <li className="relative h-6">
            <span
              className="absolute top-0 h-6 w-px bg-error"
              style={{ left: `${Math.min(99.5, Math.max(0, todayLeftPct))}%` }}
              title="Today"
              aria-label="Today marker"
            />
          </li>
        </ol>
      )}

      {unscheduled.length > 0 && (
        <details className="rounded-md border border-hairline p-3">
          <summary className="cursor-pointer text-body-sm font-medium text-body-strong">
            Unscheduled tasks ({unscheduled.length})
          </summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {unscheduled.map((task) => (
              <li key={task.id}>
                <Link href={`/dashboard/tasks/${task.id}`} className="inline-flex items-center gap-1.5">
                  <Badge variant={task.status === "Blocked" ? "error" : "default"}>
                    {task.status}
                  </Badge>
                  <span className="text-body-sm text-body-strong hover:text-primary">{task.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
