import { requireAuth } from "@/lib/auth";
import { DashboardService } from "@/features/dashboard";
import { NotificationsService } from "@/features/notifications";
import { ClientPanel } from "./client-panel";
import { DeveloperPanel } from "./developer-panel";
import { IntermediaryPanel } from "./intermediary-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// Historias 11.1-11.4 — each role receives its own dashboard. There are no
// shared dashboards: Developers/Administrators get the platform overview,
// Clients see their projects and Intermediaries their assigned portfolio.
export default async function DashboardPage() {
  const user = await requireAuth();

  // Time-based notifications (delays / upcoming deadlines) are generated
  // idempotently on dashboard load; failures must not break the page.
  try {
    await NotificationsService.syncTimeBasedNotifications();
  } catch (err) {
    console.error("[notifications] time-based sync failed:", err instanceof Error ? err.message : err);
  }

  if (user.role === "Intermediary") {
    const panel = await DashboardService.getIntermediaryPanel(user);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-display-sm text-ink">Welcome, {user.first_name}</h1>
          <p className="mt-1 text-body-sm text-muted">Here's what's happening with your clients.</p>
        </div>
        <IntermediaryPanel data={panel} />
      </div>
    );
  }

  if (user.role === "Client") {
    const panel = await DashboardService.getClientDashboard(user);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-display-sm text-ink">Welcome, {user.first_name}</h1>
          <p className="mt-1 text-body-sm text-muted">Here's the progress of your projects.</p>
        </div>
        <ClientPanel data={panel} />
      </div>
    );
  }

  const panel = await DashboardService.getDeveloperDashboard();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Welcome, {user.first_name}</h1>
        <p className="mt-1 text-body-sm text-muted">Here's an overview of the platform.</p>
      </div>
      <DeveloperPanel data={panel} />
    </div>
  );
}
