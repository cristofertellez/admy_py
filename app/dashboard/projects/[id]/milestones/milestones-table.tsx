"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormSelect, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { createMilestone, updateMilestone } from "@/actions/milestones";
import { useActionState, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

interface MilestoneRow {
  id: string; title: string; description: string | null; status: string;
  estimated_date: string | null; completed_date: string | null; completion_percentage: number;
}

const columns: ColumnDef<MilestoneRow>[] = [
  { accessorKey: "title", header: "Milestone", cell: ({ getValue }) => <span className="text-body-strong">{getValue() as string}</span> },
  {
    accessorKey: "status", header: "Status",
    cell: ({ getValue }) => {
      const s = getValue() as string;
      const v = s === "Completed" ? "success" : s === "In Progress" ? "warning" : "default";
      return <Badge variant={v as "success" | "warning" | "default"}>{s}</Badge>;
    },
  },
  { accessorKey: "estimated_date", header: "Target Date", cell: ({ getValue }) => (getValue() as string) ? new Date(getValue() as string).toLocaleDateString() : "—" },
  { accessorKey: "completion_percentage", header: "%", cell: ({ getValue }) => `${getValue() as number}%` },
];

interface Props { initialData: Record<string, unknown>[]; projectId: string }

export function MilestonesTable({ initialData, projectId }: Props) {
  const [items] = useState(initialData as unknown as MilestoneRow[]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<MilestoneRow | null>(null);

  const actionColumns: ColumnDef<MilestoneRow>[] = [...columns, {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <button onClick={() => setEditing(row.original)} className="text-body-sm text-primary hover:underline">Edit</button>
    ),
  }];

  const statusOpts = [{ value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" }, { value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }];

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setShowCreate(true)}>Add Milestone</Button></div>
      <DataTable columns={actionColumns} data={items} searchColumn="title" />
      {showCreate && <FormModal projectId={projectId} statusOpts={statusOpts} onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />}
      {editing && <FormModal item={editing} statusOpts={statusOpts} onClose={() => setEditing(null)} onSuccess={() => setEditing(null)} />}
    </div>
  );
}

function FormModal({ item, statusOpts, projectId, onClose, onSuccess }: {
  item?: MilestoneRow; statusOpts: { value: string; label: string }[]; projectId?: string; onClose: () => void; onSuccess: () => void;
}) {
  const action = item ? updateMilestone : createMilestone;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{item ? "Edit" : "Add"} Milestone</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">✕</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4"><p className="text-body-sm text-success">{state.success}</p><Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button></div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {item && <input type="hidden" name="id" value={item.id} />}
              {projectId && <input type="hidden" name="project_id" value={projectId} />}
              <FormField label="Title" name="title" defaultValue={item?.title} required />
              <FormTextarea label="Description" name="description" defaultValue={item?.description || ""} />
              <FormSelect label="Status" name="status" options={statusOpts} defaultValue={item?.status || "Pending"} />
              <FormField label="Target Date" name="estimated_date" type="date" defaultValue={item?.estimated_date || ""} />
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
