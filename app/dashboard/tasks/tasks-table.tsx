"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { FormField, FormSelect, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import {
  createTask,
  updateTask,
  toggleTaskCompletion,
  toggleTaskActive,
  bulkUpdateTaskStatus,
} from "@/actions/tasks";
import { useEffect, useState, useTransition } from "react";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
import { useDebounce } from "@/hooks/use-debounce";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import { getAllowedTaskStatusOptions } from "@/features/tasks/task-status";

const STATUS_BADGE_VARIANT: Record<string, "default" | "success" | "error" | "warning"> = {
  Completed: "success",
  Cancelled: "error",
  Blocked: "error",
  "In Progress": "warning",
};

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimated_hours: number;
  completion_percentage: number;
  estimated_end: string | null;
  description?: string | null;
  estimated_start?: string | null;
  assigned_to?: string | null;
  projects?: { name: string } | null;
  users?: { first_name: string | null; last_name: string | null } | null;
}

interface AssigneeOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface TasksTableProps {
  initialTasks: TaskRow[];
  total: number;
  initialFilters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    project: string;
    sort: string;
    order: string;
  };
  pageIndex: number;
  pageSize: number;
  assigneeOptions: AssigneeOption[];
  projectOptions?: ProjectOption[];
  projectId?: string;
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  // Archived view (Historia 7.4): lists soft-deleted tasks and offers Restore.
  archivedView?: boolean;
}

function assigneeName(task: TaskRow) {
  const user = task.users;
  if (!user) return "—";
  return `${user.first_name} ${user.last_name ?? ""}`.trim() || "—";
}

