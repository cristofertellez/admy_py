import { executePendingAction } from "./executor";
import {
  clearPendingActionConflict,
  listPendingActions,
  markPendingActionAttempt,
  markPendingActionConflict,
  removePendingAction,
  type PendingAction,
} from "./pending-actions";

interface PendingActionsFlushResult {
  executed: boolean;
  synced: number;
  failed: number;
  conflicted: number;
}

const EMPTY_FLUSH_RESULT: PendingActionsFlushResult = {
  executed: false,
  synced: 0,
  failed: 0,
  conflicted: 0,
};

/**
 * A failure is transient when connectivity is gone or the request never
 * reached the server; those actions stay queued for the next flush.
 * Any other rejection means the server saw the action and refused it:
 * that is a conflict, resolved manually (retry or discard), never auto-dropped.
 */
function classifySyncFailure(error: string): "transient" | "conflict" {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "transient";
  }
  return /network|failed to fetch|load failed|timed? ?out|temporarily unavailable|connection/i.test(
    error,
  )
    ? "transient"
    : "conflict";
}

let flushInFlight = false;

/**
 * Replays pending actions in FIFO order. Conflicted actions are skipped
 * (they require manual resolution). Stops at the first transient failure to
 * preserve ordering; conflicts are set aside and flushing continues.
 */
export async function flushPendingActions(): Promise<PendingActionsFlushResult> {
  if (flushInFlight) {
    return EMPTY_FLUSH_RESULT;
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return EMPTY_FLUSH_RESULT;
  }

  const queue = listPendingActions().filter((action) => action.conflict !== true);

  if (queue.length === 0) {
    return EMPTY_FLUSH_RESULT;
  }

  flushInFlight = true;

  try {
    let synced = 0;
    let failed = 0;
    let conflicted = 0;

    for (const action of queue) {
      const result = await replayAction(action);

      if (result.success) {
        removePendingAction(action.id);
        synced += 1;
        continue;
      }

      const error = result.error ?? "Unknown sync error.";

      if (classifySyncFailure(error) === "transient") {
        markPendingActionAttempt(action.id, error);
        failed += 1;
        break;
      }

      markPendingActionConflict(action.id, error);
      console.error(`[offline-sync] conflict on ${action.type}: ${error}`);
      conflicted += 1;
    }

    return { executed: true, synced, failed, conflicted };
  } finally {
    flushInFlight = false;
  }
}

/**
 * Manual resolution of one conflicted action: replays it once regardless of
 * the automatic pipeline. Returns true only when it finally syncs.
 */
export async function retryPendingAction(id: string): Promise<boolean> {
  const action = listPendingActions().find((pending) => pending.id === id);
  if (!action || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return false;
  }

  clearPendingActionConflict(id);
  const result = await replayAction({ ...action, conflict: false });

  const error = result.error ?? "Unknown sync error.";
  if (result.success) {
    removePendingAction(id);
    return true;
  }
  if (classifySyncFailure(error) === "transient") {
    markPendingActionAttempt(id, error);
  } else {
    markPendingActionConflict(id, error);
  }
  return false;
}

/** Manual discard of a conflicted action: gives up on that local change. */
export function discardPendingAction(id: string): void {
  removePendingAction(id);
}

async function replayAction(action: PendingAction): Promise<{ success: boolean; error?: string }> {
  try {
    await executePendingAction(action);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown sync error.",
    };
  }
}
