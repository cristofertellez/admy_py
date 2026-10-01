import { MILESTONE_STATUSES, MILESTONE_STATUS_TRANSITIONS } from "@/constants";
import type { MilestoneStatus } from "@/types";

export class InvalidMilestoneStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid status change: a milestone cannot go from "${from}" to "${to}".`);
    this.name = "InvalidMilestoneStatusTransitionError";
  }
}

export function isValidMilestoneStatus(status: string): status is MilestoneStatus {
  return Object.values(MILESTONE_STATUSES).includes(status as MilestoneStatus);
}

// Pure domain rule so the same validation can run in server actions and UI
// option building without duplicating the transition table (Historia 8.4).
export function canTransitionMilestoneStatus(from: string, to: string): boolean {
  if (from === to) return true;
  return MILESTONE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertMilestoneStatusTransition(from: string, to: string): void {
  if (!canTransitionMilestoneStatus(from, to)) {
    throw new InvalidMilestoneStatusTransitionError(from, to);
  }
}

export function getAllowedMilestoneStatusOptions(
  current?: string | null,
): { value: string; label: string }[] {
  if (!current || !isValidMilestoneStatus(current)) {
    return Object.values(MILESTONE_STATUSES).map((value) => ({ value, label: value }));
  }

  const allowed = MILESTONE_STATUS_TRANSITIONS[current] ?? [];
  return [...new Set([current, ...allowed])].map((value) => ({ value, label: value }));
}
