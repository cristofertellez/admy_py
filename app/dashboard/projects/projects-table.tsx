"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormSelect, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { createProject, updateProject, archiveProject } from "@/actions/projects";
import { useState, useTransition } from "react";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

interface ProjectRow {
  id: string; name: string; status: string; priority: string;
  completion_percentage: number; estimated_end_date: string | null; is_active: boolean;
}

const columns: ColumnDef<ProjectRow>[] = [
  { accessorKey: "name", header: "Project", cell: ({ row, getValue }) => (
    <Link href={`/dashboard/projects/${row.original.id}`} className="text-body-strong hover:text-primary">{getValue() as string}</Link>
  )},
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge>{getValue() as string}</Badge> },
  { accessorKey: "priority", header: "Priority", cell: ({ getValue }) => <Badge>{(getValue() as string)}</Badge> },
  { accessorKey: "completion_percentage", header: "Progress", cell: ({ getValue }) => (
    <div className="flex items-center gap-2"><div className="h-2 w-16 rounded-full bg-surface-card-elevated"><div className="h-full rounded-full bg-primary" style={{ width: `${getValue() as number}%` }} /></div><span className="text-caption text-muted">{getValue() as number}%</span></div>
  )},
];

interface Props { initialProjects: Record<string, unknown>[] }

export function ProjectsTable({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects as unknown as ProjectRow[]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [, startTransition] = useTransition();

  const actionColumns: ColumnDef<ProjectRow>[] = [...columns, {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(row.original)} className="text-body-sm text-primary hover:underline">Edit</button>
        <button onClick={() => startTransition(async () => { await archiveProject(row.original.id); setProjects((p) => p.filter((x) => x.id !== row.original.id)); })} className="text-body-sm text-muted hover:text-body-strong">Archive</button>
      </div>
    ),
  }];

  const statusOpts = [{ value: "Proposed", label: "Proposed" }, { value: "Planning", label: "Planning" }, { value: "Development", label: "Development" }, { value: "QA", label: "QA" }, { value: "Completed", label: "Completed" }];
  const priorityOpts = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }, { value: "Critical", label: "Critical" }];

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setShowCreate(true)}>New Project</Button></div>
      <DataTable columns={actionColumns} data={projects} searchColumn="name" />
      {showCreate && (
        <FormModal statusOpts={statusOpts} priorityOpts={priorityOpts} onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />
      )}
      {editing && (
        <FormModal item={editing} statusOpts={statusOpts} priorityOpts={priorityOpts} onClose={() => setEditing(null)} onSuccess={() => setEditing(null)} />
      )}
    </div>
  );
}

function FormModal({ item, statusOpts, priorityOpts, onClose, onSuccess }: {
  item?: ProjectRow; statusOpts: { value: string; label: string }[]; priorityOpts: { value: string; label: string }[];
  onClose: () => void; onSuccess: () => void;
}) {
  const action = item ? updateProject : createProject;
  const { formAction, isPending, state } = useQueuedFormAction(item ? "project.update" : null, action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{item ? "Edit" : "Create"} Project</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">✕</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4"><p className="text-body-sm text-success">{state.success}</p><Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button></div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {item && <input type="hidden" name="id" value={item.id} />}
              <FormField label="Project Name" name="name" defaultValue={item?.name} required />
              <FormTextarea label="Description" name="description" />
              <FormSelect label="Status" name="status" options={statusOpts} defaultValue={item?.status || "Proposed"} />
              <FormSelect label="Priority" name="priority" options={priorityOpts} defaultValue={item?.priority || "Medium"} />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" name="estimated_start_date" type="date" />
                <FormField label="End Date" name="estimated_end_date" type="date" />
              </div>
              <FormField label="Estimated Hours" name="estimated_hours" type="number" defaultValue="0" />
              {!item && <FormField label="Client ID" name="client_id" required hint="UUID of the client" />}
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
