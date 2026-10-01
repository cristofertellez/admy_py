import type { MilestoneStatus } from "@/types";
import type { MilestoneWithStats } from "./milestones.types";

const OPEN_MILESTONE_STATUSES: ReadonlySet<string> = new Set(["Pending", "In Progress", "In Review"]);

export type MilestoneRisk = "low" | "medium" | "high";

export interface MilestoneIndicators {
  /** Effective progress: derived from tasks when they exist, manual otherwise. */
  progress: number;
  progressSource: "tasks" | "manual";
  estimatedHours: number;
  workedHours: number;
  remainingHours: number;
  isOverdue: boolean;
  /** Days late: today vs target while open, or completion vs target when done late. */
  delayDays: number | null;
  risk: MilestoneRisk;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: string, to: string): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Historias 8.6 / 8.9 — Progreso automático e indicadores del hito.
 * Pure arithmetic over the aggregated row so the same rules can be reused by
 * the milestones page, the project dashboard and the role dashboards.
 */
export function buildMilestoneIndicators(
  milestone: MilestoneWithStats,
  today: string,
): MilestoneIndicators {
  const isOpen = OPEN_MILESTONE_STATUSES.has(milestone.status);
  const hasTasks = milestone.task_count > 0;

  const taskRatio = hasTasks ? (milestone.completed_tasks / milestone.task_count) * 100 : null;
  const progress = taskRatio ?? milestone.completion_percentage;
  const progressSource: "tasks" | "manual" = hasTasks ? "tasks" : "manual";

  const estimatedHours = milestone.estimated_hours_sum || 0;
  const workedHours = milestone.worked_hours_sum || 0;
  const remainingHours = Math.max(0, round1(estimatedHours - workedHours));

  const isOverdue =
    isOpen &&
    !!milestone.estimated_date &&
    milestone.estimated_date < today;

  let delayDays: number | null = null;
  if (isOverdue && milestone.estimated_date) {
    delayDays = Math.max(0, daysBetween(milestone.estimated_date, today));
  } else if (milestone.status === "Completed" && milestone.estimated_date && milestone.completed_date) {
    const late = daysBetween(milestone.estimated_date, milestone.completed_date);
    if (late > 0) delayDays = late;
  }

  const hoursOverrun = estimatedHours > 0 && workedHours > estimatedHours;
  const dueWithinAWeek = isOpen && !!milestone.estimated_date && milestone.estimated_date >= today;

  let risk: MilestoneRisk = "low";
  if (isOverdue || (hoursOverrun && progress < 100)) {
    risk = "high";
  } else if (dueWithinAWeek && progress < 70) {
    risk = "medium";
  }

  return {
    progress: Math.round(progress),
    progressSource,
    estimatedHours: round1(estimatedHours),
    workedHours: round1(workedHours),
    remainingHours,
    isOverdue,
    delayDays,
    risk,
  };
}

export function isOpenMilestoneStatus(status: string): boolean {
  return OPEN_MILESTONE_STATUSES.has(status);
}

export type { MilestoneStatus };
