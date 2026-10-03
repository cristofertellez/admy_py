import { requirePermission } from "@/lib/auth";
import { ActivityLogService, SECURITY_AUDIT_ACTIONS } from "@/features/activity";
import { SettingsService } from "@/features/settings";
import { ActivityService } from "@/services/activity.service";
import { ActivityView } from "./activity-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Activity" };

const PAGE_SIZE = 20;

interface ActivityPageProps {
  searchParams: Promise<{
    search?: string;
    user?: string;
    entity?: string;
    from?: string;
    to?: string;
    view?: string;
    security?: string;
    page?: string;
  }>;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  // Historia 16.14 — the audit log is restricted to admin roles: the
  // users.read permission is only granted to Developer, Administrator and
  // Super Administrator (Clients and Intermediaries never reach this page).
  const actor = await requirePermission("users.read");
  const params = await searchParams;

  // Historia 16.12 — retention policy runs idempotently on the audit page
  // load (same lazy-cron approach as the notification reminders).
  try {
    const retentionRaw = await SettingsService.getValue("audit_retention_days");
    const retentionDays = typeof retentionRaw === "number" ? retentionRaw : 0;
    const purged = await ActivityLogService.applyRetentionPolicy(retentionDays);
    if (purged > 0) {
      await ActivityService.log({
        user_id: actor.id,
        action: "purged_activity_logs",
        entity: "ActivityLog",
        new_value: { retention_days: retentionDays, purged },
      });
    }
  } catch (err) {
    console.error("[activity] retention failed:", err instanceof Error ? err.message : err);
  }

  const search = params.search?.trim() || undefined;
  const userId = params.user || undefined;
  const entity = params.entity || undefined;
  const dateFrom = params.from || undefined;
  const dateTo = params.to || undefined;
  const securityOnly = params.security === "1";
  const view = params.view === "timeline" ? "timeline" : "table";
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  // Historia 16.13 — the security filter scopes the log to security events.
  const actions = securityOnly ? [...SECURITY_AUDIT_ACTIONS] : undefined;

  const [{ data: logs, total }, users, entities] = await Promise.all([
    ActivityLogService.list({ search, userId, entity, dateFrom, dateTo, actions, page, pageSize: PAGE_SIZE }),
    ActivityLogService.getUsersWithActivity(),
    ActivityLogService.getEntities(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Activity Log</h1>
        <p className="mt-1 text-body-sm text-muted">Recent actions across the platform.</p>
      </div>
      <ActivityView
        logs={logs}
        total={total}
        users={users}
        entities={entities}
        initialFilters={{ search: search ?? "", user: userId ?? "", entity: entity ?? "", from: dateFrom ?? "", to: dateTo ?? "" }}
        view={view}
        securityOnly={securityOnly}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
