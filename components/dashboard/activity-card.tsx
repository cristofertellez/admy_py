import Link from "next/link";
import {
  formatActivityUserName,
  getActivityEntityHref,
  getActivityEventDetail,
  type ActivityLog,
} from "@/features/activity";
import { ListCard } from "./list-card";

// Historia 11.9 — Actividad Reciente widget: compact feed of the latest audit
// events, reusing the shared activity formatters so labels match the full
// activity page.

interface ActivityCardProps {
  logs: ActivityLog[];
  title?: string;
  emptyMessage?: string;
  href?: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function humanizeAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function ActivityCard({
  logs,
  title = "Recent Activity",
  emptyMessage = "No recent activity yet.",
  href = "/dashboard/activity",
}: ActivityCardProps) {
  return (
    <div className="space-y-2">
      <ListCard title={title} emptyMessage={emptyMessage} itemCount={logs.length}>
        {logs.map((log) => {
          const detail = getActivityEventDetail(log);
          const entityHref = getActivityEntityHref(log.entity, log.entity_id);

          return (
            <li key={log.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-body-sm font-medium text-body-strong">
                  {formatActivityUserName(log)}
                </span>
                <span className="text-body-sm text-muted">{humanizeAction(log.action)}</span>
                <time
                  dateTime={log.created_at}
                  title={new Date(log.created_at).toLocaleString()}
                  className="ml-auto text-caption text-muted"
                >
                  {formatTime(log.created_at)}
                </time>
              </div>
              {detail && (
                <p className="mt-0.5 truncate text-body-sm text-muted">
                  {entityHref ? (
                    <Link href={entityHref} className="hover:text-body-strong hover:underline">
                      {detail}
                    </Link>
                  ) : (
                    detail
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ListCard>
      {href && logs.length > 0 && (
        <Link href={href} className="block text-right text-caption-uppercase text-primary hover:underline">
          View all activity
        </Link>
      )}
    </div>
  );
}
