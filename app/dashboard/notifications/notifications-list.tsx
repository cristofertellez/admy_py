"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  markAsRead,
  markAsUnread,
  markAllAsRead,
  dismissNotification,
} from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { useDebounce } from "@/hooks/use-debounce";

interface NotificationRow {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  entity_type: string | null;
  entity_id: string | null;
  sender: { first_name: string; last_name: string } | null;
}

interface NotificationsListProps {
  notifications: NotificationRow[];
  total: number;
  page: number;
  totalPages: number;
  typeLabels: Record<string, string>;
  initialFilters: { search: string; type: string; read: string; from: string; to: string };
}

const TYPE_VARIANTS: Record<string, "default" | "success" | "error" | "warning"> = {
  project_updated: "default",
  comment_created: "default",
  task_created: "default",
  project_completed: "success",
  project_delayed: "error",
  deadline_upcoming: "warning",
  project_created: "default",
  project_status_changed: "default",
  task_assigned: "default",
  task_status_changed: "default",
  task_completed: "success",
  task_due_soon: "warning",
  task_blocked: "error",
  subtask_created: "default",
  milestone_completed: "success",
  file_uploaded: "default",
  reminder: "warning",
};

function getEntityHref(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;

  switch (entityType) {
    case "Project":
      return `/dashboard/projects/${entityId}`;
    case "Task":
      return `/dashboard/tasks/${entityId}`;
    case "Milestone":
      return null;
    default:
      return null;
  }
}

/** Groups notifications under human date headers (Historia 13.1). */
function getDateGroup(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function NotificationsList({
  notifications,
  total,
  page,
  totalPages,
  typeLabels,
  initialFilters,
}: NotificationsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState(false);

  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  function navigate(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  useEffect(() => {
    if (debouncedSearch === initialFilters.search) return;
    navigate({ search: debouncedSearch || undefined, page: undefined });
  }, [debouncedSearch]);

  function handleAction(action: () => Promise<unknown>) {
    setPendingAction(true);
    startTransition(async () => {
      await action();
      setPendingAction(false);
    });
  }

  const selectClasses =
    "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  const grouped: { group: string; items: NotificationRow[] }[] = [];
  for (const notification of notifications) {
    const group = getDateGroup(notification.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.group === group) last.items.push(notification);
    else grouped.push({ group, items: [notification] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="notification-search" className="sr-only">
            Search notifications
          </label>
          <input
            id="notification-search"
            type="search"
            placeholder="Search notifications..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={selectClasses}
          />
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="notification-type-filter" className="sr-only">
            Filter by type
          </label>
          <select
            id="notification-type-filter"
            value={initialFilters.type}
            onChange={(e) => navigate({ type: e.target.value || undefined, page: undefined })}
            className={selectClasses}
          >
            <option value="">All types</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="notification-read-filter" className="sr-only">
            Filter by read state
          </label>
          <select
            id="notification-read-filter"
            value={initialFilters.read}
            onChange={(e) => navigate({ read: e.target.value || undefined, page: undefined })}
            className={selectClasses}
          >
            <option value="">All states</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
        <div className="w-full sm:w-36">
          <label htmlFor="notification-from-filter" className="sr-only">
            From date
          </label>
          <input
            id="notification-from-filter"
            type="date"
            value={initialFilters.from}
            onChange={(e) => navigate({ from: e.target.value || undefined, page: undefined })}
            className={selectClasses}
          />
        </div>
        <div className="w-full sm:w-36">
          <label htmlFor="notification-to-filter" className="sr-only">
            To date
          </label>
          <input
            id="notification-to-filter"
            type="date"
            value={initialFilters.to}
            onChange={(e) => navigate({ to: e.target.value || undefined, page: undefined })}
            className={selectClasses}
          />
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-caption text-muted">
            {total} notification{total === 1 ? "" : "s"}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction(() => markAllAsRead())}
            disabled={pendingAction}
          >
            Mark all as read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-body-sm text-muted-soft">
              No notifications match the current filters. You'll see updates here when activity occurs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ group, items }) => (
            <section key={group} aria-label={group}>
              <h2 className="mb-2 text-body-sm font-semibold uppercase tracking-wide text-muted">
                {group}
              </h2>
              <div className="space-y-2">
                {items.map((n) => {
                  const href = getEntityHref(n.entity_type, n.entity_id);
                  return (
                    <Card key={n.id} className={n.is_read ? "opacity-70" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                              <span className="text-body-sm font-medium text-body-strong">{n.title}</span>
                              <Badge variant={TYPE_VARIANTS[n.type] ?? "default"}>
                                {typeLabels[n.type] ?? n.type}
                              </Badge>
                            </div>
                            {n.message && <p className="mt-1 text-body-sm text-muted">{n.message}</p>}
                            <div className="mt-1 flex items-center gap-2 text-caption text-muted">
                              <time dateTime={n.created_at}>
                                {new Date(n.created_at).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </time>
                              {n.sender && (
                                <span>
                                  by {n.sender.first_name} {n.sender.last_name}
                                </span>
                              )}
                              {href && (
                                <Link href={href} className="text-primary hover:underline">
                                  View {n.entity_type?.toLowerCase()}
                                </Link>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <button
                              onClick={() =>
                                handleAction(() =>
                                  n.is_read ? markAsUnread(n.id) : markAsRead(n.id),
                                )
                              }
                              className="text-caption text-primary hover:underline"
                            >
                              {n.is_read ? "Mark unread" : "Mark read"}
                            </button>
                            <button
                              onClick={() => handleAction(() => dismissNotification(n.id))}
                              className="text-caption text-muted hover:text-error hover:underline"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Notifications pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <span className="text-caption text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => navigate({ page: String(page + 1) })}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
