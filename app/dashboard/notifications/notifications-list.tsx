"use client";

import { markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import { useTransition } from "react";

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

const TYPE_LABELS: Record<string, string> = {
  project_updated: "Project updated",
  comment_created: "New comment",
  task_created: "New task",
  project_completed: "Project completed",
  project_delayed: "Project delayed",
  deadline_upcoming: "Upcoming deadline",
};

const TYPE_VARIANTS: Record<string, "default" | "success" | "error" | "warning"> = {
  project_updated: "default",
  comment_created: "default",
  task_created: "default",
  project_completed: "success",
  project_delayed: "error",
  deadline_upcoming: "warning",
};

function getEntityHref(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;

  switch (entityType) {
    case "Project":
      return `/dashboard/projects/${entityId}`;
    case "Task":
      return `/dashboard/tasks/${entityId}`;
    case "Milestone":
      return "/dashboard/milestones";
    default:
      return null;
  }
}

export function NotificationsList({
  notifications,
  unreadCount,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  const [, startTransition] = useTransition();

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markAsRead(id);
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead();
    });
  }

  if (notifications.length === 0) {
    return (
      <p className="text-body-sm text-muted-soft">No notifications yet. You&apos;ll see updates here when activity occurs.</p>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleMarkAllRead} size="sm">
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const href = getEntityHref(n.entity_type, n.entity_id);
          return (
            <Card key={n.id} className={n.is_read ? "opacity-70" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                      <span className="text-body-sm font-medium text-body-strong">{n.title}</span>
                      <Badge variant={TYPE_VARIANTS[n.type] ?? "default"}>
                        {TYPE_LABELS[n.type] ?? n.type}
                      </Badge>
                    </div>
                    {n.message && <p className="mt-1 text-body-sm text-muted">{n.message}</p>}
                    <div className="mt-1 flex items-center gap-2 text-caption text-muted">
                      <span>{new Date(n.created_at).toLocaleDateString()}</span>
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
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 text-caption text-primary hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
