import { requireAuth, hasPermission } from "@/lib/auth";
import { DashboardService, type DashboardFilters } from "@/features/dashboard";
import { NotificationsService } from "@/features/notifications";
import { ProjectsService } from "@/features/projects";
import { ClientsService } from "@/features/clients";
import { IntermediariesService } from "@/features/intermediaries";
import { PreferencesService } from "@/features/preferences";
import { getCatalogOptions } from "@/features/settings";
import { PROJECT_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/constants";
import { ActivityService } from "@/services/activity.service";
import {
  getPanelWidgets,
  parseWidgetLayout,
  resolveWidgetLayout,
  type DashboardPanelId,
} from "@/features/dashboard/dashboard-widgets";
import { ClientPanel } from "./client-panel";
import { DeveloperPanel } from "./developer-panel";
import { IntermediaryPanel } from "./intermediary-panel";
import { DashboardToolbar } from "./dashboard-toolbar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

const PROJECT_OPTIONS_LIMIT = 200;

// Historias 11.1-11.4 — each role receives its own dashboard. There are no
// shared dashboards: Developers/Administrators get the platform overview,
// Clients see their projects and Intermediaries their assigned portfolio.
// Historias 11.11/11.12 — widgets and global filters are personalizable /
// URL-driven, so every view is shareable.
interface DashboardPageProps {
  searchParams: Promise<{
    project?: string;
    client?: string;
    intermediary?: string;
    status?: string;
    priority?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireAuth();
  const params = await searchParams;

  // Time-based notifications (delays / upcoming deadlines) are generated
  // idempotently on dashboard load; failures must not break the page.
  try {
    await NotificationsService.syncTimeBasedNotifications();
  } catch (err) {
    console.error("[notifications] time-based sync failed:", err instanceof Error ? err.message : err);
  }

  // Historia 11.17 — dashboard access is audited with a dedupe window so
  // routine navigation does not flood the activity log.
  ActivityService.logAccessOnce({
    user_id: user.id,
    action: "viewed_dashboard",
    entity: "Dashboard",
  }).catch(() => undefined);

  const panelId: DashboardPanelId =
    user.role === "Intermediary" ? "intermediary" : user.role === "Client" ? "client" : "developer";

  const [projectList, clientList, intermediaryList, statusOptions, priorityOptions, preferences] =
    await Promise.all([
      ProjectsService.list({ pageSize: PROJECT_OPTIONS_LIMIT }).catch(() => ({ data: [], total: 0 })),
      ClientsService.list({ pageSize: PROJECT_OPTIONS_LIMIT }).catch(() => ({ data: [], total: 0 })),
      IntermediariesService.list({ pageSize: PROJECT_OPTIONS_LIMIT }).catch(() => ({ data: [], total: 0 })),
      getCatalogOptions("project_statuses", PROJECT_STATUS_OPTIONS).catch(() => PROJECT_STATUS_OPTIONS),
      getCatalogOptions("task_priorities", TASK_PRIORITY_OPTIONS).catch(() => TASK_PRIORITY_OPTIONS),
      PreferencesService.get(user.id).catch(() => null),
    ]);

  const projectOptions = projectList.data.map((project) => ({ id: project.id, name: project.name }));
  const clientOptions = clientList.data.map((client) => ({
    id: client.id,
    name: client.company_name ?? client.contact_name,
  }));
  const intermediaryOptions = intermediaryList.data.map((intermediary) => ({
    id: intermediary.id,
    name: `${intermediary.first_name ?? ""} ${intermediary.last_name ?? ""}`.trim() || intermediary.email,
  }));

  // URL filters are validated against the option lists (Historia 11.12).
  const filters: DashboardFilters = {
    projectId: projectOptions.some((option) => option.id === params.project) ? params.project : undefined,
    clientId: clientOptions.some((option) => option.id === params.client) ? params.client : undefined,
    intermediaryId: intermediaryOptions.some((option) => option.id === params.intermediary)
      ? params.intermediary
      : undefined,
    status: statusOptions.some((option) => option.value === params.status) ? params.status : undefined,
    priority: priorityOptions.some((option) => option.value === params.priority) ? params.priority : undefined,
    from: params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : undefined,
    to: params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : undefined,
  };

  const widgetDefinitions = getPanelWidgets(panelId);
  const savedLayout = preferences ? parseWidgetLayout(preferences.dashboard_preferences) : null;
  const widgets = resolveWidgetLayout(panelId, savedLayout);

  const toolbar = (
    <DashboardToolbar
      panel={panelId}
      widgets={widgetDefinitions}
      savedLayout={savedLayout}
      filterOptions={{
        projects: projectOptions,
        clients: panelId === "developer" ? clientOptions : [],
        intermediaries: panelId === "developer" ? intermediaryOptions : [],
        statuses: statusOptions,
        priorities: priorityOptions,
      }}
      initialFilters={{
        project: filters.projectId ?? "",
        client: filters.clientId ?? "",
        intermediary: filters.intermediaryId ?? "",
        status: filters.status ?? "",
        priority: filters.priority ?? "",
        from: filters.from ?? "",
        to: filters.to ?? "",
      }}
      canExport={hasPermission(user, "reports.view")}
    />
  );

  if (panelId === "intermediary") {
    const panel = await DashboardService.getIntermediaryPanel(user, filters);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-display-sm text-ink">Welcome, {user.first_name}</h1>
          <p className="mt-1 text-body-sm text-muted">Here's what's happening with your clients.</p>
        </div>
        {toolbar}
        <IntermediaryPanel data={panel} widgets={widgets} />
      </div>
    );
  }

  if (panelId === "client") {
    const panel = await DashboardService.getClientDashboard(user, filters);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-display-sm text-ink">Welcome, {user.first_name}</h1>
          <p className="mt-1 text-body-sm text-muted">Here's the progress of your projects.</p>
        </div>
        {toolbar}
        <ClientPanel data={panel} widgets={widgets} />
      </div>
    );
  }

  const panel = await DashboardService.getDeveloperDashboard(filters);
  return <DeveloperPanel data={panel} widgets={widgets} filterSlot={toolbar} />;
}
