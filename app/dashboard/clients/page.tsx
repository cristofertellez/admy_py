import { ClientsService } from "@/features/clients";
import { ClientsTable } from "./clients-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients",
};

export default async function ClientsPage() {
  const { data: clients } = await ClientsService.list({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Clients</h1>
          <p className="mt-1 text-body-sm text-muted">Manage your client portfolio.</p>
        </div>
      </div>
      <ClientsTable initialClients={clients} />
    </div>
  );
}
