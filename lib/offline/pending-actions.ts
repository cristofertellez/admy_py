import { z } from "zod";

export const PENDING_ACTION_TYPES = [
  "project-comment.create",
  "task-comment.create",
  "task.update",
  "task.complete",
  "project.update",
] as const;

export type PendingActionType = (typeof PENDING_ACTION_TYPES)[number];

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: Record<string, string>;
  createdAt: number;
  attempts: number;
  lastError: string | null;
  /**
   * True when the server rejected the action during sync (validation,
   * permissions or stale data). Conflicted actions leave the automatic flush
   * pipeline until they are retried or discarded manually.
   * Optional so actions persisted by older versions remain valid.
   */
  conflict?: boolean;
}

export const MAX_PENDING_ACTION_ATTEMPTS = 5;

const STORAGE_KEY = "pwa-pending-actions-v1";

const projectIdSchema = z.string().min(1, "Project id is required.");
const taskIdSchema = z.string().min(1, "Task id is required.");
const messageSchema = z.string().trim().min(1, "Message cannot be empty.");

const payloadSchemas = {
  "project-comment.create": z
    .object({
      project_id: projectIdSchema,
      message: messageSchema,
    })
    .strip(),
  "task-comment.create": z
    .object({
      task_id: taskIdSchema,
      message: messageSchema,
    })
    .strip(),
  "task.update": z
    .object({
      id: taskIdSchema,
    })
    .passthrough()
    .transform((data) => data as Record<string, string>),
  "task.complete": z
    .object({
      id: taskIdSchema,
      completed: z.enum(["true", "false"]),
    })
    .strip(),
  "project.update": z
    .object({
      id: projectIdSchema,
    })
    .passthrough()
    .transform((data) => data as Record<string, string>),
} satisfies Record<PendingActionType, z.ZodTypeAny>;

const EMPTY_ACTIONS: PendingAction[] = [];

let cache: PendingAction[] | null = null;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadFromStorage(): PendingAction[] {
  if (!isBrowser()) return EMPTY_ACTIONS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ACTIONS;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_ACTIONS;

    return parsed.filter(isValidPendingAction);
  } catch {
    return EMPTY_ACTIONS;
  }
}

function isValidPendingAction(value: unknown): value is PendingAction {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<PendingAction>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    PENDING_ACTION_TYPES.includes(candidate.type as PendingActionType) &&
    typeof candidate.payload === "object" &&
    candidate.payload !== null &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.attempts === "number"
  );
}

function persist(): void {
  if (!isBrowser() || cache === null) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage may be unavailable (private mode); the queue keeps working in memory.
  }
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): PendingAction[] {
  if (cache === null) {
    cache = loadFromStorage();
  }
  return cache;
}

export function subscribeToPendingActions(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listPendingActions(): PendingAction[] {
  return getSnapshot();
}

export function countPendingActions(): number {
  return getSnapshot().length;
}

export function validatePendingActionPayload(
  type: PendingActionType,
  payload: Record<string, unknown>,
): { success: true; data: Record<string, string> } | { success: false; error: string } {
  const result = payloadSchemas[type].safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data as Record<string, string> };
  }
  return { success: false, error: result.error.issues[0]?.message ?? "Invalid action data." };
}

export class PendingActionValidationError extends Error {}

export function enqueuePendingAction(
  type: PendingActionType,
  payload: Record<string, unknown>,
): PendingAction {
  const validation = validatePendingActionPayload(type, payload);
  if (!validation.success) {
    throw new PendingActionValidationError(validation.error);
  }

  const action: PendingAction = {
    id: generateActionId(),
    type,
    payload: validation.data,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
    conflict: false,
  };

  cache = [...getSnapshot(), action];
  persist();
  notify();

  return action;
}

export function removePendingAction(id: string): void {
  cache = getSnapshot().filter((action) => action.id !== id);
  persist();
  notify();
}

export function clearPendingActions(): void {
  cache = EMPTY_ACTIONS;
  persist();
  notify();
}

export function markPendingActionAttempt(id: string, error: string | null): void {
  cache = getSnapshot().map((action) =>
    action.id === id
      ? { ...action, attempts: action.attempts + 1, lastError: error }
      : action,
  );
  persist();
  notify();
}

export function markPendingActionConflict(id: string, error: string): void {
  cache = getSnapshot().map((action) =>
    action.id === id ? { ...action, conflict: true, lastError: error } : action,
  );
  persist();
  notify();
}

/** Manual retry of a conflicted action: back to the automatic flush pipeline. */
export function clearPendingActionConflict(id: string): void {
  cache = getSnapshot().map((action) =>
    action.id === id ? { ...action, conflict: false } : action,
  );
  persist();
  notify();
}

export function countConflictedActions(): number {
  return getSnapshot().filter((action) => action.conflict === true).length;
}

function generateActionId(): string {
  if (isBrowser() && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `pa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toSerializablePayload(formData: FormData): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
    }
  }
  return payload;
}

export function toFormData(payload: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value);
  }
  return formData;
}
