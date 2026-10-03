import { MilestonesService, buildMilestoneIndicators } from "@/features/milestones";
import { CommentsService } from "@/features/comments";
import { ProjectsService } from "@/features/projects";
import { getCatalogOptions } from "@/features/settings";
import { getUser, hasPermission } from "@/lib/auth";
import { isAccessDeniedError } from "@/lib/auth-scope";
import { KpiCard } from "@/components/dashboard";
import { redirect } from "next/navigation";
import { MilestonesTable, type MilestoneViewRow } from "./milestones-table";
import type { MilestoneCommentRow } from "./milestone-comments";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}

interface DependencyRow {
  id: string;
  dependency_type: string;
  milestone: { id: string; title: string; status: string; estimated_date: string | null };
}

const MILESTONE_STATUS_FALLBACK = ["Pending", "In Progress", "In Review", "Completed", "Cancelled"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Milestones — ${id.slice(0, 8)}` };
}

// Historias 8.1 / 8.10 / 8.11 — Administración de hitos with quick indicators,
// server-side search/filter and read-only access for Client and Intermediary
// roles (management actions are gated by `projects.update`).
export default async function ProjectMilestonesPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const search = resolvedSearchParams.q?.trim() || undefined;
  const status = resolvedSearchParams.status?.trim() || undefined;
  const view = resolvedSearchParams.view === "timeline" ? "timeline" : "table";

  const user = await getUser();

  const canManage = user ? hasPermission(user, "projects.update") : false;
  const canManageTasks = user ? hasPermission(user, "tasks.update") : false;

  let project: Record<string, unknown>;
  try {
    project = (await ProjectsService.getById(id)) as unknown as Record<string, unknown>;
  } catch (err) {
    if (isAccessDeniedError(err)) redirect("/unauthorized");
    throw err;
  }

  const [milestones, summary, comments, projectTasks, statusOptions, historyLogs, dependencyRows] = await Promise.all([
    MilestonesService.listByProject(id, { search, status }),
    MilestonesService.getProjectSummary(id),
    CommentsService.listByProjectMilestones(id),
    MilestonesService.listProjectTasksForAssignment(id),
    getCatalogOptions(
      "milestone_statuses",
      MILESTONE_STATUS_FALLBACK.map((value) => ({ value, label: value })),
    ),
    MilestonesService.getProjectHistory(id, 10),
    MilestonesService.getProjectDependencies(id).catch(() => []),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const rows: MilestoneViewRow[] = milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    status: milestone.status,
    estimated_date: milestone.estimated_date,
    completed_date: milestone.completed_date,
    completion_percentage: milestone.completion_percentage,
    task_count: milestone.task_count,
    completed_tasks: milestone.completed_tasks,
    indicators: buildMilestoneIndicators(milestone, today),
  }));

  // Comments are resolved in one batch query (Historia 9.4) and grouped per
  // milestone so the table does not fan out lookups per row.
  const commentsByMilestone = new Map<string, MilestoneCommentRow[]>();
  for (const comment of comments) {
    const list = commentsByMilestone.get(comment.milestone_id) ?? [];
    list.push(comment as unknown as MilestoneCommentRow);
    commentsByMilestone.set(comment.milestone_id, list);
  }

  // Historia 8.8 — dependency rows grouped per milestone (single query).
  const dependenciesByMilestone = new Map<
    string,
    { predecessors: DependencyRow[]; successors: DependencyRow[] }
  >();
  const milestoneOptions = rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    estimated_date: row.estimated_date,
  }));
  for (const row of dependencyRows) {
    const entry = dependenciesByMilestone.get(row.milestone_id) ?? { predecessors: [], successors: [] };
    entry.predecessors.push({
      id: row.id,
      dependency_type: row.dependency_type,
      milestone: {
        id: row.depends_on_milestone_id,
        title: row.to_title,
        status: "",
        estimated_date: null,
      },
    });
    dependenciesByMilestone.set(row.milestone_id, entry);

    const reverse = dependenciesByMilestone.get(row.depends_on_milestone_id) ?? { predecessors: [], successors: [] };
    reverse.successors.push({
      id: row.id,
      dependency_type: row.dependency_type,
      milestone: {
        id: row.milestone_id,
        title: row.from_title,
        status: "",
        estimated_date: null,
      },
    });
    dependenciesByMilestone.set(row.depends_on_milestone_id, reverse);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Milestones</h1>
        <p className="mt-1 text-body-sm text-muted">
          Key deliverables of {project.name as string}. Progress is computed from the linked tasks.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard value={summary.total} label="Total Milestones" />
        <KpiCard value={summary.completed} label="Completed" tone="success" />
        <KpiCard value={summary.inProgress} label="In Progress" tone="primary" />
        <KpiCard value={summary.overdue} label="Overdue" tone={summary.overdue > 0 ? "danger" : "default"} />
      </div>

      <MilestonesTable
        projectId={id}
        rows={rows}
        projectTasks={projectTasks}
        statusOptions={statusOptions}
        initialFilters={{ search: search ?? "", status: status ?? "" }}
        view={view}
        projectStartDate={(project.estimated_start_date as string | null) ?? null}
        projectEndDate={(project.estimated_end_date as string | null) ?? null}
        historyLogs={historyLogs}
        canManage={canManage}
        canManageTasks={canManageTasks}
        commentsByMilestone={commentsByMilestone}
        currentUserId={user?.id ?? null}
        canComment={user ? hasPermission(user, "comments.create") : false}
        canModerate={user ? hasPermission(user, "comments.update") || hasPermission(user, "comments.delete") : false}
        canUploadFiles={user ? hasPermission(user, "files.upload") : false}
        canDeleteFiles={user ? hasPermission(user, "files.delete") : false}
        canDownloadFiles={user ? hasPermission(user, "files.download") || hasPermission(user, "files.upload") : false}
        dependenciesByMilestone={dependenciesByMilestone}
        milestoneOptions={milestoneOptions}
      />
    </div>
  );
}
