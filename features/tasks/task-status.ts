import { TASK_STATUSES, TASK_STATUS_TRANSITIONS } from "@/constants";
import type { TaskStatus } from "@/types";

export class InvalidTaskStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid status change: a task cannot go from "${from}" to "${to}".`);
    this.name = "InvalidTaskStatusTransitionError";
  }
}

export function isValidTaskStatus(status: string): status is TaskStatus {
  return Object.values(TASK_STATUSES).includes(status as TaskStatus);
}

// Pure domain rule so the same validation can run in server actions and UI
// option building without duplicating the transition table (Historia 7.5).
export function canTransitionTaskStatus(from: string, to: string): boolean {
  if (from === to) return true;
  return TASK_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTaskStatusTransition(from: string, to: string): void {
  if (!canTransitionTaskStatus(from, to)) {
    throw new InvalidTaskStatusTransitionError(from, to);
  }
}

export function getAllowedTaskStatusOptions(current?: string | null): { value: string; label: string }[] {
  if (!current || !isValidTaskStatus(current)) {
    return Object.values(TASK_STATUSES).map((value) => ({ value, label: value }));
  }

  const allowed = TASK_STATUS_TRANSITIONS[current] ?? [];
  return [...new Set([current, ...allowed])].map((value) => ({ value, label: value }));
}
