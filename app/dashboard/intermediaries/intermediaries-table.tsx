"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { createIntermediary, updateIntermediary, toggleIntermediaryActive } from "@/actions/intermediaries";
import { useActionState, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import type { ColumnDef } from "@tanstack/react-table";
import type { IntermediaryRecord } from "@/features/intermediaries";
import Link from "next/link";

type IntermediaryRow = IntermediaryRecord;

const columns: ColumnDef<IntermediaryRow>[] = [
  {
    accessorKey: "first_name",
    header: "Name",
    cell: ({ row, getValue }) => (
      <Link href={`/dashboard/intermediaries/${row.original.id}`} className="text-body-strong hover:text-primary">
        {getValue() as string} {row.original.last_name}
      </Link>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ getValue }) => <Badge variant={getValue() ? "success" : "error"}>{getValue() ? "Active" : "Inactive"}</Badge>,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
  },
];

interface IntermediariesTableProps {
  initialData: IntermediaryRecord[];
  total: number;
  initialFilters: { search: string; status: string };
  pageIndex: number;
  pageSize: number;
}

export function IntermediariesTable({
  initialData,
  total,
  initialFilters,
  pageIndex,
  pageSize,
}: IntermediariesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<IntermediaryRow | null>(null);
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

  function handleToggle(intermediary: IntermediaryRow) {
    const deactivating = intermediary.is_active;
    if (
      deactivating &&
      !window.confirm(`Deactivate "${intermediary.first_name} ${intermediary.last_name}"? They will lose access immediately.`)
    ) {
      return;
    }

    startTransition(async () => {
      const result = await toggleIntermediaryActive(intermediary.id, !deactivating);
      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({ type: "success", message: result.success ?? "" });
      router.refresh();
    });
  }

  const actionColumns: ColumnDef<IntermediaryRow>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/intermediaries/${row.original.id}`}
            className="text-body-sm text-primary hover:underline"
          >
            View
          </Link>
          <button
            onClick={() => setEditing(row.original)}
            className="text-body-sm text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleToggle(row.original)}
            className="text-body-sm text-muted hover:text-body-strong"
          >
            {row.original.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
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
            htmlFor="intermediaries-status-filter"
            className="mb-1.5 block text-body-sm font-medium text-body-strong"
          >
            Status
          </label>
          <select
            id="intermediaries-status-filter"
            value={initialFilters.status}
            onChange={(e) => navigate({ status: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <Button onClick={() => setShowCreate(true)}>Add Intermediary</Button>
      </div>

      <DataTable
        columns={actionColumns}
        data={initialData}
        totalCount={total}
        searchColumn="first_name"
        searchPlaceholder="Search by name or email..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onPaginationChange={(pagination) =>
          navigate({ page: pagination.pageIndex === 0 ? undefined : String(pagination.pageIndex + 1) })
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
      />

      {showCreate && (
        <FormModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); router.refresh(); }} />
      )}

      {editing && (
        <FormModal item={editing} onClose={() => setEditing(null)} onSuccess={() => { setEditing(null); router.refresh(); }} />
      )}
    </div>
  );
}

function FormModal({ item, onClose, onSuccess }: { item?: IntermediaryRow; onClose: () => void; onSuccess: () => void }) {
  const action = item ? updateIntermediary : createIntermediary;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{item ? "Edit" : "Create"} Intermediary</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">✕</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-body-sm text-success">{state.success}</p>
              <Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {item && <input type="hidden" name="id" value={item.id} />}
              <FormField label="First Name" name="first_name" defaultValue={item?.first_name} required />
              <FormField label="Last Name" name="last_name" defaultValue={item?.last_name} required />
              <FormField label="Email" name="email" type="email" defaultValue={item?.email} required />
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Saving..." : item ? "Update" : "Create"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
