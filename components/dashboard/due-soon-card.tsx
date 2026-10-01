import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import type { DueSoonProject } from "@/features/dashboard";
import { ListCard } from "./list-card";

// Historia 11.5 — Calendar/agenda Card widget: upcoming project deliveries
// (11.8) rendered as a compact deadline list shared by the role dashboards.

const DUE_SOON_WINDOW_DAYS = 30;

interface DueSoonCardProps {
  projects: DueSoonProject[];
  title?: string;
  emptyMessage?: string;
}

export function DueSoonCard({
  projects,
  title = "Projects Due Soon",
  emptyMessage = `No projects due in the next ${DUE_SOON_WINDOW_DAYS} days.`,
}: DueSoonCardProps) {
  return (
    <ListCard
      title={title}
      badge={`Next ${DUE_SOON_WINDOW_DAYS} days`}
      emptyMessage={emptyMessage}
      itemCount={projects.length}
    >
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
              <time dateTime={project.estimated_end_date} className="text-caption text-muted">
                {new Date(project.estimated_end_date).toLocaleDateString()}
              </time>
              <Badge variant={project.status === "Delivered" ? "success" : "default"}>
                {project.status}
              </Badge>
            </span>
          </Link>
        </li>
      ))}
    </ListCard>
  );
}
