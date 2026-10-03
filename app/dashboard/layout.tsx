import { requireAuth } from "@/lib/auth";
import { SettingsService } from "@/features/settings";
import { NotificationsService } from "@/features/notifications";
import { Header } from "@/components/layout/header";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ConnectivityIndicator } from "@/components/pwa/connectivity-indicator";
import { OfflineSyncManager } from "@/components/pwa/offline-sync-manager";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeaderActions } from "./header-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DEFAULT_PRIMARY = "#6D28D9";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  const [primaryRaw, systemMessage, unreadCount] = await Promise.all([
    SettingsService.getValue("primary_color"),
    SettingsService.getValue("system_message"),
    NotificationsService.getUnreadCount(user.id).catch(() => 0),
  ]);
  const primary =
    typeof primaryRaw === "string" && /^#[0-9A-Fa-f]{6}$/.test(primaryRaw) ? primaryRaw : DEFAULT_PRIMARY;
  const announcement = typeof systemMessage === "string" ? systemMessage.trim() : "";

  return (
    <div>
      <style>{`:root { --primary: ${primary}; }`}</style>
      <Header>
        <DashboardSidebar role={user.role} userId={user.id} />
        <ConnectivityIndicator />
        <NotificationsBell unreadCount={unreadCount} />
        <DashboardHeaderActions />
      </Header>
      <main className="pt-16 lg:pl-64">
        <OfflineBanner />
        {announcement && (
          <div className="mx-6 mt-4 rounded-lg bg-primary/10 px-4 py-3 text-body-sm text-primary">
            {announcement}
          </div>
        )}
        <div className="p-6">{children}</div>
      </main>
      <InstallPrompt />
      <OfflineSyncManager />
    </div>
  );
}
