import { requireAuth, getUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  IntermediariesService,
  IntermediaryReportsService,
} from "@/features/intermediaries";
import type { IntermediaryRecord, UpcomingDelivery } from "@/features/intermediaries";
import { ClientsService, isClientHistoryCategory } from "@/features/clients";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import type { Metadata } from "next";
import { IntermediaryTabs } from "./intermediary-tabs";
import { ReportExportButtons } from "./report-export-buttons";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const HISTORY_PAGE_SIZE = 15;

// Developers manage any intermediary; an intermediary may view their own portfolio (Historia 5.12).
async function assertCanViewIntermediaryDetail(intermediaryId: string) {
  const actor = await requireAuth();
  if (!hasPermission(actor, "intermediaries.read") && actor.id !== intermediaryId) {
    redirect("/unauthorized");
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  await assertCanViewIntermediaryDetail(id);
  const data = await IntermediariesService.getById(id);
  return { title: `${data.first_name} ${data.last_name}` };
}

export default async function IntermediaryDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  await assertCanViewIntermediaryDetail(id);

  // Timeline tab state (active tab, search, category and page) lives in the URL
  // so filtered history views are shareable and survive reloads.
  const resolvedSearchParams = await searchParams;
  const historySearch = firstParam(resolvedSearchParams.q)?.trim() || undefined;
  const categoryParam = firstParam(resolvedSearchParams.category);
  const historyCategory = isClientHistoryCategory(categoryParam) ? categoryParam : null;
  const historyPage = Math.max(
    1,
    Number.parseInt(firstParam(resolvedSearchParams.page) ?? "", 10) || 1,
  );

  const intermediary: IntermediaryRecord = await IntermediariesService.getById(id);
  const clients = await IntermediariesService.getAssignedClients(id);

  const [report, lastActivity, history] = await Promise.all([
    IntermediaryReportsService.getReport(id),
    IntermediariesService.getLastActivity(id),
    IntermediariesService.getHistory(id, {
      search: historySearch,
      category: historyCategory,
      page: historyPage,
      pageSize: HISTORY_PAGE_SIZE,
    }),
  ]);

  const actor = await getUser();
  const canManage = actor ? hasPermission(actor, "clients.update") : false;
  const candidates = canManage ? await ClientsService.listCandidatesForIntermediary() : [];

  const totalProjects = report.projects.length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/intermediaries" className="text-body-sm text-muted hover:text-body-strong">← Back</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-display-sm text-ink">{intermediary.first_name} {intermediary.last_name}</h1>
          <Badge variant={intermediary.is_active ? "success" : "error"}>
            {intermediary.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-muted">Portfolio overview for this intermediary.</p>
        <ReportExportButtons report={report} />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard value={totalProjects} label="Total Projects" />
        <StatCard value={report.summary.activeProjects} label="Active Projects" />
        <StatCard value={report.summary.completedProjects} label="Completed Projects" />
        <StatCard value={`${Math.round(report.summary.productivity.workedHours)}h`} label="Worked Hours" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingDeliveriesCard deliveries={report.upcomingDeliveries.slice(0, 5)} />
        <LastActivityCard activity={lastActivity} />
      </div>

      <IntermediaryTabs
        intermediaryId={id}
        firstName={intermediary.first_name}
        lastName={intermediary.last_name}
        email={intermediary.email}
        phone={intermediary.phone}
        createdAt={intermediary.created_at}
        isActive={intermediary.is_active}
        clients={clients.map((client) => ({
          id: client.id,
          company_name: client.company_name,
          is_active: client.is_active,
        }))}
        candidates={candidates}
        canManage={canManage}
        projects={report.projects}
        history={history}
        historyFilters={{ search: historySearch, category: historyCategory }}
      />
    </div>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <p className="text-display-md text-ink">{value}</p>
        <p className="text-caption text-muted">{label}</p>
      </CardContent>
    </Card>
  );
}

function UpcomingDeliveriesCard({ deliveries }: { deliveries: UpcomingDelivery[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deliveries</CardTitle>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <p className="text-body-sm text-muted-soft">No upcoming deliveries.</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {deliveries.map((delivery) => (
              <li key={`${delivery.type}-${delivery.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="truncate text-body-sm font-medium text-body-strong">{delivery.title}</span>
                <Badge variant={delivery.type === "Milestone" ? "default" : "warning"}>{delivery.type}</Badge>
                {delivery.project_name && (
                  <span className="truncate text-caption text-muted">{delivery.project_name}</span>
                )}
                <time dateTime={delivery.due_date} className="ml-auto text-caption text-muted">
                  {new Date(delivery.due_date).toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function LastActivityCard({
  activity,
}: {
  activity: {
    action: string;
    entity: string;
    created_at: string;
    user_first_name: string | null;
    user_last_name: string | null;
  } | null;
}) {
  const actorName = activity
    ? [activity.user_first_name, activity.user_last_name].filter(Boolean).join(" ").trim() || "System"
    : "System";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity ? (
          <div className="space-y-1">
            <p className="text-body-sm capitalize text-body-strong">
              {actorName} · {activity.action.replace(/_/g, " ")}
            </p>
            <p className="text-caption text-muted">
              <Badge>{activity.entity}</Badge>{" "}
              <time dateTime={activity.created_at} title={new Date(activity.created_at).toLocaleString()}>
                {new Date(activity.created_at).toLocaleString()}
              </time>
            </p>
          </div>
        ) : (
          <p className="text-body-sm text-muted-soft">No activity recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
