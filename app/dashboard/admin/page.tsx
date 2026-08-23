import { requirePermission } from "@/lib/auth";
import { DashboardService } from "@/features/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { BarChart } from "@/components/charts";
import { AutoRefresh } from "./auto-refresh";
import { RecentLogins } from "./recent-logins";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  await requirePermission("users.read");
  const overview = await DashboardService.getAdminOverview();

  const userStatCards = [
    { label: "Active Users", value: overview.users.activeUsers, color: "text-success" },
    { label: "Inactive Users", value: overview.users.inactiveUsers, color: "text-error" },
    { label: "Total Users", value: overview.users.totalUsers, color: "text-ink" },
    { label: "Roles", value: overview.roleDistribution.length, color: "text-accent-violet" },
    { label: "Logins Today", value: overview.users.loginsToday, color: "text-primary" },
    { label: "Logins This Week", value: overview.users.loginsThisWeek, color: "text-accent-cyan" },
  ];

  const roleChartData = overview.roleDistribution.map((role) => ({
    label: role.name,
    value: role.userCount,
  }));

  const platformCards = [
    { label: "Active Projects", value: overview.platform.activeProjects },
    { label: "Completed Projects", value: overview.platform.completedProjects },
    {
      label: "Total Tasks",
      value:
        overview.platform.pendingTasks +
        overview.platform.inProgressTasks +
        overview.platform.blockedTasks +
        overview.platform.completedTasks,
    },
    { label: "Completed Tasks", value: overview.platform.completedTasks },
    { label: "Total Clients", value: overview.platform.totalClients },
    { label: "Active Clients", value: overview.platform.activeClients },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div>
        <h1 className="text-display-sm text-ink">Admin Dashboard</h1>
        <p className="mt-1 text-body-sm text-muted">
          User activity and platform statistics. Data refreshes automatically every minute.
        </p>
      </div>

      <section aria-label="User statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userStatCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6 text-center">
                <p className={`text-display-md ${s.color}`}>{s.value}</p>
                <p className="text-caption text-muted">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <span className="text-caption text-muted">{overview.roleDistribution.length} roles</span>
          </CardHeader>
          <CardContent>
            <BarChart data={roleChartData} />
          </CardContent>
        </Card>
        <RecentLogins logins={overview.recentLogins} />
      </div>

      <section aria-label="Platform statistics">
        <h2 className="mb-4 text-title-md text-ink">Platform Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platformCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6 text-center">
                <p className="text-display-lg text-ink">{s.value}</p>
                <p className="text-caption text-muted">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
