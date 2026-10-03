import { TasksService } from "@/features/tasks";
import { MilestonesService } from "@/features/milestones";
import { ProjectsService } from "@/features/projects";
import { UsersService } from "@/features/users";
import { TASK_SORTABLE_COLUMNS } from "@/features/tasks/tasks.service";
import { requirePermission, hasPermission } from "@/lib/auth";
import { PAGINATION, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/constants";
import { getCatalogOptions } from "@/features/settings";
import { TasksTable } from "./tasks-table";
import { TasksViewSwitcher, type TaskViewMode } from "./view-switcher";
import { KanbanTasks } from "./kanban-tasks";
import { TasksCalendar } from "./tasks-calendar";
import { TasksTimeline } from "./tasks-timeline";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks" };

const PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;
const BOARD_PAGE_SIZE = 200;
const PROJECT_OPTIONS_LIMIT = 200;

// Historia 7.1 — Administración de Tareas. Search, filters, sorting and page
// live in the URL so views are shareable and the PWA can restore them offline.
// Historias 7.13/7.15/7.16 — list, kanban, calendar and timeline views.
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
    month?: string;
  }>;
}

function pickOption<T extends string>(value: string | undefined, options: { value: T }[]): T | undefined {
  return value && options.some((option) => option.value === value) ? (value as T) : undefined;
}

const SORT_OPTIONS = Object.keys(TASK_SORTABLE_COLUMNS).map((key) => ({ value: key, label: key }));

const VIEW_MODES: TaskViewMode[] = ["list", "kanban", "calendar", "timeline"];
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const actor = await requirePermission("tasks.read");
  const params = await searchParams;

  const search = params.search?.trim() || undefined;

  // Historia 15.15: status/priority options reflect the configured catalogs.
  const statusOptions = await getCatalogOptions("task_statuses", TASK_STATUS_OPTIONS);
  const priorityOptions = await getCatalogOptions("task_priorities", TASK_PRIORITY_OPTIONS);
  const status = pickOption(params.status, statusOptions);
  const priority = pickOption(params.priority, priorityOptions);
  const sort = pickOption(params.sort, SORT_OPTIONS);
  const order = params.order === "desc" ? "desc" : params.order === "asc" ? "asc" : undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  // Historia 7.4 — "view=archived" lists soft-deleted tasks with restore actions.
  const archivedView = params.view === "archived";
  const view: TaskViewMode = VIEW_MODES.includes(params.view as TaskViewMode)
    ? (params.view as TaskViewMode)
    : archivedView
      ? "list"
      : "list";
  const month =
    params.month && MONTH_PATTERN.test(params.month)
      ? params.month
      : new Date().toISOString().slice(0, 7);

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

  const isBoardView = view !== "list";
  const { data: tasks, total } = await TasksService.list({
    search,
    status,
    priority,
    assignedTo: assignee,
    projectId: project,
    sortBy: sort,
    sortOrder: order ?? "asc",
    page: isBoardView ? 1 : page,
    pageSize: isBoardView ? BOARD_PAGE_SIZE : PAGE_SIZE,
    archived: archivedView,
  });

  const milestones =
    view === "calendar"
      ? await MilestonesService.getCalendarMilestones(
          Number(month.split("-")[0]),
          Number(month.split("-")[1]),
          project,
        )
      : [];

  const taskRows = (tasks ?? []) as unknown as Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    assigned_to: string | null;
    estimated_end: string | null;
    estimated_start: string | null;
    completion_percentage: number;
    projects?: { name: string } | null;
    users?: { first_name: string; last_name: string } | null;
  }>;

  const assigneeName = (row: (typeof taskRows)[number]) =>
    row.users ? `${row.users.first_name} ${row.users.last_name}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display-sm text-ink">Tasks</h1>
          <p className="mt-1 text-body-sm text-muted">All tasks across projects.</p>
        </div>
        <TasksViewSwitcher view={view} />
      </div>

      {view === "list" && (
        <TasksTable
          initialTasks={tasks as never[]}
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
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          canCreate={hasPermission(actor, "tasks.create")}
          canUpdate={hasPermission(actor, "tasks.update")}
          canDelete={hasPermission(actor, "tasks.delete")}
          archivedView={archivedView}
        />
      )}

      {view === "kanban" && (
        <KanbanTasks
          tasks={taskRows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            priority: row.priority,
            assigned_to: row.assigned_to,
            assignee_name: assigneeName(row),
            project_name: row.projects?.name ?? null,
            estimated_end: row.estimated_end,
          }))}
          statusOptions={statusOptions}
          canUpdate={hasPermission(actor, "tasks.update")}
        />
      )}

      {view === "calendar" && (
        <TasksCalendar
          month={month}
          tasks={taskRows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            priority: row.priority,
            estimated_end: row.estimated_end,
            project_name: row.projects?.name ?? null,
          }))}
          milestones={milestones.map((milestone) => ({
            id: milestone.id,
            title: milestone.title,
            status: milestone.status,
            estimated_date: milestone.estimated_date,
            project_id: milestone.project_id,
            project_name: milestone.project_name,
          }))}
        />
      )}

      {view === "timeline" && (
        <TasksTimeline
          tasks={taskRows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            priority: row.priority,
            estimated_start: row.estimated_start,
            estimated_end: row.estimated_end,
            completion_percentage: row.completion_percentage,
            project_name: row.projects?.name ?? null,
          }))}
        />
      )}
    </div>
  );
}
