"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/shared/badge";

interface TimelineItem {
  id: string;
  title: string;
  description: string | null;
  estimated_date: string | null;
  completed_date: string | null;
  status: string;
  completion_percentage: number;
}

interface TimelineProps {
  items: TimelineItem[];
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  className?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Pending: {
    color: "#666666",
    bg: "bg-surface-card-elevated",
    border: "border-hairline-strong",
    label: "Pending",
  },
  "In Progress": {
    color: "#0007cd",
    bg: "bg-primary/10",
    border: "border-primary",
    label: "In Progress",
  },
  "In Review": {
    color: "#7b3aed",
    bg: "bg-accent-violet/10",
    border: "border-accent-violet",
    label: "In Review",
  },
  Completed: {
    color: "#33d17a",
    bg: "bg-success/10",
    border: "border-success",
    label: "Completed",
  },
  Cancelled: {
    color: "#ff4d4d",
    bg: "bg-error/10",
    border: "border-error",
    label: "Cancelled",
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
}

export function Timeline({ items, projectStartDate, projectEndDate, className }: TimelineProps) {
  const sorted = [...items].sort((a, b) => {
    if (!a.estimated_date && !b.estimated_date) return 0;
    if (!a.estimated_date) return 1;
    if (!b.estimated_date) return -1;
    return new Date(a.estimated_date).getTime() - new Date(b.estimated_date).getTime();
  });

  const withDates = sorted.filter((i) => i.estimated_date);
  const noDates = sorted.filter((i) => !i.estimated_date);

  if (items.length === 0) {
    return (
      <div className={cn("py-12 text-center", className)}>
        <p className="text-body-sm text-muted-soft">No milestones to display on the timeline.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {projectStartDate && projectEndDate && (
        <div className="flex items-center justify-between rounded-lg bg-surface-card-elevated px-4 py-3">
          <div className="text-center">
            <p className="text-caption text-muted">Project Start</p>
            <p className="text-body-sm font-medium text-body-strong">
              {new Date(projectStartDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex-1 mx-4 h-px bg-hairline-strong" />
          <div className="text-center">
            <p className="text-caption text-muted">Project End</p>
            <p className="text-body-sm font-medium text-body-strong">
              {new Date(projectEndDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-hairline-strong" />

        <div className="space-y-0">
          {withDates.map((item) => {
            const config = getStatusConfig(item.status);
            return (
              <div key={item.id} className="relative pl-12 pb-6 last:pb-0">
                <div
                  className={cn(
                    "absolute left-[11px] top-1.5 z-10 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2",
                    config.border,
                    config.bg
                  )}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                </div>

                <div className="rounded-lg border border-hairline-soft bg-surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-body-sm font-medium text-body-strong truncate">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="mt-1 text-caption text-muted line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Badge>{config.label}</Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-caption text-muted">
                      {item.estimated_date
                        ? new Date(item.estimated_date).toLocaleDateString()
                        : "No date"}
                    </span>
                    {item.completed_date && (
                      <span className="text-caption text-success">
                        Completed: {new Date(item.completed_date).toLocaleDateString()}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-card-elevated">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.completion_percentage}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                      <span className="text-caption text-muted-soft w-8 text-right">
                        {item.completion_percentage}%
                      </span>
                    </div>
                  </div>

                  {item.status === "Completed" && item.completed_date && (
                    <div className="mt-2 flex items-center gap-1.5 text-caption text-success">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {noDates.length > 0 && (
            <div className="relative pl-12 pb-6 last:pb-0">
              <div className="absolute left-[11px] top-1.5 z-10 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-hairline-soft bg-surface-card">
                <div className="h-2 w-2 rounded-full bg-muted-soft" />
              </div>
              <div className="rounded-lg border border-dashed border-hairline-soft bg-surface-card/50 p-4">
                <h4 className="text-body-sm font-medium text-muted">Unscheduled Milestones</h4>
                <div className="mt-2 space-y-1.5">
                  {noDates.map((item) => {
                    const config = getStatusConfig(item.status);
                    return (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-body-sm text-body">{item.title}</span>
                        <Badge>{config.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {projectEndDate && (
            <div className="relative pl-12">
              <div className="absolute left-[11px] top-1.5 z-10 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-hairline-soft bg-canvas">
                <div className="h-2 w-2 rounded-full bg-muted-soft" />
              </div>
              <p className="text-caption text-muted-soft py-4">End of timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
