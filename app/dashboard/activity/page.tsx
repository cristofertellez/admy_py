import { ActivityTable } from "./activity-table";
import type { Metadata } from "next";
import { query } from "@/lib/turso/client";

interface ActivityLogDbRow {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
}

export const metadata: Metadata = {
  title: "Activity",
};

export default async function ActivityPage() {
  const logs = await query<ActivityLogDbRow>(
    `SELECT al.*, u.first_name AS user_first_name, u.last_name AS user_last_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT 100`,
  );

  const rows: Record<string, unknown>[] = logs.map(
    ({ user_first_name, user_last_name, ...log }) => ({
      ...log,
      users:
        user_first_name !== null && user_last_name !== null
          ? { first_name: user_first_name, last_name: user_last_name }
          : null,
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Activity Log</h1>
        <p className="mt-1 text-body-sm text-muted">Recent actions across the platform.</p>
      </div>
      <ActivityTable logs={rows} />
    </div>
  );
}
