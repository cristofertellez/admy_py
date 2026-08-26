import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { ProgressRing } from "@/components/charts/progress-ring";
import { BarChart } from "@/components/charts/bar-chart";
import type { ProjectMetricsBundle } from "@/features/projects";
import type { HealthStatus, RiskLevel } from "@/features/projects/projects-indicators.types";

const RISK_BADGE: Record<RiskLevel, { label: string; variant: "success" | "warning" | "error" }> = {
  low: { label: "Low risk", variant: "success" },
  medium: { label: "Medium risk", variant: "warning" },
  high: { label: "High risk", variant: "error" },
};

const HEALTH_BADGE: Record<HealthStatus, { label: string; variant: "success" | "warning" | "error" }> = {
  healthy: { label: "Healthy", variant: "success" },
  at_risk: { label: "At risk", variant: "warning" },
  critical: { label: "Critical", variant: "error" },
};

function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value}%`;
}

function formatDays(value: number | null): string {
  if (value === null) return "—";
  const unit = Math.abs(value) === 1 ? "day" : "days";
  return `${value > 0 ? "+" : ""}${value} ${unit}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline-soft bg-surface-card-elevated p-4">
      <p className="text-caption-uppercase text-muted">{label}</p>
      <p className="mt-1 text-title-md text-ink">{value}</p>
    </div>
  );
}

function DefinitionRow({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-body-sm text-muted">{term}</dt>
      <dd className="text-body-sm font-medium text-body-strong">{detail}</dd>
    </div>
  );
}

/**
 * Historias 6.6 / 6.9 / 6.15 — Estimaciones, indicadores y métricas del proyecto.
 * Componente presentacional: recibe el bundle ya calculado en el servidor.
 */
export function IndicatorsTab({ bundle }: { bundle: ProjectMetricsBundle }) {
  const { estimates, schedule, indicators, workload } = bundle;
  const risk = RISK_BADGE[indicators.risk.level];
  const health = HEALTH_BADGE[indicators.health];

  const workloadData = workload.map((point) => ({
    label: point.weekLabel,
    value: point.hours,
    color: "#00d4ff",
  }));
  const taskStatusData = indicators.openTasksByStatus.map((row) => ({
    label: row.status,
    value: row.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Health &amp; Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2" aria-label="Project health and risk">
              <Badge variant={health.variant}>{health.label}</Badge>
              <Badge variant={risk.variant} title={`Risk score: ${indicators.risk.score}`}>
                {risk.label}
              </Badge>
            </div>
            <ul className="mt-4 space-y-2">
              {indicators.risk.factors.map((factor) => (
                <li key={factor.id} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                      factor.triggered ? "bg-error" : "bg-success"
                    }`}
                  />
                  <span className="text-body-sm">
                    <span className={factor.triggered ? "text-body-strong" : "text-muted"}>
                      {factor.label}:
                    </span>{" "}
                    <span className="text-muted">{factor.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-3 pt-2">
            <ProgressRing
              percentage={indicators.completionPercentage}
              color="#00d4ff"
              bgColor="#222222"
              label={`${indicators.completionPercentage}%`}
            />
            <p className="text-body-sm text-muted text-center">
              {schedule.expectedProgressPct === null
                ? "Set start and end dates to track expected progress."
                : `Expected by now: ${schedule.expectedProgressPct}%`}
            </p>
            {schedule.scheduleSlippagePct !== null && schedule.scheduleSlippagePct > 0 && (
              <Badge variant="warning">Behind schedule by {schedule.scheduleSlippagePct}%</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Effort</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-hairline-soft">
              <DefinitionRow term="Estimated hours" detail={`${estimates.estimatedHours}h`} />
              <DefinitionRow term="Consumed hours" detail={`${estimates.consumedHours}h`} />
              <DefinitionRow term="Remaining hours" detail={`${estimates.remainingHours}h`} />
              <DefinitionRow term="Effort variation" detail={formatPct(estimates.effortVariationPct)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimates vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 md:grid-cols-2">
            <DefinitionRow term="Estimated start" detail={formatDate(schedule.estimatedStartDate)} />
            <DefinitionRow term="Real start" detail={formatDate(schedule.realStartDate)} />
            <DefinitionRow term="Estimated end" detail={formatDate(schedule.estimatedEndDate)} />
            <DefinitionRow term="Real end" detail={formatDate(schedule.realEndDate)} />
            <DefinitionRow
              term="Planned duration"
              detail={schedule.plannedDurationDays === null ? "—" : `${schedule.plannedDurationDays} days`}
            />
            <DefinitionRow
              term="Actual duration"
              detail={schedule.actualDurationDays === null ? "—" : `${schedule.actualDurationDays} days`}
            />
            <DefinitionRow term="Time variation" detail={formatPct(schedule.timeVariationPct)} />
            <DefinitionRow term="Deviation" detail={formatDays(schedule.deviationDays)} />
            <DefinitionRow term="Delay" detail={`${schedule.delayDays} days`} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="% Behind schedule" value={
              schedule.scheduleSlippagePct === null ? "—" : `${schedule.scheduleSlippagePct}%`
            } />
            <Stat label="Hours used" value={`${indicators.usedHours}h`} />
            <Stat label="Hours remaining" value={`${indicators.remainingHours}h`} />
            <Stat
              label="Productivity"
              value={`${indicators.productivity.taskCompletionRatePct}% tasks done`}
            />
            <Stat
              label="Avg hours / completed task"
              value={
                indicators.productivity.avgHoursPerCompletedTask === null
                  ? "—"
                  : `${indicators.productivity.avgHoursPerCompletedTask}h`
              }
            />
            <Stat label="Delayed tasks" value={String(indicators.delayedTaskCount)} />
            <Stat label="Overdue milestones" value={String(indicators.overdueMilestoneCount)} />
            <Stat label="Open dependencies" value={String(indicators.pendingDependencyCount)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workload — Hours per week</CardTitle>
          </CardHeader>
          <CardContent>
            {workload.every((point) => point.hours === 0) ? (
              <p className="text-body-sm text-muted-soft py-8 text-center">
                No time logged in the last 6 weeks yet.
              </p>
            ) : (
              <BarChart data={workloadData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Workload — Tasks by status</CardTitle>
          </CardHeader>
          <CardContent>
            {taskStatusData.length === 0 ? (
              <p className="text-body-sm text-muted-soft py-8 text-center">No tasks yet.</p>
            ) : (
              <BarChart data={taskStatusData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
