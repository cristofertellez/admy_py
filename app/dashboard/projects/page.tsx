import { ProjectsService } from "@/features/projects";
import { ProjectsTable } from "./projects-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { data } = await ProjectsService.list({ pageSize: 50 });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Projects</h1>
          <p className="mt-1 text-body-sm text-muted">Manage all projects.</p>
        </div>
      </div>
      <ProjectsTable initialProjects={(data || []) as unknown as Record<string, unknown>[]} />
    </div>
  );
}
