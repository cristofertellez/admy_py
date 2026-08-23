"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { createClient, updateClient, toggleClientActive } from "@/actions/clients";
import { useActionState, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Client } from "@/types";
import Link from "next/link";

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row, getValue }) => (
      <Link href={`/dashboard/clients/${row.original.id}`} className="text-body-strong hover:text-primary">
        {getValue() as string}
      </Link>
    ),
  },
  { accessorKey: "contact_name", header: "Contact" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return <Badge variant={v === "active" ? "success" : "error"}>{v}</Badge>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
  },
];

interface ClientsTableProps {
  initialClients: Client[];
}

export function ClientsTable({ initialClients }: ClientsTableProps) {
  const [clients, setClients] = useState(initialClients);
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleClientActive(id, !current);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !current, status: current ? "inactive" : "active" } : c)),
      );
    });
  }

  const actionColumns: ColumnDef<Client>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/clients/${row.original.id}`}
            className="text-body-sm text-primary hover:underline"
          >
            View
          </Link>
          <button
            onClick={() => setEditingClient(row.original)}
            className="text-body-sm text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleToggle(row.original.id, row.original.is_active)}
            className="text-body-sm text-muted hover:text-body-strong"
          >
            {row.original.is_active ? "Archive" : "Restore"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>Add Client</Button>
      </div>

      <DataTable columns={actionColumns} data={clients} searchColumn="company_name" />

      {showCreate && (
        <ClientFormModal onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
      )}

      {editingClient && (
        <ClientFormModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={() => setEditingClient(null)}
        />
      )}
    </div>
  );
}

function ClientFormModal({
  client,
  onClose,
  onSuccess,
}: {
  client?: Client;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = client ? updateClient : createClient;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{client ? "Edit Client" : "Create Client"}</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">
            ✕
          </button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-body-sm text-success">{state.success}</p>
              <Button onClick={onSuccess} variant="secondary" className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {client && <input type="hidden" name="id" value={client.id} />}
              <FormField label="Company Name" name="company_name" defaultValue={client?.company_name} required />
              <FormField label="Contact Name" name="contact_name" defaultValue={client?.contact_name || ""} />
              <FormField label="Email" name="email" type="email" defaultValue={client?.email || ""} />
              <FormField label="Phone" name="phone" type="tel" defaultValue={client?.phone || ""} />
              <FormField label="Address" name="address" defaultValue={client?.address || ""} />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Country" name="country" defaultValue={client?.country || ""} />
                <FormField label="City" name="city" defaultValue={client?.city || ""} />
              </div>
              <FormField label="Website" name="website" type="url" defaultValue={client?.website || ""} />
              <FormTextarea label="Notes" name="notes" defaultValue={client?.notes || ""} />
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Saving..." : client ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
