import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { ProgressRing } from "@/components/charts";
import Link from "next/link";
import type { ProjectMetricsBundle } from "@/features/projects";

// Historia 6.8 — Dashboard del Proyecto. Server-rendered widgets fed by the
// detail page queries; each one answers a single monitoring question and links
// deeper when more detail is needed.

interface MilestoneRow {
  id: string;
  title: string;
  status: string;
  estimated_date: string | null;
}

interface CommentRow {
  id: string;
  message: string;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
}

interface FileRow {
  id: string;
  filename: string;
  size_bytes: number | null;
  created_at: string;
}

interface Props {
  projectId: string;
  status: string;
  priority: string;
  realStartDate: string | null;
  realEndDate: string | null;
  estimatedHours: number;
  workedHours: number;
  completionPercentage: number;
  milestones: MilestoneRow[];
  comments: CommentRow[];
  files: FileRow[];
  indicators: ProjectMetricsBundle | null;
}

const HEALTH_VARIANT: Record<string, "success" | "warning" | "error"> = {
  healthy: "success",
  at_risk: "warning",
  critical: "error",
};

const RISK_VARIANT: Record<string, "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function ProjectDashboard({
  projectId,
  status,
  priority,
  realStartDate,
  realEndDate,
  estimatedHours,
  workedHours,
  completionPercentage,
  milestones,
  comments,
  files,
  indicators,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingMilestones = milestones
    .filter((m) => m.status !== "Completed")
    .sort((a, b) => (a.estimated_date ?? "9999").localeCompare(b.estimated_date ?? "9999"))
    .slice(0, 4);
  const latestComments = [...comments]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);
  const latestFiles = [...files]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);

  const risk = indicators?.indicators.risk;
  const health = indicators?.indicators.health;
  const triggeredFactors = risk?.factors.filter((factor) => factor.triggered) ?? [];
  const remainingHours = Math.max(0, Math.round((estimatedHours - workedHours) * 10) / 10);
  const expectedProgress = indicators?.schedule.expectedProgressPct ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Current Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge>{status}</Badge>
              <Badge variant={priority === "Critical" || priority === "Urgent" ? "error" : "default"}>
                {priority}
              </Badge>
            </div>
            <DetailRow label="Real start" value={formatDate(realStartDate)} />
            <DetailRow label="Real end" value={formatDate(realEndDate)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center gap-5 pt-2">
            <ProgressRing percentage={completionPercentage} size={88} label={`${completionPercentage}%`} />
            <div className="space-y-1">
              <p className="text-caption text-muted">Expected</p>
              <p className="text-body-sm font-medium text-body-strong">
                {expectedProgress === null ? "—" : `${Math.round(expectedProgress)}%`}
              </p>
              {expectedProgress !== null && (
                <p className="text-caption text-muted">
                  {completionPercentage >= expectedProgress ? "On or ahead of plan" : "Behind plan"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Effort</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-2">
            <DetailRow label="Estimated" value={`${estimatedHours}h`} />
            <DetailRow label="Worked" value={`${workedHours}h`} />
            <DetailRow label="Remaining" value={`${remainingHours}h`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Health &amp; Risks</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {health && (
                <Badge variant={HEALTH_VARIANT[health] ?? "default"}>{health.replace("_", " ")}</Badge>
              )}
              {risk && (
                <Badge variant={RISK_VARIANT[risk.level] ?? "default"}>{risk.level} risk</Badge>
              )}
            </div>
            {triggeredFactors.length === 0 ? (
              <p className="text-body-sm text-muted-soft">No risk factors triggered.</p>
            ) : (
              <ul className="space-y-1">
                {triggeredFactors.slice(0, 3).map((factor) => (
                  <li key={factor.id} className="text-caption text-muted">
                    · {factor.label}: {factor.detail}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/dashboard/projects/${projectId}?tab=indicators`}
              className="inline-block text-caption-uppercase text-primary hover:underline"
            >
              View indicators
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Upcoming Deliveries</CardTitle></CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <p className="text-body-sm text-muted-soft">No upcoming milestones.</p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {upcomingMilestones.map((milestone) => {
                  const overdue = !!milestone.estimated_date && milestone.estimated_date < today;
                  return (
                    <li key={milestone.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                      <span className="truncate text-body-sm font-medium text-body-strong">{milestone.title}</span>
                      <time
                        dateTime={milestone.estimated_date ?? undefined}
                        className={`ml-auto text-caption ${overdue ? "text-error" : "text-muted"}`}
                      >
                        {milestone.estimated_date ? formatDate(milestone.estimated_date) : "No date"}
                      </time>
                      <Badge variant={overdue ? "error" : milestone.status === "In Progress" ? "warning" : "default"}>
                        {milestone.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest Comments</CardTitle></CardHeader>
          <CardContent>
            {latestComments.length === 0 ? (
              <p className="text-body-sm text-muted-soft">No comments yet.</p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {latestComments.map((comment) => {
                  const author =
                    [comment.users?.first_name, comment.users?.last_name].filter(Boolean).join(" ").trim() ||
                    "Unknown user";
                  return (
                    <li key={comment.id} className="py-2">
                      <p className="truncate text-body-sm text-body-strong">{comment.message}</p>
                      <p className="text-caption text-muted">
                        {author} · {formatDate(comment.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest Files</CardTitle></CardHeader>
          <CardContent>
            {latestFiles.length === 0 ? (
              <p className="text-body-sm text-muted-soft">No files uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {latestFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate text-body-sm text-body-strong">{file.filename}</span>
                    <span className="shrink-0 text-caption text-muted">{formatDate(file.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-body-sm text-muted shrink-0">{label}</span>
      <span className="text-body-sm text-body-strong text-right break-words">{value}</span>
    </div>
  );
}
