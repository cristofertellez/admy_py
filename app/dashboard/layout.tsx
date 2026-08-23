import { requireAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div>
      <Header>
        <DashboardSidebar />
        <ConnectivityIndicator />
        <DashboardHeaderActions />
      </Header>
      <main className="pt-16 lg:pl-64">
        <OfflineBanner />
        <div className="p-6">{children}</div>
      </main>
      <InstallPrompt />
      <OfflineSyncManager />
    </div>
  );
}
