import { ProjectsService } from "@/features/projects";
import { TasksService } from "@/features/tasks";
import { MilestonesService } from "@/features/milestones";
import { CommentsService } from "@/features/comments";
import { isAccessDeniedError } from "@/lib/auth-scope";
import { redirect } from "next/navigation";
import { ProjectTabs } from "./project-tabs";
import { Card, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await ProjectsService.getById(id) as unknown as Record<string, unknown>;
    return { title: p.name as string };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  let project: Record<string, unknown>;
  try {
    project = await ProjectsService.getById(id) as unknown as Record<string, unknown>;
  } catch (err) {
    if (isAccessDeniedError(err)) redirect("/unauthorized");
    throw err;
  }

  const { data: tasks } = await TasksService.list({ projectId: id, pageSize: 100 });
  const milestones = await MilestonesService.listByProject(id);
  const comments = await CommentsService.listByProject(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/projects" className="text-body-sm text-muted hover:text-body-strong">← Back to Projects</Link>
          <h1 className="mt-2 text-display-sm text-ink">{project.name as string}</h1>
          <p className="mt-1 text-body-sm text-muted">{project.description as string || "No description."}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{project.status as string}</Badge>
          <Badge>{project.priority as string}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{project.completion_percentage as number}%</p><p className="text-caption text-muted">Progress</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{project.estimated_hours as number}h</p><p className="text-caption text-muted">Estimated</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{project.worked_hours as number}h</p><p className="text-caption text-muted">Worked</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-display-md text-ink">{tasks?.length || 0}</p><p className="text-caption text-muted">Tasks</p></CardContent></Card>
      </div>

      <ProjectTabs
        projectId={id}
        tasks={(tasks || []) as unknown[]}
        milestones={milestones}
        comments={comments}
        projectStartDate={project.estimated_start_date as string | null}
        projectEndDate={project.estimated_end_date as string | null}
      />
    </div>
  );
}
