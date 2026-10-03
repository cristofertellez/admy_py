"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/shared/badge";
import { cn } from "@/lib/utils";

interface CalendarTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimated_end: string | null;
  project_name?: string | null;
}

interface CalendarMilestone {
  id: string;
  title: string;
  status: string;
  estimated_date: string | null;
  project_id: string | null;
  project_name: string | null;
}

interface TasksCalendarProps {
  tasks: CalendarTask[];
  milestones: CalendarMilestone[];
  month: string; // YYYY-MM
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Historia 7.15 — monthly calendar with task due dates (delays highlighted)
 * and milestone deliveries. The visible month lives in the URL so the view
 * is shareable and works offline through the SW page cache.
 */
export function TasksCalendar({ tasks, milestones, month }: TasksCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const startPadding = firstDay.getUTCDay();

  const todayKey = new Date().toISOString().slice(0, 10);

  function navigateMonth(delta: number) {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("month", shiftMonth(month, delta));
    startTransition(() => {
      router.replace(`${pathname}?${qs.toString()}`);
    });
  }

  const byDay = new Map<string, { tasks: CalendarTask[]; milestones: CalendarMilestone[] }>();
  for (let day = 1; day <= daysInMonth; day += 1) {
    byDay.set(`${month}-${String(day).padStart(2, "0")}`, { tasks: [], milestones: [] });
  }
  for (const task of tasks) {
    if (task.estimated_end && byDay.has(task.estimated_end)) {
      byDay.get(task.estimated_end)!.tasks.push(task);
    }
  }
  for (const milestone of milestones) {
    if (milestone.estimated_date && byDay.has(milestone.estimated_date)) {
      byDay.get(milestone.estimated_date)!.milestones.push(milestone);
    }
  }

  const cells: (string | null)[] = [
    ...Array.from({ length: startPadding }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="rounded-md border border-hairline bg-surface-card px-3 py-1.5 text-body-sm text-muted hover:text-body-strong"
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="rounded-md border border-hairline bg-surface-card px-3 py-1.5 text-body-sm text-muted hover:text-body-strong"
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <p className="text-body-sm font-medium text-body-strong">{formatMonthLabel(month)}</p>
        <div className="hidden items-center gap-3 text-caption text-muted sm:flex">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-error" aria-hidden /> Overdue
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent-violet" aria-hidden /> Milestone
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="pb-1 text-center text-caption-uppercase text-muted">
            {weekday}
          </div>
        ))}
        {cells.map((dayKey, index) => {
          if (!dayKey) return <div key={`pad-${index}`} className="min-h-20 rounded-md" aria-hidden />;
          const dayNumber = Number(dayKey.slice(-2));
          const entry = byDay.get(dayKey)!;
          const isToday = dayKey === todayKey;

          return (
            <div
              key={dayKey}
              className={cn(
                "min-h-20 rounded-md border p-1.5",
                isToday ? "border-primary" : "border-hairline",
                entry.tasks.length + entry.milestones.length > 0 ? "bg-surface-card" : "bg-transparent",
              )}
            >
              <span
                className={cn(
                  "text-caption",
                  isToday ? "font-semibold text-primary" : "text-muted",
                )}
              >
                {dayNumber}
              </span>
              <ul className="mt-1 space-y-1">
                {entry.milestones.map((milestone) => (
                  <li key={`m-${milestone.id}`}>
                    <Link
                      href={milestone.project_id ? `/dashboard/projects/${milestone.project_id}` : "/dashboard/projects"}
                      className="block truncate rounded bg-accent-violet/10 px-1.5 py-0.5 text-caption text-accent-violet hover:underline"
                      title={`Milestone: ${milestone.title} (${milestone.project_name ?? ""})`}
                    >
                      ▲ {milestone.title}
                    </Link>
                  </li>
                ))}
                {entry.tasks.map((task) => {
                  const isOverdue =
                    task.estimated_end !== null &&
                    dayKey === task.estimated_end &&
                    task.estimated_end < todayKey &&
                    task.status !== "Completed";
                  return (
                    <li key={`t-${task.id}`}>
                      <Link
                        href={`/dashboard/tasks/${task.id}`}
                        className={cn(
                          "block truncate rounded px-1.5 py-0.5 text-caption hover:underline",
                          isOverdue
                            ? "bg-error/10 font-medium text-error"
                            : "bg-primary/10 text-primary",
                        )}
                        title={`${task.title}${task.project_name ? ` — ${task.project_name}` : ""}`}
                      >
                        {isOverdue ? "!" : ""} {task.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
        <Badge variant="default">
          {tasks.filter((task) => task.estimated_end?.startsWith(month)).length} tasks due
        </Badge>
        <Badge variant="default">{milestones.length} milestone deliveries</Badge>
        {tasks.some(
          (task) =>
            task.estimated_end !== null &&
            task.estimated_end < todayKey &&
            task.estimated_end.startsWith(month) &&
            task.status !== "Completed",
        ) && <Badge variant="error">Includes overdue tasks</Badge>}
      </div>
    </div>
  );
}
