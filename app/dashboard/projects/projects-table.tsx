"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { TagChip } from "@/components/shared/tag-chip";
import { Button } from "@/components/ui/button";
import { FormField, FormSelect, FormTextarea, TagSelector } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import {
  createProject,
  updateProject,
  bulkToggleProjectsActive,
} from "@/actions/projects";
import { useEffect, useState, useTransition } from "react";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
import { useDebounce } from "@/hooks/use-debounce";
import { PROJECT_PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/constants";
import { getAllowedProjectStatusOptions } from "@/features/projects/project-status";
import type { RowSelectionState, ColumnDef } from "@tanstack/react-table";
import type { ProjectWithRelations } from "@/features/projects/projects.types";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STATUS_BADGE_VARIANT: Record<string, "default" | "success" | "error" | "warning"> = {
  Completed: "success",
  Delivered: "success",
  Cancelled: "error",
  Suspended: "warning",
  Corrections: "warning",
};

type ProjectRow = ProjectWithRelations;

const selectableColumns: ColumnDef<ProjectRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all projects on this page"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        className="rounded accent-primary"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Select project ${row.original.name}`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        className="rounded accent-primary"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row, getValue }) => (
      <div className="flex flex-col">
        <Link
          href={`/dashboard/projects/${row.original.id}`}
          className="text-body-strong hover:text-primary"
        >
          {getValue() as string}
        </Link>
        {row.original.code && (
          <span className="text-caption text-muted">{row.original.code}</span>
        )}
      </div>
    ),
  },
  {
    id: "client",
    header: "Client",
    cell: ({ row }) => row.original.clients?.company_name ?? "—",
  },
  {
    id: "intermediary",
    header: "Intermediary",
    cell: ({ row }) => {
      const user = row.original.users;
      return user ? `${user.first_name} ${user.last_name}` : "—";
    },
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
        priority === "Urgent" || priority === "Critical"
          ? "error"
          : priority === "High"
            ? "warning"
            : "default";
      return <Badge variant={variant}>{priority}</Badge>;
    },
  },
  {
    id: "tags",
    header: "Tags",
    enableSorting: false,
    cell: ({ row }) => {
      const tags = row.original.tags ?? [];
      if (tags.length === 0) return <span className="text-caption text-muted">—</span>;
      return (
        <div className="flex max-w-48 flex-wrap gap-1">
          {tags.map((tag) => (
            <TagChip key={tag.id} label={tag.name} color={tag.color} />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "completion_percentage",
    header: "Progress",
    cell: ({ getValue }) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 rounded-full bg-surface-card-elevated">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${getValue() as number}%` }}
          />
        </div>
        <span className="text-caption text-muted">{getValue() as number}%</span>
      </div>
    ),
  },
  {
    accessorKey: "estimated_end_date",
    header: "Due Date",
    cell: ({ getValue }) =>
      getValue() ? new Date(getValue() as string).toLocaleDateString() : "—",
  },
];

interface ProjectsTableProps {
  initialProjects: ProjectRow[];
  total: number;
  initialFilters: {
    search: string;
    status: string;
    priority: string;
    active: string;
    tag: string;
  };
  pageIndex: number;
  pageSize: number;
  clientOptions: { id: string; company_name: string }[];
  intermediaryOptions: { id: string; first_name: string; last_name: string }[];
  tagOptions: { id: string; name: string; color: string | null }[];
  canCreate: boolean;
  canUpdate: boolean;
}

export function ProjectsTable({
  initialProjects,
  total,
  initialFilters,
  pageIndex,
  pageSize,
  clientOptions,
  intermediaryOptions,
  tagOptions,
  canCreate,
  canUpdate,
}: ProjectsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [, startTransition] = useTransition();
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch === initialFilters.search) return;
    navigate({ search: debouncedSearch || undefined, page: undefined });
  }, [debouncedSearch]);

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

  const selectedProjects = initialProjects.filter((project) => rowSelection[project.id]);
  const selectedActive = selectedProjects.filter((project) => project.is_active);
  const selectedArchived = selectedProjects.filter((project) => !project.is_active);

  function handleBulk(isActive: boolean, projects: ProjectRow[]) {
    if (projects.length === 0) return;
    const verb = isActive ? "Restore" : "Archive";
    if (
      !window.confirm(
        `${verb} ${projects.length} ${projects.length === 1 ? "project" : "projects"}? You can undo this later.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await bulkToggleProjectsActive(
        projects.map((project) => project.id),
        isActive,
      );
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({ type: "success", message: result.success ?? "" });
      setRowSelection({});
      router.refresh();
    });
  }

  const actionsColumn: ColumnDef<ProjectRow> = {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/projects/${row.original.id}`}
          className="text-body-sm text-primary hover:underline"
        >
          View
        </Link>
        <button
          onClick={() => setEditingProject(row.original)}
          className="text-body-sm text-primary hover:underline"
        >
          Edit
        </button>
        <button
          onClick={() => handleBulk(!row.original.is_active, [row.original])}
          className="whitespace-nowrap text-body-sm text-muted hover:text-body-strong"
        >
          {row.original.is_active ? "Archive" : "Restore"}
        </button>
      </div>
    ),
  };

  const tableColumns: ColumnDef<ProjectRow>[] = [
    ...(canUpdate ? selectableColumns : selectableColumns.slice(1)),
    ...(canUpdate ? [actionsColumn] : []),
  ];

  return (
    <div className="space-y-4">
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={
            feedback.type === "error"
              ? "text-body-sm text-error"
              : "text-body-sm text-success"
          }
        >
          {feedback.message}
        </p>
      )}

      {canUpdate && selectedProjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface-card px-4 py-3">
          <p className="text-body-sm text-muted">
            {selectedProjects.length} selected
          </p>
          {selectedActive.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => handleBulk(false, selectedActive)}>
              Archive selected ({selectedActive.length})
            </Button>
          )}
          {selectedArchived.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => handleBulk(true, selectedArchived)}>
              Restore selected ({selectedArchived.length})
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-4 lg:items-end">
        <div>
          <label htmlFor="projects-status-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            Status
          </label>
          <select
            id="projects-status-filter"
            value={initialFilters.status}
            onChange={(e) => navigate({ status: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All statuses</option>
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="projects-priority-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            Priority
          </label>
          <select
            id="projects-priority-filter"
            value={initialFilters.priority}
            onChange={(e) => navigate({ priority: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All priorities</option>
            {PROJECT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="projects-active-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            State
          </label>
          <select
            id="projects-active-filter"
            value={initialFilters.active}
            onChange={(e) => navigate({ active: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All states</option>
            <option value="true">Active</option>
            <option value="false">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="projects-tag-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            Tag
          </label>
          <select
            id="projects-tag-filter"
            value={initialFilters.tag}
            onChange={(e) => navigate({ tag: e.target.value || undefined, page: undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All tags</option>
            {tagOptions.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        {canCreate && <Button onClick={() => setShowCreate(true)}>New Project</Button>}
      </div>

      <DataTable
        columns={tableColumns}
        data={initialProjects}
        totalCount={total}
        getRowId={(project) => project.id}
        enableRowSelection={canUpdate}
        onRowSelectionChange={setRowSelection}
        searchColumn="name"
        searchPlaceholder="Search by name, code, description or client..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onPaginationChange={(pagination) =>
          navigate({
            page: pagination.pageIndex === 0 ? undefined : String(pagination.pageIndex + 1),
          })
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
      />

      {showCreate && (
        <ProjectFormModal
          clientOptions={clientOptions}
          intermediaryOptions={intermediaryOptions}
          tagOptions={tagOptions}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}

      {editingProject && (
        <ProjectFormModal
          project={editingProject}
          clientOptions={clientOptions}
          intermediaryOptions={intermediaryOptions}
          tagOptions={tagOptions}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ProjectFormModal({
  project,
  clientOptions = [],
  intermediaryOptions = [],
  tagOptions = [],
  onClose,
  onSuccess,
}: {
  project?: ProjectRow;
  clientOptions?: { id: string; company_name: string }[];
  intermediaryOptions?: { id: string; first_name: string; last_name: string }[];
  tagOptions?: { id: string; name: string; color: string | null }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = project ? updateProject : createProject;
  const { formAction, isPending, state } = useQueuedFormAction(
    project ? "project.update" : null,
    action,
  );

  // On edit the status list is limited to valid transitions from the current
  // status (Historia 6.4); the server re-validates authoritatively.
  const statusOptions = project
    ? getAllowedProjectStatusOptions(project.status)
    : PROJECT_STATUS_OPTIONS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <CardTitle>{project ? "Edit" : "Create"} Project</CardTitle>
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
              {project && <input type="hidden" name="id" value={project.id} />}
              <FormField label="Project Name" name="name" defaultValue={project?.name} required />
              <FormTextarea label="Description" name="description" defaultValue={project?.description ?? ""} />
              {project ? (
                <div>
                  <span className="mb-1.5 block text-body-sm font-medium text-body-strong">Client</span>
                  <p className="text-body-sm text-muted">{project.clients?.company_name ?? "—"}</p>
                </div>
              ) : (
                <FormSelect
                  label="Client"
                  name="client_id"
                  options={clientOptions.map((client) => ({
                    value: client.id,
                    label: client.company_name,
                  }))}
                  placeholder={clientOptions.length > 0 ? undefined : "No clients available"}
                  required
                />
              )}
              <FormSelect
                label="Intermediary"
                name="intermediary_id"
                options={intermediaryOptions.map((intermediary) => ({
                  value: intermediary.id,
                  label: `${intermediary.first_name} ${intermediary.last_name}`.trim(),
                }))}
                placeholder={
                  intermediaryOptions.length > 0 ? "None" : "No intermediaries available"
                }
                defaultValue={project?.intermediary_id ?? ""}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormSelect label="Status" name="status" options={statusOptions} defaultValue={project?.status || "Proposed"} />
                <FormSelect label="Priority" name="priority" options={PROJECT_PRIORITY_OPTIONS} defaultValue={project?.priority || "Medium"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" name="estimated_start_date" type="date" defaultValue={project?.estimated_start_date ?? ""} />
                <FormField label="End Date" name="estimated_end_date" type="date" defaultValue={project?.estimated_end_date ?? ""} />
              </div>
              <FormField
                label="Estimated Hours"
                name="estimated_hours"
                type="number"
                min="0"
                defaultValue={String(project?.estimated_hours ?? 0)}
              />
              <TagSelector
                tags={tagOptions}
                defaultSelected={(project?.tags ?? []).map((tag) => tag.id)}
                hint="Click a tag to assign or remove it."
              />
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Saving..." : project ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