export function TasksTable({
  initialTasks,
  total,
  initialFilters,
  pageIndex,
  pageSize,
  assigneeOptions,
  projectOptions = [],
  projectId,
  statusOptions,
  priorityOptions,
  canCreate,
  canUpdate,
  canDelete,
  archivedView = false,
}: TasksTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkStatus, setBulkStatus] = useState("");
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

  const selectedTasks = initialTasks.filter((task) => rowSelection[task.id]);

  function handleToggleComplete(task: TaskRow) {
    const completing = task.status !== "Completed";
    const formData = new FormData();
    formData.set("id", task.id);
    formData.set("completed", String(completing));

    startTransition(async () => {
      const result = await toggleTaskCompletion(null, formData);
      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({ type: "success", message: result.success ?? "" });
      router.refresh();
    });
  }

  // Historia 7.4 — archive in the active view, restore in the archived view.
  function handleToggleActive(task: TaskRow) {
    const restoring = archivedView;
    if (
      !window.confirm(
        restoring
          ? `Restore task "${task.title}"?`
          : `Archive task "${task.title}"? An administrator can restore it later.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await toggleTaskActive(task.id, restoring);
      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({ type: "success", message: result.success ?? "" });
      setRowSelection({});
      router.refresh();
    });
  }

  function handleBulkStatusChange() {
    if (!bulkStatus || selectedTasks.length === 0) return;
    const count = selectedTasks.length;
    const label = statusOptions.find((option) => option.value === bulkStatus)?.label ?? bulkStatus;
    if (!window.confirm(`Set ${count} ${count === 1 ? "task" : "tasks"} to "${label}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateTaskStatus(selectedTasks.map((task) => task.id), bulkStatus);
      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({ type: "success", message: result.success ?? "" });
      setBulkStatus("");
      setRowSelection({});
      router.refresh();
    });
  }

  const selectableColumn: ColumnDef<TaskRow> = {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all tasks on this page"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        className="rounded accent-primary"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Select task ${row.original.title}`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        className="rounded accent-primary"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  // Server-side sort whitelist (Historia 7.1): only these column ids map to a
  // SQL ORDER BY; the rest are display-only and cannot be sorted.
  const baseColumns: ColumnDef<TaskRow>[] = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/tasks/${row.original.id}`}
          className="text-body-strong hover:text-primary transition-colors"
        >
          {row.original.title}
        </Link>
      ),
    },
    ...(projectId
      ? []
      : [
          {
            id: "project",
            header: "Project",
            enableSorting: false,
            cell: ({ row }: { row: { original: TaskRow } }) =>
              row.original.projects?.name ?? "—",
          } as ColumnDef<TaskRow>,
        ]),
    {
      id: "assignee",
      header: "Assignee",
      enableSorting: false,
      cell: ({ row }) => assigneeName(row.original),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return <Badge variant={STATUS_BADGE_VARIANT[status] ?? "default"}>{status}</Badge>;
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ getValue }) => {
        const priority = getValue() as string;
        const variant =
          priority === "Urgent" || priority === "Critical" ? "error" : priority === "High" ? "warning" : "default";
        return <Badge variant={variant}>{priority}</Badge>;
      },
    },
    {
      accessorKey: "completion_percentage",
      header: "Progress",
      enableSorting: false,
      cell: ({ getValue }) => `${getValue() as number}%`,
    },
    {
      accessorKey: "estimated_hours",
      header: "Est. Hours",
      enableSorting: false,
      cell: ({ getValue }) => (getValue() as number) || "—",
    },
    {
      accessorKey: "estimated_end",
      header: "Due Date",
      cell: ({ getValue }) =>
        getValue() ? new Date(getValue() as string).toLocaleDateString() : "—",
    },
  ];

  const actionsColumn: ColumnDef<TaskRow> = {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original;
      const completed = task.status === "Completed";
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/tasks/${task.id}`} className="text-body-sm text-primary hover:underline">
            View
          </Link>
          {archivedView ? (
            canDelete ? (
              <button
                onClick={() => handleToggleActive(task)}
                className="whitespace-nowrap text-body-sm text-muted hover:text-body-strong"
              >
                Restore
              </button>
            ) : null
          ) : (
            <>
              {canUpdate && (
                <>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-body-sm text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="whitespace-nowrap text-body-sm text-muted hover:text-body-strong"
                  >
                    {completed ? "Reopen" : "Complete"}
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={() => handleToggleActive(task)}
                  className="whitespace-nowrap text-body-sm text-muted hover:text-body-strong"
                >
                  Archive
                </button>
              )}
            </>
          )}
        </div>
      );
    },
  };

  const tableColumns: ColumnDef<TaskRow>[] = [
    ...(canUpdate && !archivedView ? [selectableColumn] : []),
    ...baseColumns,
    ...(canUpdate || canDelete ? [actionsColumn] : []),
  ];

  const currentSort = initialFilters.sort;

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

      {canUpdate && selectedTasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface-card px-4 py-3">
          <p className="text-body-sm text-muted">{selectedTasks.length} selected</p>
          <label htmlFor="tasks-bulk-status" className="sr-only">
            New status for selected tasks
          </label>
          <select
            id="tasks-bulk-status"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="h-10 rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Change status to…</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={handleBulkStatusChange} disabled={!bulkStatus}>
            Apply
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-4 lg:items-end">
        <div>
          <label htmlFor="tasks-status-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            Status
          </label>
          <select
            id="tasks-status-filter"
            value={initialFilters.status}
            onChange={(e) => navigate({ status: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tasks-priority-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            Priority
          </label>
          <select
            id="tasks-priority-filter"
            value={initialFilters.priority}
            onChange={(e) => navigate({ priority: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All priorities</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tasks-assignee-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            Assignee
          </label>
          <select
            id="tasks-assignee-filter"
            value={initialFilters.assignee}
            onChange={(e) => navigate({ assignee: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All assignees</option>
            {assigneeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {`${option.first_name} ${option.last_name}`.trim()}
              </option>
            ))}
          </select>
        </div>
        {!projectId && projectOptions.length > 0 && (
          <div>
            <label htmlFor="tasks-project-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
              Project
            </label>
            <select
              id="tasks-project-filter"
              value={initialFilters.project}
              onChange={(e) => navigate({ project: e.target.value || undefined, page: undefined })}
              className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All projects</option>
              {projectOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {canCreate && !archivedView && <Button onClick={() => setShowCreate(true)}>New Task</Button>}
      </div>

      <DataTable
        columns={tableColumns}
        data={initialTasks}
        totalCount={total}
        getRowId={(task) => task.id}
        enableRowSelection={canUpdate && !archivedView}
        onRowSelectionChange={setRowSelection}
        searchColumn="title"
        searchPlaceholder="Search by title or description..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSortingChange={(sorting: SortingState) => {
          const first = sorting[0];
          if (!first) {
            navigate({ sort: undefined, order: undefined, page: undefined });
            return;
          }
          navigate({ sort: first.id, order: first.desc ? "desc" : undefined, page: undefined });
        }}
        initialSorting={currentSort ? [{ id: currentSort, desc: initialFilters.order === "desc" }] : []}
        onPaginationChange={(pagination) =>
          navigate({ page: pagination.pageIndex === 0 ? undefined : String(pagination.pageIndex + 1) })
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
      />

      {showCreate && (
        <TaskFormModal
          projectId={projectId}
          projectOptions={projectOptions}
          assigneeOptions={assigneeOptions}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          item={editingTask}
          projectId={projectId}
          projectOptions={projectOptions}
          assigneeOptions={assigneeOptions}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function TaskFormModal({
  item,
  projectId,
  projectOptions = [],
  assigneeOptions,
  statusOptions,
  priorityOptions,
  onClose,
  onSuccess,
}: {
  item?: TaskRow;
  projectId?: string;
  projectOptions?: ProjectOption[];
  assigneeOptions: AssigneeOption[];
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = item ? updateTask : createTask;
  const { formAction, isPending, state } = useQueuedFormAction(item ? "task.update" : null, action);

  const showProjectSelect = !item && !projectId && projectOptions.length > 0;
  const fallbackAssignee =
    item?.assigned_to && !assigneeOptions.some((option) => option.id === item.assigned_to)
      ? [{ value: item.assigned_to, label: "Current assignee" }]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{item ? "Edit" : "Create"} Task</CardTitle>
          <button
            onClick={onClose}
            className="text-lg leading-none text-muted hover:text-body-strong"
            aria-label="Close dialog"
          >
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
              {item && <input type="hidden" name="id" value={item.id} />}
              {projectId && <input type="hidden" name="project_id" value={projectId} />}
              {showProjectSelect && (
                <FormSelect
                  label="Project"
                  name="project_id"
                  options={projectOptions.map((project) => ({ value: project.id, label: project.name }))}
                  required
                />
              )}
              {!item && !projectId && !showProjectSelect && (
                <FormField label="Project ID" name="project_id" required />
              )}
              <FormField label="Title" name="title" defaultValue={item?.title} required />
              <FormTextarea label="Description" name="description" defaultValue={item?.description || ""} />
              <FormSelect
                label="Assignee"
                name="assigned_to"
                placeholder="None"
                defaultValue={item?.assigned_to ?? ""}
                options={[
                  ...fallbackAssignee,
                  ...assigneeOptions.map((option) => ({
                    value: option.id,
                    label: `${option.first_name} ${option.last_name}`.trim(),
                  })),
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Status"
                  name="status"
                  options={item ? getAllowedTaskStatusOptions(item.status) : statusOptions}
                  defaultValue={item?.status || "Pending"}
                />
                <FormSelect
                  label="Priority"
                  name="priority"
                  options={priorityOptions}
                  defaultValue={item?.priority || "Medium"}
                />
              </div>
              <FormField
                label="Estimated Hours"
                name="estimated_hours"
                type="number"
                min="0"
                defaultValue={String(item?.estimated_hours || 0)}
              />
              {item && (
                <FormField
                  label="Progress %"
                  name="completion_percentage"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={String(item.completion_percentage)}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Start Date"
                  name="estimated_start"
                  type="date"
                  defaultValue={item?.estimated_start?.split("T")[0] || ""}
                />
                <FormField
                  label="Due Date"
                  name="estimated_end"
                  type="date"
                  defaultValue={item?.estimated_end?.split("T")[0] || ""}
                />
              </div>
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Saving..." : item ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
