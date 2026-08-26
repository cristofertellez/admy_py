import { PROJECT_STATUSES, PROJECT_STATUS_TRANSITIONS } from "@/constants";
import type { ProjectStatus } from "@/types";

export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid status change: a project cannot go from "${from}" to "${to}".`);
    this.name = "InvalidStatusTransitionError";
  }
}

export function isValidProjectStatus(status: string): status is ProjectStatus {
  return Object.values(PROJECT_STATUSES).includes(status as ProjectStatus);
}

// Pure domain rule so the same validation can run in server actions and UI
// option building without duplicating the transition table.
export function canTransitionProjectStatus(from: string, to: string): boolean {
  if (from === to) return true;
  return PROJECT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertProjectStatusTransition(from: string, to: string): void {
  if (!canTransitionProjectStatus(from, to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}

export function getAllowedProjectStatusOptions(current?: string | null): { value: string; label: string }[] {
  if (!current || !isValidProjectStatus(current)) {
    return Object.values(PROJECT_STATUSES).map((value) => ({ value, label: value }));
  }

  const allowed = PROJECT_STATUS_TRANSITIONS[current] ?? [];
  return [...new Set([current, ...allowed])].map((value) => ({ value, label: value }));
}
