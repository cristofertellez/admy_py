"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormSelect, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { createTask, updateTask } from "@/actions/tasks";
import { useState } from "react";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

interface TaskRow {
  id: string; title: string; status: string; priority: string;
  project_id: string; estimated_hours: number; completion_percentage: number;
}

const columns: ColumnDef<TaskRow>[] = [
  {
    accessorKey: "title", header: "Task",
    cell: ({ row }) => (
      <Link href={`/dashboard/tasks/${row.original.id}`} className="text-body-strong hover:text-primary transition-colors">
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "status", header: "Status",
    cell: ({ getValue }) => {
      const s = getValue() as string;
      const v = s === "Completed" ? "success" : s === "Blocked" ? "error" : s === "In Progress" ? "warning" : "default";
      return <Badge variant={v as "success" | "error" | "warning" | "default"}>{s}</Badge>;
    },
  },
  { accessorKey: "priority", header: "Priority", cell: ({ getValue }) => <Badge>{getValue() as string}</Badge> },
  { accessorKey: "completion_percentage", header: "%", cell: ({ getValue }) => `${getValue() as number}%` },
];

interface Props { initialTasks: Record<string, unknown>[]; projectId?: string }

export function TasksTable({ initialTasks, projectId }: Props) {
  const [tasks] = useState(initialTasks as unknown as TaskRow[]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);

  const actionColumns: ColumnDef<TaskRow>[] = [...columns, {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(row.original)} className="text-body-sm text-primary hover:underline">Edit</button>
      </div>
    ),
  }];

  const statusOpts = [{ value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" }, { value: "Blocked", label: "Blocked" }, { value: "In Review", label: "In Review" }, { value: "QA", label: "QA" }, { value: "Completed", label: "Completed" }];
  const priorityOpts = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }, { value: "Critical", label: "Critical" }];

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setShowCreate(true)}>New Task</Button></div>
      <DataTable columns={actionColumns} data={tasks} searchColumn="title" />
      {showCreate && <TaskForm statusOpts={statusOpts} priorityOpts={priorityOpts} projectId={projectId} onClose={() => setShowCreate(false)} onSuccess={() => setShowCreate(false)} />}
      {editing && <TaskForm item={editing} statusOpts={statusOpts} priorityOpts={priorityOpts} onClose={() => setEditing(null)} onSuccess={() => setEditing(null)} />}
    </div>
  );
}

function TaskForm({ item, statusOpts, priorityOpts, projectId, onClose, onSuccess }: {
  item?: TaskRow; statusOpts: { value: string; label: string }[]; priorityOpts: { value: string; label: string }[];
  projectId?: string; onClose: () => void; onSuccess: () => void;
}) {
  const action = item ? updateTask : createTask;
  const { formAction, isPending, state } = useQueuedFormAction(item ? "task.update" : null, action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{item ? "Edit" : "Create"} Task</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">✕</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4"><p className="text-body-sm text-success">{state.success}</p><Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button></div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {item && <input type="hidden" name="id" value={item.id} />}
              {projectId && <input type="hidden" name="project_id" value={projectId} />}
              {!item && !projectId && <FormField label="Project ID" name="project_id" required />}
              <FormField label="Title" name="title" defaultValue={item?.title} required />
              <FormTextarea label="Description" name="description" />
              <FormSelect label="Status" name="status" options={statusOpts} defaultValue={item?.status || "Pending"} />
              <FormSelect label="Priority" name="priority" options={priorityOpts} defaultValue={item?.priority || "Medium"} />
              <FormField label="Estimated Hours" name="estimated_hours" type="number" defaultValue={String(item?.estimated_hours || 0)} />
              <FormField label="Assigned To (User ID)" name="assigned_to" defaultValue="" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" name="estimated_start" type="date" />
                <FormField label="End Date" name="estimated_end" type="date" />
              </div>
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
