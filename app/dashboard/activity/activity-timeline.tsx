import { Badge } from "@/components/shared/badge";
import {
  formatActivityUserName,
  getActivityUserInitials,
  type ActivityLog,
} from "@/features/activity";
import { cn } from "@/lib/utils";

interface TimelineGroup {
  key: string;
  label: string;
  items: ActivityLog[];
}

function buildGroups(logs: ActivityLog[]): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  for (const log of logs) {
    const date = new Date(log.created_at);
    const key = date.toDateString();
    if (!groups.has(key)) {
      groups.set(key, { key, label: formatDayLabel(date), items: [] });
    }
    groups.get(key)!.items.push(log);
  }

  return [...groups.values()];
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ActivityTimelineProps {
  logs: ActivityLog[];
  total: number;
  pageIndex: number;
  pageSize: number;
  onPageChange?: (nextPageIndex: number) => void;
}

export function ActivityTimeline({ logs, total, pageIndex, pageSize, onPageChange }: ActivityTimelineProps) {
  const groups = buildGroups(logs);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-hairline bg-surface-card px-6 py-16">
        <p className="text-body-sm text-muted-soft">No activity found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h3 className="text-caption-uppercase text-muted">{group.label}</h3>
          <ol className="relative ml-3 mt-3 space-y-3 border-l border-hairline pl-6">
            {group.items.map((log) => (
              <li key={log.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[31px] top-5 h-2.5 w-2.5 rounded-full bg-primary"
                />
                <article className="rounded-xl border border-hairline bg-surface-card p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-card-elevated text-caption font-semibold text-body-strong"
                    >
                      {getActivityUserInitials(log)}
                    </span>
                    <span className="text-body-strong">{formatActivityUserName(log)}</span>
                    <Badge>{log.entity}</Badge>
                    <time
                      dateTime={log.created_at}
                      className="ml-auto text-caption text-muted"
                      title={new Date(log.created_at).toLocaleString()}
                    >
                      {new Date(log.created_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="mt-2 text-body-sm text-body">{log.action.replace(/_/g, " ")}</p>
                </article>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {onPageChange && (
        <nav
          aria-label="Timeline pagination"
          className="flex items-center justify-between rounded-xl border border-hairline bg-surface-card px-4 py-3"
        >
          <button
            type="button"
            disabled={pageIndex === 0}
            onClick={() => onPageChange(pageIndex - 1)}
            className={cn(
              "rounded-md px-4 py-2 text-button",
              pageIndex === 0 ? "cursor-not-allowed text-muted-soft" : "text-body-strong hover:bg-surface-card-elevated",
            )}
          >
            Previous
          </button>
          <p className="text-body-sm text-muted">
            Page {pageIndex + 1} of {pageCount} · {total} events
          </p>
          <button
            type="button"
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => onPageChange(pageIndex + 1)}
            className={cn(
              "rounded-md px-4 py-2 text-button",
              pageIndex + 1 >= pageCount
                ? "cursor-not-allowed text-muted-soft"
                : "text-body-strong hover:bg-surface-card-elevated",
            )}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
