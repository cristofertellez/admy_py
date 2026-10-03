import Link from "next/link";

/**
 * Header bell with the unread count (Historia 13.12). Rendered from the
 * server so the badge is always fresh on navigation.
 */
export function NotificationsBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface-card text-muted transition-colors hover:border-hairline-strong hover:text-body-strong"
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7 2 2 0 10-4 0A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h11zm-3 4a2 2 0 01-3.5-1.5h7A2 2 0 0112 21z"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
