import { requireAuth, hasPermission } from "@/lib/auth";
import { canAccessRoute } from "@/lib/routes";
import { ActivityLogService, SECURITY_AUDIT_ACTIONS } from "@/features/activity";
import { ProjectsService } from "@/features/projects";
import { SettingsService } from "@/features/settings";
import { ActivityService } from "@/services/activity.service";
import { redirect } from "next/navigation";
import { ActivityView } from "./activity-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Activity" };

const PAGE_SIZE = 20;
const PROJECT_OPTIONS_LIMIT = 200;

interface ActivityPageProps {
  searchParams: Promise<{
    search?: string;
    user?: string;
    entity?: string;
    project?: string;
    from?: string;
    to?: string;
    view?: string;
    security?: string;
    page?: string;
  }>;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  // Historia 16.14 — the audit log is restricted to admin roles
  // (canAccessRoute). Administrator receives read-only consultation;
  // exports and the retention maintenance additionally require users.read
  // / settings.update respectively.
  const actor = await requireAuth();
  if (!canAccessRoute("/dashboard/activity", actor.role)) {
    redirect("/unauthorized");
  }

  const canExport = hasPermission(actor, "users.read");
  const canMaintain = hasPermission(actor, "settings.update");

  const params = await searchParams;

  // Historia 16.12 — retention policy runs idempotently on the audit page
  // load for settings-capable roles (same lazy-cron approach as reminders).
  if (canMaintain) {
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
  }

  const search = params.search?.trim() || undefined;
  const userId = params.user || undefined;
  const entity = params.entity || undefined;
  const dateFrom = params.from || undefined;
  const dateTo = params.to || undefined;
  const securityOnly = params.security === "1";
  const view = params.view === "timeline" ? "timeline" : "table";
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  // Historias 13.7/16.9 — the project filter is validated against the
  // visible project options before reaching the service.
  const projectList = await ProjectsService.list({ pageSize: PROJECT_OPTIONS_LIMIT }).catch(() => ({
    data: [],
    total: 0,
  }));
  const projectOptions = projectList.data.map((project) => ({ id: project.id, name: project.name }));
  const projectId = projectOptions.some((option) => option.id === params.project)
    ? params.project
    : undefined;

  // Historia 16.13 — the security filter scopes the log to security events.
  const actions = securityOnly ? [...SECURITY_AUDIT_ACTIONS] : undefined;

  const [{ data: logs, total }, users, entities] = await Promise.all([
    ActivityLogService.list({ search, userId, entity, projectId, dateFrom, dateTo, actions, page, pageSize: PAGE_SIZE }),
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
        projectOptions={projectOptions}
        initialFilters={{
          search: search ?? "",
          user: userId ?? "",
          entity: entity ?? "",
          project: projectId ?? "",
          from: dateFrom ?? "",
          to: dateTo ?? "",
        }}
        view={view}
        securityOnly={securityOnly}
        canExport={canExport}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
