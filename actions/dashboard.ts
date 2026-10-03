"use server";

import { getUser } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { PreferencesService } from "@/features/preferences";
import { DashboardService, type DashboardFilters } from "@/features/dashboard";
import {
  getPanelWidgets,
  type DashboardPanelId,
  type DashboardWidgetConfig,
} from "@/features/dashboard/dashboard-widgets";
import { revalidatePath } from "next/cache";
import type { ModuleReport } from "@/features/reports";

type ActionState = { success?: string; error?: string };

/**
 * Historia 11.11 — persists the widget layout (visibility + order) into the
 * user's dashboard_preferences JSON. Unknown widget ids are ignored and
 * changes are audited (Historia 11.17).
 */
export async function updateDashboardLayout(
  panel: DashboardPanelId,
  widgets: Record<string, DashboardWidgetConfig>,
): Promise<ActionState> {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const valid = getPanelWidgets(panel);
    const sanitized: Record<string, DashboardWidgetConfig> = {};
    for (const definition of valid) {
      const config = widgets[definition.id];
      if (!config) continue;
      sanitized[definition.id] = {
        visible: Boolean(config.visible),
        order: Number.isFinite(config.order) ? config.order : valid.findIndex((w) => w.id === definition.id),
      };
    }

    const preferences = await PreferencesService.get(user.id);
    await PreferencesService.update(user.id, {
      ...preferences,
      dashboard_preferences: { widgets: sanitized },
    });

    await ActivityService.log({
      user_id: user.id,
      action: "updated_dashboard_layout",
      entity: "User",
      entity_id: user.id,
      new_value: { panel, widgets: sanitized },
    });

    revalidatePath("/dashboard");
    return { success: "Dashboard layout saved." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save layout." };
  }
}

/**
 * Historia 11.13 — builds the dashboard export report for the current user
 * and the active global filters. Export events are audited (Historia 11.17).
 */
export async function getDashboardExportReport(filters: DashboardFilters): Promise<
  { report?: ModuleReport; error?: string }
> {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const report = (await DashboardService.getDashboardReport(user, filters)) as ModuleReport;

    await ActivityService.logAccessOnce({
      user_id: user.id,
      action: "exported_dashboard",
      entity: "Dashboard",
      new_value: {
        project: filters.projectId ?? null,
        client: filters.clientId ?? null,
        status: filters.status ?? null,
      },
    });

    return { report };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to build export." };
  }
}
