import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import { ListCard } from "./list-card";
import type { UpcomingMilestone } from "@/features/milestones";

// Historia 11.5 — Milestones Card widget. Shared by the developer and client
// dashboards; every consumer resolves visibility at the data layer.

interface MilestonesCardProps {
  milestones: UpcomingMilestone[];
  title?: string;
  emptyMessage?: string;
}

function statusVariant(status: string): "success" | "warning" | "default" {
  if (status === "Completed") return "success";
  if (status === "In Progress" || status === "In Review") return "warning";
  return "default";
}

export function MilestonesCard({
  milestones,
  title = "Upcoming Milestones",
  emptyMessage = "No upcoming milestones.",
}: MilestonesCardProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <ListCard title={title} badge={String(milestones.length)} emptyMessage={emptyMessage} itemCount={milestones.length}>
      {milestones.map((milestone) => {
        const overdue = milestone.estimated_date < today;
        return (
          <li key={milestone.id} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={`/dashboard/projects/${milestone.project_id}/milestones`}
              className="group flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span className="text-body-sm font-medium text-body-strong group-hover:text-ink truncate">
                {milestone.title}
              </span>
              <span className="text-caption text-muted truncate">
                {milestone.project_name} · {milestone.client_name}
              </span>
              <span className="ml-auto flex items-center gap-3">
                <time
                  dateTime={milestone.estimated_date}
                  className={`text-caption ${overdue ? "text-error" : "text-muted"}`}
                >
                  {new Date(milestone.estimated_date).toLocaleDateString()}
                </time>
                <Badge variant={overdue ? "error" : statusVariant(milestone.status)}>
                  {milestone.status}
                </Badge>
              </span>
            </Link>
          </li>
        );
      })}
    </ListCard>
  );
}
