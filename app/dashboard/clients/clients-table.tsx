"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { createClient, updateClient, toggleClientActive } from "@/actions/clients";
import { useActionState, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import type { ColumnDef } from "@tanstack/react-table";
import type { ClientWithRelations } from "@/features/clients/clients.types";
import Link from "next/link";

const columns: ColumnDef<ClientWithRelations>[] = [
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
  initialClients: ClientWithRelations[];
  total: number;
  initialFilters: { search: string; status: string };
  pageIndex: number;
  pageSize: number;
  canCreate: boolean;
  canUpdate: boolean;
}

export function ClientsTable({
  initialClients,
  total,
  initialFilters,
  pageIndex,
  pageSize,
  canCreate,
  canUpdate,
}: ClientsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithRelations | null>(null);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [, startTransition] = useTransition();
  const debouncedSearch = useDebounce(searchInput, 400);

  function navigate(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  useEffect(() => {
    if (debouncedSearch === initialFilters.search) return;
    navigate({ search: debouncedSearch || undefined, page: undefined });
  }, [debouncedSearch]);

  function handleToggle(client: ClientWithRelations) {
    const archiving = client.is_active;
    if (archiving && !window.confirm(`Archive client "${client.company_name}"? You can restore it later.`)) {
      return;
    }

    startTransition(async () => {
      const result = await toggleClientActive(client.id, !archiving);
      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({ type: "success", message: result.success ?? "" });
      router.refresh();
    });
  }

  const actionColumns: ColumnDef<ClientWithRelations>[] = [
    ...columns,
    ...(canUpdate
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: { original: ClientWithRelations } }) => (
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
                  onClick={() => handleToggle(row.original)}
                  className="text-body-sm text-muted hover:text-body-strong"
                >
                  {row.original.is_active ? "Archive" : "Restore"}
                </button>
              </div>
            ),
          } as ColumnDef<ClientWithRelations>,
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={feedback.type === "error" ? "text-body-sm text-error" : "text-body-sm text-success"}
        >
          {feedback.message}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-40">
          <label
            htmlFor="clients-status-filter"
            className="mb-1.5 block text-body-sm font-medium text-body-strong"
          >
            Status
          </label>
          <select
            id="clients-status-filter"
            value={initialFilters.status}
            onChange={(e) => navigate({ status: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {canCreate && <Button onClick={() => setShowCreate(true)}>Add Client</Button>}
      </div>

      <DataTable
        columns={actionColumns}
        data={initialClients}
        totalCount={total}
        searchColumn="company_name"
        searchPlaceholder="Search by company, contact, email or phone..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onPaginationChange={(pagination) =>
          navigate({ page: pagination.pageIndex === 0 ? undefined : String(pagination.pageIndex + 1) })
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
      />

      {showCreate && (
        <ClientFormModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); router.refresh(); }} />
      )}

      {editingClient && (
        <ClientFormModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={() => { setEditingClient(null); router.refresh(); }}
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
  client?: ClientWithRelations;
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
