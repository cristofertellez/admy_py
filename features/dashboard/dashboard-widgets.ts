// Historia 11.11 — Personalizable dashboard. Widget registries per role
// panel plus the pure resolver used by the server pages. The saved layout
// lives in users.dashboard_preferences (JSON, managed by PreferencesService).

export interface DashboardWidgetDefinition {
  id: string;
  label: string;
}

export interface DashboardWidgetConfig {
  visible: boolean;
  order: number;
}

export type WidgetLayoutMap = Record<string, DashboardWidgetConfig>;

const DEVELOPER_WIDGETS: DashboardWidgetDefinition[] = [
  { id: "taskStatusChart", label: "Tasks by Status" },
  { id: "projectStatusChart", label: "Projects by Status" },
  { id: "hoursChart", label: "Hours — Estimated vs Worked" },
  { id: "upcomingMilestones", label: "Upcoming Milestones" },
  { id: "atRiskProjects", label: "Projects at Risk" },
  { id: "recentActivity", label: "Recent Activity" },
  { id: "recentComments", label: "Recent Comments" },
  { id: "recentFiles", label: "Recent Files" },
];

const CLIENT_WIDGETS: DashboardWidgetDefinition[] = [
  { id: "myProjects", label: "My Projects" },
  { id: "upcomingMilestones", label: "Upcoming Milestones" },
  { id: "upcomingDeliveries", label: "Upcoming Deliveries" },
  { id: "recentComments", label: "Recent Comments" },
  { id: "recentFiles", label: "Recent Files" },
];

const INTERMEDIARY_WIDGETS: DashboardWidgetDefinition[] = [
  { id: "dueSoonProjects", label: "Projects Due Soon" },
  { id: "pendingTasks", label: "Pending Tasks" },
  { id: "recentComments", label: "Latest Comments" },
];

export type DashboardPanelId = "developer" | "client" | "intermediary";

export function getPanelWidgets(panel: DashboardPanelId): DashboardWidgetDefinition[] {
  switch (panel) {
    case "developer":
      return DEVELOPER_WIDGETS;
    case "client":
      return CLIENT_WIDGETS;
    case "intermediary":
      return INTERMEDIARY_WIDGETS;
  }
}

/** Parses the persisted layout (object or raw JSON string), ignoring unknown ids. */
export function parseWidgetLayout(raw: unknown): WidgetLayoutMap | null {
  if (!raw) return null;
  let parsed: { widgets?: unknown };
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as { widgets?: unknown };
    } catch {
      return null;
    }
  } else if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    parsed = raw as { widgets?: unknown };
  } else {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || !parsed.widgets || typeof parsed.widgets !== "object") {
    return null;
  }

  const layout: WidgetLayoutMap = {};
  for (const [id, config] of Object.entries(parsed.widgets as Record<string, unknown>)) {
    if (
      config &&
      typeof config === "object" &&
      typeof (config as DashboardWidgetConfig).visible === "boolean" &&
      typeof (config as DashboardWidgetConfig).order === "number"
    ) {
      layout[id] = {
        visible: (config as DashboardWidgetConfig).visible,
        order: (config as DashboardWidgetConfig).order,
      };
    }
  }
  return layout;
}

/**
 * Ordered list of visible widgets for the panel: saved order first (with
 * new widgets appended) and hidden ones removed.
 */
export function resolveWidgetLayout(
  panel: DashboardPanelId,
  saved: WidgetLayoutMap | null,
): { id: string; label: string }[] {
  const definitions = getPanelWidgets(panel);
  if (!saved) return definitions;

  return definitions
    .map((definition, index) => ({
      definition,
      order: typeof saved[definition.id]?.order === "number" ? saved[definition.id].order : index,
    }))
    .filter((entry) => saved[entry.definition.id]?.visible !== false)
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.definition);
}
