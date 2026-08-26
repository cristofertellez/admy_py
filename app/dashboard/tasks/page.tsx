import { TasksService } from "@/features/tasks";
import { ProjectsService } from "@/features/projects";
import { UsersService } from "@/features/users";
import { TASK_SORTABLE_COLUMNS } from "@/features/tasks/tasks.service";
import { requirePermission, hasPermission } from "@/lib/auth";
import { PAGINATION, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/constants";
import { TasksTable } from "./tasks-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks" };

const PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;
const PROJECT_OPTIONS_LIMIT = 200;

// Historia 7.1 — Administración de Tareas. Search, filters, sorting and page
// live in the URL so views are shareable and the PWA can restore them offline.
interface TasksPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    project?: string;
    sort?: string;
    order?: string;
    page?: string;
    view?: string;
  }>;
}

function pickOption<T extends string>(value: string | undefined, options: { value: T }[]): T | undefined {
  return value && options.some((option) => option.value === value) ? (value as T) : undefined;
}

const SORT_OPTIONS = Object.keys(TASK_SORTABLE_COLUMNS).map((key) => ({ value: key, label: key }));

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const actor = await requirePermission("tasks.read");
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const status = pickOption(params.status, TASK_STATUS_OPTIONS);
  const priority = pickOption(params.priority, TASK_PRIORITY_OPTIONS);
  const sort = pickOption(params.sort, SORT_OPTIONS);
  const order = params.order === "desc" ? "desc" : params.order === "asc" ? "asc" : undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  // Historia 7.4 — "view=archived" lists soft-deleted tasks with restore actions.
  const archivedView = params.view === "archived";

  // Filter options double as whitelist validation for the assignee/project
  // params, mirroring the tag filter on the projects list (Historia 6.1).
  const [assignees, projectList] = await Promise.all([
    UsersService.listAssigneeOptions(),
    ProjectsService.list({ pageSize: PROJECT_OPTIONS_LIMIT }),
  ]);
  const projectOptions = projectList.data.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  const assignee = assignees.some((option) => option.id === params.assignee)
    ? params.assignee
    : undefined;
  const project = projectOptions.some((option) => option.id === params.project)
    ? params.project
    : undefined;

  const { data: tasks, total } = await TasksService.list({
    search,
    status,
    priority,
    assignedTo: assignee,
    projectId: project,
    sortBy: sort,
    sortOrder: order ?? "asc",
    page,
    pageSize: PAGE_SIZE,
    archived: archivedView,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Tasks</h1>
        <p className="mt-1 text-body-sm text-muted">All tasks across projects.</p>
      </div>
      <TasksTable
        initialTasks={(tasks ?? []) as never[]}
        total={total}
        initialFilters={{
          search: search ?? "",
          status: status ?? "",
          priority: priority ?? "",
          assignee: assignee ?? "",
          project: project ?? "",
          sort: sort ?? "",
          order: order ?? "",
        }}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
        assigneeOptions={assignees}
        projectOptions={projectOptions}
        canCreate={hasPermission(actor, "tasks.create")}
        canUpdate={hasPermission(actor, "tasks.update")}
        canDelete={hasPermission(actor, "tasks.delete")}
        archivedView={archivedView}
      />
    </div>
  );
}
