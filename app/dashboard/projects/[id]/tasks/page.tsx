import { TasksService } from "@/features/tasks";
import { TASK_SORTABLE_COLUMNS } from "@/features/tasks/tasks.service";
import { UsersService } from "@/features/users";
import { TasksTable } from "@/app/dashboard/tasks/tasks-table";
import { requirePermission, hasPermission } from "@/lib/auth";
import { PAGINATION, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/constants";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Tasks — ${id.slice(0, 8)}` };
}

function pickOption<T extends string>(value: string | undefined, options: { value: T }[]): T | undefined {
  return value && options.some((option) => option.value === value) ? (value as T) : undefined;
}

const SORT_OPTIONS = Object.keys(TASK_SORTABLE_COLUMNS).map((key) => ({ value: key, label: key }));

export default async function ProjectTasksPage({ params, searchParams }: Props) {
  const { id } = await params;
  const actor = await requirePermission("tasks.read");
  const query = await searchParams;

  const search = query.search?.trim() || undefined;
  const status = pickOption(query.status, TASK_STATUS_OPTIONS);
  const priority = pickOption(query.priority, TASK_PRIORITY_OPTIONS);
  const sort = pickOption(query.sort, SORT_OPTIONS);
  const order = query.order === "desc" ? "desc" : query.order === "asc" ? "asc" : undefined;
  const page = Math.max(1, Number.parseInt(query.page || "1", 10) || 1);

  const assignees = await UsersService.listAssigneeOptions();
  const assignee = assignees.some((option) => option.id === query.assignee)
    ? query.assignee
    : undefined;

  const { data: tasks, total } = await TasksService.list({
    projectId: id,
    search,
    status,
    priority,
    assignedTo: assignee,
    sortBy: sort,
    sortOrder: order ?? "asc",
    page,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-display-sm text-ink">Tasks</h1>
      <TasksTable
        initialTasks={(tasks ?? []) as never[]}
        total={total}
        initialFilters={{
          search: search ?? "",
          status: status ?? "",
          priority: priority ?? "",
          assignee: assignee ?? "",
          project: "",
          sort: sort ?? "",
          order: order ?? "",
        }}
        pageIndex={page - 1}
        pageSize={PAGINATION.DEFAULT_PAGE_SIZE}
        assigneeOptions={assignees}
        projectId={id}
        canCreate={hasPermission(actor, "tasks.create")}
        canUpdate={hasPermission(actor, "tasks.update")}
        canDelete={hasPermission(actor, "tasks.delete")}
      />
    </div>
  );
}
