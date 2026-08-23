import { requirePermission } from "@/lib/auth";
import { ActivityLogService } from "@/features/activity";
import { ActivityView } from "./activity-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity",
};

const PAGE_SIZE = 20;

interface ActivityPageProps {
  searchParams: Promise<{
    search?: string;
    user?: string;
    entity?: string;
    view?: string;
    page?: string;
  }>;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  await requirePermission("users.read");
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const userId = params.user || undefined;
  const entity = params.entity || undefined;
  const view = params.view === "timeline" ? "timeline" : "table";
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const [{ data: logs, total }, users, entities] = await Promise.all([
    ActivityLogService.list({ search, userId, entity, page, pageSize: PAGE_SIZE }),
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
        initialFilters={{ search: search ?? "", user: userId ?? "", entity: entity ?? "" }}
        view={view}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
