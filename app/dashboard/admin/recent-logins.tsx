import { Badge } from "@/components/shared/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { formatDateTime } from "@/lib/utils";
import type { RecentLogin } from "@/features/dashboard";

interface RecentLoginsProps {
  logins: RecentLogin[];
}

export function RecentLogins({ logins }: RecentLoginsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sign-ins</CardTitle>
        <span className="text-caption text-muted">Last {logins.length}</span>
      </CardHeader>
      <CardContent>
        {logins.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-muted-soft">No sign-ins recorded yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {logins.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-card-elevated text-caption font-semibold text-body-strong"
                >
                  {getUserInitials(user)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm text-body-strong">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="truncate text-caption text-muted">{user.email}</p>
                </div>
                <Badge>{user.role_name}</Badge>
                <time
                  dateTime={user.last_login}
                  title={user.last_login}
                  className="hidden whitespace-nowrap text-caption text-muted md:block"
                >
                  {formatDateTime(user.last_login)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function getUserInitials(user: Pick<RecentLogin, "first_name" | "last_name">): string {
  const initials = `${user.first_name?.charAt(0) ?? ""}${user.last_name?.charAt(0) ?? ""}`.toUpperCase();
  return initials || "?";
}
