import { getUser, hasPermission, requirePermission } from "@/lib/auth";
import { isAccessDeniedError } from "@/lib/auth-scope";
import { ClientsService, isClientHistoryCategory } from "@/features/clients";
import { FilesService } from "@/features/files";
import { CommentsService } from "@/features/comments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ClientTabs } from "./client-tabs";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const FINALIZED_STATUSES = ["Completed", "Cancelled", "Archived"];
const HISTORY_PAGE_SIZE = 15;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  await requirePermission("clients.read");
  try {
    const client = await ClientsService.getById(id);
    return { title: client.company_name };
  } catch {
    return { title: "Client" };
  }
}

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  await requirePermission("clients.read");

  // Timeline tab state (active tab, search, category and page) lives in the URL
  // so filtered history views are shareable and survive reloads.
  const resolvedSearchParams = await searchParams;
  const historySearch = firstParam(resolvedSearchParams.q)?.trim() || undefined;
  const categoryParam = firstParam(resolvedSearchParams.category);
  const historyCategory = isClientHistoryCategory(categoryParam) ? categoryParam : null;
  const historyPage = Math.max(1, Number.parseInt(firstParam(resolvedSearchParams.page) ?? "", 10) || 1);

  let client;
  try {
    client = await ClientsService.getById(id);
  } catch (err) {
    if (isAccessDeniedError(err)) redirect("/unauthorized");
    throw err;
  }

  const actor = await getUser();
  const canManageIntermediary = actor ? hasPermission(actor, "clients.update") : false;
  const canUploadFiles = actor ? hasPermission(actor, "files.upload") : false;
  const canDeleteFiles = actor ? hasPermission(actor, "files.delete") : false;
  const canDownloadFiles = actor ? hasPermission(actor, "files.download") || canUploadFiles : false;
  const canCreateComments = actor ? hasPermission(actor, "comments.create") : false;
  const canModerateComments = actor
    ? hasPermission(actor, "comments.update") || hasPermission(actor, "comments.delete")
    : false;

  const [intermediary, projects, history, availableIntermediaries, files, comments, upcomingDeliveries, lastActivity] =
    await Promise.all([
      ClientsService.getAssignedIntermediary(id),
      ClientsService.getProjects(id),
      ClientsService.getClientHistory(id, {
        search: historySearch,
        category: historyCategory,
        page: historyPage,
        pageSize: HISTORY_PAGE_SIZE,
      }),
      canManageIntermediary ? ClientsService.listAvailableIntermediaries() : Promise.resolve([]),
      FilesService.list({ entityType: "client", entityId: id, pageSize: 100 }),
      CommentsService.listByClient(id),
      ClientsService.getUpcomingDeliveries(id),
      ClientsService.getLastActivity(id),
    ]);

  const activeCount = projects.filter((p) => !FINALIZED_STATUSES.includes(p.status)).length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/clients" className="text-body-sm text-muted hover:text-body-strong">
            ← Back to Clients
          </Link>
          <h1 className="mt-2 text-display-sm text-ink">{client.company_name}</h1>
        </div>
        <Badge variant={client.is_active ? "success" : "error"}>
          {client.is_active ? "Active" : "Archived"}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard value={projects.length} label="Total Projects" />
        <StatCard value={activeCount} label="Active Projects" />
        <StatCard value={completedCount} label="Completed Projects" />
        <StatCard
          value={`${Math.round(projects.reduce((sum, p) => sum + (p.worked_hours || 0), 0))}h`}
          label="Worked Hours"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingDeliveriesCard
          deliveries={upcomingDeliveries as Array<{
            id: string;
            title: string;
            estimated_date: string | null;
            status: string;
            project_name: string;
          }>}
        />
        <LastActivityCard
          activity={lastActivity as {
            action: string;
            entity: string;
            created_at: string;
            user_first_name: string | null;
            user_last_name: string | null;
          } | null}
        />
      </div>

      <ClientTabs
        clientId={id}
        company_name={client.company_name}
        contact_name={client.contact_name}
        email={client.email}
        phone={client.phone}
        address={client.address}
        country={client.country}
        city={client.city}
        website={client.website}
        notes={client.notes}
        isActive={client.is_active}
        createdAt={client.created_at}
        intermediary={intermediary}
        projects={projects}
        history={history}
        historyFilters={{ search: historySearch, category: historyCategory }}
        canManageIntermediary={canManageIntermediary}
        availableIntermediaries={availableIntermediaries}
        documents={files.data as never[]}
        canUploadFiles={canUploadFiles}
        canDeleteFiles={canDeleteFiles}
        canDownloadFiles={canDownloadFiles}
        comments={comments as never[]}
        currentUserId={actor?.id ?? null}
        canCreateComments={canCreateComments}
        canModerateComments={canModerateComments}
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

interface DeliveryRow {
  id: string;
  title: string;
  estimated_date: string | null;
  status: string;
  project_name: string;
}

function UpcomingDeliveriesCard({ deliveries }: { deliveries: DeliveryRow[] }) {
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
              <li key={delivery.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="text-body-sm font-medium text-body-strong truncate">
                  {delivery.title}
                </span>
                <span className="text-caption text-muted truncate">{delivery.project_name}</span>
                <time
                  dateTime={delivery.estimated_date ?? undefined}
                  className="ml-auto text-caption text-muted"
                >
                  {delivery.estimated_date
                    ? new Date(delivery.estimated_date).toLocaleDateString()
                    : "No date"}
                </time>
                <Badge variant={delivery.status === "Completed" ? "success" : "warning"}>
                  {delivery.status}
                </Badge>
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
    ? [activity.user_first_name, activity.user_last_name].filter(Boolean).join(" ").trim() ||
      "System"
    : "System";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity ? (
          <div className="space-y-1">
            <p className="text-body-sm text-body-strong capitalize">
              {actorName} · {activity.action.replace(/_/g, " ")}
            </p>
            <p className="text-caption text-muted">
              <Badge>{activity.entity}</Badge>{" "}
              <time
                dateTime={activity.created_at}
                title={new Date(activity.created_at).toLocaleString()}
              >
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
