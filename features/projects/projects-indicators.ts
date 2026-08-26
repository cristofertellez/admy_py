import type {
  EstimatesSummary,
  HealthStatus,
  ProductivitySummary,
  ProjectIndicators,
  ProjectMetricsBundle,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  ScheduleSummary,
  WorkloadPoint,
} from "./projects-indicators.types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_OF_HISTORY = 6;

/** Proyectos finalizados: sin penalizaciones de cronograma ni inactividad. */
const FINALIZED_STATUSES = ["Completed", "Cancelled", "Archived"];

/**
 * Datos crudos agregados de la base (una fila por consulta) que alimentan los
 * cálculos. Mantener plano permite probar la lógica sin base de datos.
 */
export interface ProjectMetricsInput {
  status: string;
  estimatedHours: number | null;
  workedHours: number | null;
  completionPercentage: number | null;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  realStartDate: string | null;
  realEndDate: string | null;
  tasks: {
    total: number;
    completed: number;
    blocked: number;
    overdue: number;
    statusCounts: { status: string; count: number }[];
    estimatedHoursSum: number;
    workedHoursSum: number;
    weightedCompletionSum: number;
    totalWeight: number;
    lastActivityAt: string | null;
  };
  milestones: { total: number; completed: number; overdue: number };
  pendingDependencies: number;
  /** Suma histórica completa de time_entries del proyecto (sin ventana temporal). */
  totalLoggedHours: number;
  /** Registros diarios recientes para el gráfico de carga de trabajo. */
  dailyHours: { day: string; hours: number }[];
}

