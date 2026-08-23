"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { createIntermediary, updateIntermediary, toggleIntermediaryActive } from "@/actions/intermediaries";
import { useActionState, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

interface IntermediaryRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

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
];

interface Props { initialData: Record<string, unknown>[] }

export function IntermediariesTable({ initialData }: Props) {
  const [items, setItems] = useState(initialData as unknown as IntermediaryRow[]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<IntermediaryRow | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleIntermediaryActive(id, !current);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: !current } : i)));
    });
  }

  const actionColumns: ColumnDef<IntermediaryRow>[] = [...columns, {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(row.original)} className="text-body-sm text-primary hover:underline">Edit</button>
        <button onClick={() => handleToggle(row.original.id, row.original.is_active)} className="text-body-sm text-muted hover:text-body-strong">
          {row.original.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    ),
  }];

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setShowCreate(true)}>Add Intermediary</Button></div>
      <DataTable columns={actionColumns} data={items} searchColumn="first_name" />
      {showCreate && <FormModal onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />}
      {editing && <FormModal item={editing} onClose={() => setEditing(null)} onSuccess={() => setEditing(null)} />}
    </div>
  );
}

function FormModal({ item, onClose, onSuccess }: { item?: IntermediaryRow; onClose: () => void; onSuccess: () => void }) {
  const action = item ? updateIntermediary : createIntermediary;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
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
