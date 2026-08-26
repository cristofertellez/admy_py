export type RiskLevel = "low" | "medium" | "high";

export type HealthStatus = "healthy" | "at_risk" | "critical";

/**
 * Historia 6.6 — Estimaciones del Proyecto.
 * Comparación entre la estimación inicial y el consumo/progreso real.
 */
export interface EstimatesSummary {
  estimatedHours: number;
  consumedHours: number;
  remainingHours: number;
  /** (consumidas − estimadas) / estimadas × 100. Positivo = sobrecosto de esfuerzo. */
  effortVariationPct: number | null;
  completionPercentage: number;
}

/**
 * Historia 6.6 / 6.15 — Dimensión temporal del proyecto.
 * Todas las duraciones y desviaciones se expresan en días naturales.
 */
export interface ScheduleSummary {
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  realStartDate: string | null;
  realEndDate: string | null;
  plannedDurationDays: number | null;
  actualDurationDays: number | null;
  /** Solo proyectos finalizados: variación entre duración real y planificada (%). */
  timeVariationPct: number | null;
  /** Desviación firmada en días: fin real (o hoy, si sigue activo) contra fin estimado. */
  deviationDays: number | null;
  /** Parte positiva de la desviación; 0 cuando el proyecto va en fecha o adelantado. */
  delayDays: number;
  /** Progreso lineal esperado a la fecha según el cronograma planificado. */
  expectedProgressPct: number | null;
  /** % retraso = max(0, progreso esperado − progreso real). Nulo si no hay línea base. */
  scheduleSlippagePct: number | null;
}

export interface ProductivitySummary {
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  taskCompletionRatePct: number;
  avgHoursPerCompletedTask: number | null;
}

export interface WorkloadPoint {
  weekLabel: string;
  hours: number;
}

/** Factores del semáforo de riesgo definidos en PRD §72. */
export interface RiskFactor {
  id:
    | "effort_overrun"
    | "schedule_slippage"
    | "blocked_tasks"
    | "pending_dependencies"
    | "overdue_milestones"
    | "inactivity";
  label: string;
  triggered: boolean;
  detail: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  factors: RiskFactor[];
}

/**
 * Historia 6.9 — Indicadores del Proyecto.
 * Valores calculados automáticamente; nunca editables manualmente.
 */
export interface ProjectIndicators {
  completionPercentage: number;
  expectedProgressPct: number | null;
  scheduleSlippagePct: number | null;
  usedHours: number;
  remainingHours: number;
  productivity: ProductivitySummary;
  risk: RiskAssessment;
  health: HealthStatus;
  openTasksByStatus: { status: string; count: number }[];
  delayedTaskCount: number;
  overdueMilestoneCount: number;
  pendingDependencyCount: number;
}

/**
 * Historia 6.15 — Métricas del Proyecto.
 * Vista consolidada (duración, horas, productividad, retrasos, riesgos,
 * progreso y carga de trabajo) derivada de las historias 6.6 y 6.9.
 */
export interface ProjectMetricsBundle {
  estimates: EstimatesSummary;
  schedule: ScheduleSummary;
  indicators: ProjectIndicators;
  workload: WorkloadPoint[];
}