function toTime(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function toISODate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function daysBetween(fromMs: number, toMs: number): number {
  return Math.round((toMs - fromMs) / DAY_MS);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function ratioPct(part: number, whole: number): number | null {
  return whole > 0 ? round1((part / whole) * 100) : null;
}

function firstNonZero(...values: number[]): number {
  return values.find((value) => value > 0) ?? 0;
}

/**
 * Horas consumidas: se prefiere el histórico completo de time_entries; si no hay
 * registros se usa el roll-up de tareas y como último recurso el campo del proyecto.
 */
function resolveConsumedHours(input: ProjectMetricsInput): number {
  return firstNonZero(
    input.totalLoggedHours,
    input.tasks.workedHoursSum,
    input.workedHours ?? 0,
  );
}

function resolveEstimatedHours(input: ProjectMetricsInput): number {
  return firstNonZero(
    input.estimatedHours ?? 0,
    input.tasks.estimatedHoursSum,
  );
}

/**
 * Progreso del proyecto: promedio ponderado por el peso de cada tarea.
 * Sin tareas, se respeta el valor almacenado en el proyecto.
 */
function resolveCompletionPercentage(input: ProjectMetricsInput): number {
  if (input.tasks.totalWeight > 0) {
    return clamp(round1(input.tasks.weightedCompletionSum / input.tasks.totalWeight), 0, 100);
  }
  return clamp(input.completionPercentage ?? 0, 0, 100);
}

export function computeEstimates(input: ProjectMetricsInput): EstimatesSummary {
  const estimatedHours = resolveEstimatedHours(input);
  const consumedHours = resolveConsumedHours(input);

  return {
    estimatedHours,
    consumedHours,
    remainingHours: Math.max(0, round1(estimatedHours - consumedHours)),
    effortVariationPct: ratioPct(consumedHours - estimatedHours, estimatedHours),
    completionPercentage: resolveCompletionPercentage(input),
  };
}

export function computeSchedule(input: ProjectMetricsInput, now: Date): ScheduleSummary {
  const nowMs = now.getTime();
  const estimatedStart = toTime(input.estimatedStartDate);
  const estimatedEnd = toTime(input.estimatedEndDate);
  const realStart = toTime(input.realStartDate);
  const realEnd = toTime(input.realEndDate);

  const isFinalized = FINALIZED_STATUSES.includes(input.status);

  // Duración planificada: ventana estimada; mientras corre se ancla al inicio real si existe.
  const planFrom = isFinalized ? estimatedStart : (realStart ?? estimatedStart);
  const plannedDurationDays =
    planFrom !== null && estimatedEnd !== null
      ? Math.max(0, daysBetween(planFrom, estimatedEnd))
      : null;

  const actualFrom = realStart ?? estimatedStart;
  const actualDurationDays =
    actualFrom !== null ? Math.max(0, daysBetween(actualFrom, realEnd ?? nowMs)) : null;

  const timeVariationPct =
    realEnd !== null && plannedDurationDays !== null && plannedDurationDays > 0
      ? round1(((actualDurationDays as number) - plannedDurationDays) / plannedDurationDays * 100)
      : null;

  // Desviación firmada contra el fin estimado: fin real (finalizados) o hoy (activos).
  const referenceEnd = realEnd ?? (isFinalized ? null : nowMs);
  const deviationDays =
    estimatedEnd !== null && referenceEnd !== null
      ? daysBetween(estimatedEnd, referenceEnd)
      : null;

  const expectedProgressPct =
    !isFinalized && planFrom !== null && estimatedEnd !== null
      ? clamp(
          round1(((nowMs - planFrom) / Math.max(estimatedEnd - planFrom, DAY_MS)) * 100),
          0,
          100,
        )
      : null;

  const completionPercentage = resolveCompletionPercentage(input);
  const scheduleSlippagePct =
    expectedProgressPct !== null
      ? Math.max(0, round1(expectedProgressPct - completionPercentage))
      : null;

  return {
    estimatedStartDate: input.estimatedStartDate,
    estimatedEndDate: input.estimatedEndDate,
    realStartDate: input.realStartDate,
    realEndDate: input.realEndDate,
    plannedDurationDays,
    actualDurationDays,
    timeVariationPct,
    deviationDays,
    delayDays: deviationDays !== null ? Math.max(0, deviationDays) : 0,
    expectedProgressPct,
    scheduleSlippagePct,
  };
}

/**
 * Carga de trabajo: horas registradas por semana natural (inicio lunes) durante
 * las últimas WEEKS_OF_HISTORY semanas, incluyendo semanas sin registros en 0.
 */
export function computeWorkload(input: ProjectMetricsInput, now: Date): WorkloadPoint[] {
  const hoursByDay = new Map<string, number>();
  for (const row of input.dailyHours) {
    const time = toTime(row.day);
    if (time === null) continue;
    hoursByDay.set(toISODate(time), (hoursByDay.get(toISODate(time)) ?? 0) + row.hours);
  }

  // Inicio (lunes) de la semana corriente, anclado a UTC para coincidir con las fechas de time_entries.
  const nowUtcMidnight = Math.floor(now.getTime() / DAY_MS) * DAY_MS;
  const currentWeekStartMs = nowUtcMidnight - ((new Date(nowUtcMidnight).getUTCDay() + 6) % 7) * DAY_MS;

  const points: WorkloadPoint[] = [];
  for (let index = WEEKS_OF_HISTORY - 1; index >= 0; index -= 1) {
    const weekStartMs = currentWeekStartMs - index * 7 * DAY_MS;
    let weekHours = 0;
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      weekHours += hoursByDay.get(toISODate(weekStartMs + dayOffset * DAY_MS)) ?? 0;
    }
    points.push({
      weekLabel: new Date(weekStartMs).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      hours: round1(weekHours),
    });
  }
  return points;
}

/**
 * Semáforo de riesgo (PRD §72): horas consumidas, tiempo restante, tareas
 * bloqueadas, dependencias, milestones vencidos e inactividad.
 */
export function computeRisk(input: ProjectMetricsInput, slippagePct: number | null, consumedHours: number, now: Date): RiskAssessment {
  const isFinalized = FINALIZED_STATUSES.includes(input.status);
  const estimatedHours = resolveEstimatedHours(input);
  const effortVariationPct = ratioPct(consumedHours - estimatedHours, estimatedHours);

  const lastActivityMs =
    [toTime(input.tasks.lastActivityAt)]
      .filter((value): value is number => value !== null)
      .sort((a, b) => b - a)[0] ?? null;
  const inactiveDays = lastActivityMs !== null ? Math.max(0, daysBetween(lastActivityMs, now.getTime())) : null;

  const factors: RiskFactor[] = [
    {
      id: "effort_overrun",
      label: "Effort overrun",
      triggered: (effortVariationPct ?? 0) > 15,
      detail:
        effortVariationPct === null
          ? "No estimates recorded yet."
          : effortVariationPct > 15
            ? `${effortVariationPct}% over the estimated hours.`
            : `Within estimate (${effortVariationPct}% variation).`,
    },
    {
      id: "schedule_slippage",
      label: "Schedule slippage",
      triggered: (slippagePct ?? 0) >= 15,
      detail:
        slippagePct === null
          ? "No baseline schedule to compare against."
          : slippagePct >= 15
            ? `${slippagePct}% behind the expected progress.`
            : "Progress is on or ahead of schedule.",
    },
    {
      id: "blocked_tasks",
      label: "Blocked tasks",
      triggered: input.tasks.blocked > 0,
      detail:
        input.tasks.blocked > 0
          ? `${input.tasks.blocked} task(s) currently blocked.`
          : "No blocked tasks.",
    },
    {
      id: "pending_dependencies",
      label: "Pending dependencies",
      triggered: input.pendingDependencies > 0,
      detail:
        input.pendingDependencies > 0
          ? `${input.pendingDependencies} open dependency chain(s).`
          : "No blocking dependencies.",
    },
    {
      id: "overdue_milestones",
      label: "Overdue milestones",
      triggered: input.milestones.overdue > 0,
      detail:
        input.milestones.overdue > 0
          ? `${input.milestones.overdue} milestone(s) past their due date.`
          : "All milestones on track.",
    },
    {
      id: "inactivity",
      label: "Inactivity",
      triggered: !isFinalized && (inactiveDays ?? Number.POSITIVE_INFINITY) > 14,
      detail:
        inactiveDays === null
          ? "No activity recorded yet."
          : inactiveDays > 14
            ? `No activity for ${inactiveDays} days.`
            : `Last activity ${inactiveDays} day(s) ago.`,
    },
  ];

  let score = 0;
  for (const factor of factors) {
    if (!factor.triggered || (factor.id === "inactivity" && isFinalized)) continue;
    switch (factor.id) {
      case "schedule_slippage":
        score += (slippagePct ?? 0) >= 40 ? 2 : 1;
        break;
      case "blocked_tasks":
        score += input.tasks.blocked >= 3 ? 2 : 1;
        break;
      case "overdue_milestones":
        score += input.milestones.overdue >= 2 ? 2 : 1;
        break;
      case "inactivity":
        score += (inactiveDays ?? 0) > 30 ? 2 : 1;
        break;
      default:
        score += 1;
    }
  }

  const level: RiskLevel = score >= 3 ? "high" : score >= 1 ? "medium" : "low";
  return { level, score, factors };
}

export function computeHealth(risk: RiskAssessment, slippagePct: number | null): HealthStatus {
  if (risk.level === "high" || (slippagePct ?? 0) >= 40) return "critical";
  if (risk.level === "medium" || (slippagePct ?? 0) >= 15) return "at_risk";
  return "healthy";
}

export function computeProductivity(input: ProjectMetricsInput, consumedHours: number): ProductivitySummary {
  return {
    totalTasks: input.tasks.total,
    completedTasks: input.tasks.completed,
    blockedTasks: input.tasks.blocked,
    taskCompletionRatePct: ratioPct(input.tasks.completed, input.tasks.total) ?? 0,
    avgHoursPerCompletedTask:
      input.tasks.completed > 0 ? round1(consumedHours / input.tasks.completed) : null,
  };
}

/** Punto de entrada: consolida estimaciones (6.6), indicadores (6.9) y métricas (6.15). */
export function buildProjectMetrics(input: ProjectMetricsInput, now: Date = new Date()): ProjectMetricsBundle {
  const estimates = computeEstimates(input);
  const schedule = computeSchedule(input, now);
  const workload = computeWorkload(input, now);
  const productivity = computeProductivity(input, estimates.consumedHours);
  const risk = computeRisk(input, schedule.scheduleSlippagePct, estimates.consumedHours, now);
  const health = computeHealth(risk, schedule.scheduleSlippagePct);

  const indicators: ProjectIndicators = {
    completionPercentage: estimates.completionPercentage,
    expectedProgressPct: schedule.expectedProgressPct,
    scheduleSlippagePct: schedule.scheduleSlippagePct,
    usedHours: estimates.consumedHours,
    remainingHours: estimates.remainingHours,
    productivity,
    risk,
    health,
    openTasksByStatus: input.tasks.statusCounts.filter((row) => row.count > 0),
    delayedTaskCount: input.tasks.overdue,
    overdueMilestoneCount: input.milestones.overdue,
    pendingDependencyCount: input.pendingDependencies,
  };

  return { estimates, schedule, indicators, workload };
}
