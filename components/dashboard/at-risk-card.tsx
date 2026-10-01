import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import type { DashboardAtRiskProject } from "@/features/dashboard";
import { ListCard } from "./list-card";

// Historia 11.10 — Proyectos en Riesgo widget: portfolio-level risk signals
// (overdue milestones/tasks, blocked tasks, hours overrun) computed once by
// the dashboard service and rendered as an actionable list.

interface AtRiskProjectsCardProps {
  projects: DashboardAtRiskProject[];
  title?: string;
  emptyMessage?: string;
}

export function AtRiskProjectsCard({
  projects,
  title = "Projects at Risk",
  emptyMessage = "No projects at risk right now.",
}: AtRiskProjectsCardProps) {
  return (
    <ListCard title={title} badge={String(projects.length)} emptyMessage={emptyMessage} itemCount={projects.length}>
      {projects.map((project) => (
        <li key={project.id} className="py-3 first:pt-0 last:pb-0">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="group flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span className="truncate text-body-sm font-medium text-body-strong group-hover:text-ink">
              {project.name}
            </span>
            <span className="truncate text-caption text-muted">{project.client_name}</span>
            <span className="ml-auto flex items-center gap-3">
              <span className="text-caption text-muted">{project.completion_percentage}%</span>
              <Badge variant={project.risk === "high" ? "error" : "warning"}>
                {project.risk} risk
              </Badge>
            </span>
          </Link>
          <p className="mt-0.5 text-caption text-muted">{project.reasons.join(" · ")}</p>
        </li>
      ))}
    </ListCard>
  );
}
