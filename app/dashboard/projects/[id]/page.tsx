import {
  ProjectsService,
  ProjectIndicatorsService,
  isProjectHistoryCategory,
} from "@/features/projects";
import type { ProjectMember, ProjectMemberCandidate } from "@/features/projects";
import { TasksService } from "@/features/tasks";
import { MilestonesService } from "@/features/milestones";
import { CommentsService } from "@/features/comments";
import { FilesService } from "@/features/files";
import { getCatalogOptions } from "@/features/settings";
import { getUser, hasPermission } from "@/lib/auth";
import { isAccessDeniedError } from "@/lib/auth-scope";
import { ActivityService } from "@/services/activity.service";
import { redirect } from "next/navigation";
import { ProjectTabs } from "./project-tabs";
import { ProjectDashboard } from "./project-dashboard";
import { ReportExportButtons } from "./report-export-buttons";
import { Card, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { TagChip } from "@/components/shared/tag-chip";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; page?: string; q?: string; category?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await ProjectsService.getById(id) as unknown as Record<string, unknown>;
    return { title: p.name as string };
  } catch {
    return { title: "Project" };
  }
}

const ACTIVITY_PAGE_SIZE = 20;

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const {
    tab,
    page: pageParam,
    q: historySearch,
    category: categoryParam,
  } = await searchParams;

  let project: Record<string, unknown>;
  try {
    project = await ProjectsService.getById(id) as unknown as Record<string, unknown>;
  } catch (err) {
    if (isAccessDeniedError(err)) redirect("/unauthorized");
    throw err;
  }

  const user = await getUser();
  const role = user?.role ?? null;
  const canManageMembers = user ? hasPermission(user, "projects.update") : false;

  const activeTab = tab === "activity" ? "activity" : "overview";
  const historyPage = Math.max(1, Number.parseInt(pageParam || "1", 10) || 1);
  // Historia 6.14: timeline filters (event type and free search) live in the URL.
  const historyCategory = isProjectHistoryCategory(categoryParam) ? categoryParam : null;
  // The change history is only queried when its tab is visible (Historias 6.3 / 6.17).
  const history =
    activeTab === "activity"
      ? await ProjectsService.getHistory(id, {
          search: historySearch?.trim() || undefined,
          category: historyCategory,
          page: historyPage,
          pageSize: ACTIVITY_PAGE_SIZE,
        })
      : null;

  const { data: tasks } = await TasksService.list({ projectId: id, pageSize: 100 });
  const milestones = await MilestonesService.listByProject(id);
  const [comments, files, milestoneStatusOptions] = await Promise.all([
    CommentsService.listByProject(id),
    FilesService.list({ entityType: "project", entityId: id, pageSize: 100 }),
    getCatalogOptions("milestone_statuses", [
      { value: "Pending", label: "Pending" },
      { value: "In Progress", label: "In Progress" },
      { value: "In Review", label: "In Review" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" },
    ]),
  ]);
  // Historias 6.6 / 6.9 / 6.15: estimaciones, indicadores y métricas calculadas en el servidor.
  const indicators = await ProjectIndicatorsService.getByProject(id);

  // Historia 6.7: member management data is only needed for the management view.
  const [members, availableMembers]: [ProjectMember[], ProjectMemberCandidate[]] = canManageMembers
    ? await Promise.all([
        ProjectsService.listMembers(id),
        ProjectsService.listAvailableMembers(id),
      ])
    : [[], []];

  // Data-layer scoping (assertProjectVisible + projectScope/attachmentScope) already
  // restricts every query above, so each role only receives permitted information
  // (Historia 5.8). UI capabilities are derived from RBAC below.
  const canUploadFiles = user ? hasPermission(user, "files.upload") : false;
  const canDeleteFiles = user ? hasPermission(user, "files.delete") : false;
  const canDownloadFiles = user ? hasPermission(user, "files.download") : false;
  const canCreateComments = user ? hasPermission(user, "comments.create") : false;
  const canModerateComments = user
    ? hasPermission(user, "comments.update") || hasPermission(user, "comments.delete")
    : false;

  // Audit trail for project consultations (Historia 5.13): logged only after the
  // data-layer visibility check passed, deduplicated per user within a short window.
  if (user) {
    await ActivityService.logAccessOnce({
      user_id: user.id,
      action: "viewed_project",
      entity: "Project",
      entity_id: id,
      new_value: { name: project.name as string },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/projects" className="text-body-sm text-muted hover:text-body-strong">← Back to Projects</Link>
          <h1 className="mt-2 text-display-sm text-ink">{project.name as string}</h1>
          <p className="mt-1 text-body-sm text-muted">{project.description as string || "No description."}</p>
          {((project.tags as Array<{ id: string; name: string; color: string | null }> | undefined) ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(project.tags as Array<{ id: string; name: string; color: string | null }>).map((tag) => (
                <TagChip key={tag.id} label={tag.name} color={tag.color} />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <Badge>{project.status as string}</Badge>
            <Badge>{project.priority as string}</Badge>
          </div>
          {user && hasPermission(user, "reports.export") && (
            <ReportExportButtons projectId={id} projectName={project.name as string} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{project.completion_percentage as number}%</p><p className="text-caption text-muted">Progress</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{project.estimated_hours as number}h</p><p className="text-caption text-muted">Estimated</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{project.worked_hours as number}h</p><p className="text-caption text-muted">Worked</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{tasks?.length || 0}</p><p className="text-caption text-muted">Tasks</p></CardContent></Card>
      </div>

      {/* Historia 6.8 — Dashboard del Proyecto: widgets de estado, progreso,
          horas, próximas entregas, comentarios, archivos, riesgos e indicadores. */}
      <ProjectDashboard
        projectId={id}
        status={project.status as string}
        priority={project.priority as string}
        realStartDate={project.real_start_date as string | null}
        realEndDate={project.real_end_date as string | null}
        estimatedHours={project.estimated_hours as number}
        workedHours={project.worked_hours as number}
        completionPercentage={project.completion_percentage as number}
        milestones={milestones as never[]}
        comments={comments as never[]}
        files={files.data as never[]}
        indicators={indicators}
      />

      <ProjectTabs
        projectId={id}
        initialTab={activeTab}
        history={history}
        historyFilters={{ search: historySearch ?? "", category: historyCategory }}
        tasks={(tasks || []) as unknown[]}
        milestones={milestones}
        comments={comments}
        documents={files.data as never[]}
        projectStartDate={project.estimated_start_date as string | null}
        projectEndDate={project.estimated_end_date as string | null}
        indicators={indicators}
        role={role}
        members={members}
        availableMembers={availableMembers}
        canManageMembers={canManageMembers}
        canCreateTasks={user ? hasPermission(user, "tasks.create") : false}
        canUpdateTasks={user ? hasPermission(user, "tasks.update") : false}
        canManageMilestones={user ? hasPermission(user, "projects.update") : false}
        canUploadFiles={canUploadFiles}
        canDeleteFiles={canDeleteFiles}
        canDownloadFiles={canDownloadFiles}
        currentUserId={user?.id ?? null}
        canCreateComments={canCreateComments}
        canModerateComments={canModerateComments}
        milestoneStatusOptions={milestoneStatusOptions}
      />
    </div>
  );
}
