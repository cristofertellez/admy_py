import { requirePermission } from "@/lib/auth";
import { ClientsService } from "@/features/clients";
import { ClientsTable } from "./clients-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
};

const PAGE_SIZE = 20;

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  await requirePermission("clients.read");
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const status =
    params.status === "active" || params.status === "inactive" ? params.status : undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const { data: clients, total } = await ClientsService.list({
    search,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Clients</h1>
          <p className="mt-1 text-body-sm text-muted">Manage your client portfolio.</p>
        </div>
      </div>
      <ClientsTable
        initialClients={clients}
        total={total}
        initialFilters={{ search: search ?? "", status: status ?? "" }}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
