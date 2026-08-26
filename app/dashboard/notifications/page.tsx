import { NotificationsService } from "@/features/notifications";
import { getUser } from "@/lib/auth";
import { NotificationsList } from "./notifications-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) return null;

  // Time-based notifications (delays / upcoming deadlines) are generated
  // idempotently on load; dedupe keys prevent duplicates.
  await NotificationsService.syncTimeBasedNotifications();

  const { data: notifications } = await NotificationsService.list(user.id, { pageSize: 50 });
  const unreadCount = await NotificationsService.getUnreadCount(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Notifications</h1>
          <p className="mt-1 text-body-sm text-muted">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
      </div>
      <NotificationsList notifications={notifications} unreadCount={unreadCount} />
    </div>
  );
}
