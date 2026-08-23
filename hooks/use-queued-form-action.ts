"use client";

import { useCallback, useState } from "react";
import type { PendingActionType } from "@/lib/offline/pending-actions";
import {
  OFFLINE_QUEUED_MESSAGE,
  useOfflineQueue,
  type QueuedFormActionState,
} from "./use-offline-queue";

const OFFLINE_ACTION_UNAVAILABLE_MESSAGE =
  "No connection: this action will be available once you are back online.";

type QueuedServerAction = (
  prevState: unknown,
  formData: FormData,
) => Promise<QueuedFormActionState>;

interface UseQueuedFormActionResult {
  formAction: (formData: FormData) => Promise<void>;
  isPending: boolean;
  state: QueuedFormActionState | null;
}

/**
 * Wraps a `(prevState, formData)` server action so it can be used as
 * `<form action={formAction}>`. When the device is offline and the action
 * supports queuing, the payload is stored in the pending actions queue and
 * replayed automatically once connectivity is restored.
 */
export function useQueuedFormAction(
  queueType: PendingActionType | null,
  action: QueuedServerAction,
): UseQueuedFormActionResult {
  const { isOnline, enqueue } = useOfflineQueue();
  const [state, setState] = useState<QueuedFormActionState | null>(null);
  const [isPending, setIsPending] = useState(false);

  const formAction = useCallback(
    async (formData: FormData) => {
      if (!isOnline) {
        if (queueType === null) {
          setState({ error: OFFLINE_ACTION_UNAVAILABLE_MESSAGE });
          return;
        }

        const queued = enqueue(queueType, formData);
        setState(
          queued
            ? { success: OFFLINE_QUEUED_MESSAGE }
            : { error: OFFLINE_ACTION_UNAVAILABLE_MESSAGE },
        );
        return;
      }

      setIsPending(true);
      try {
        setState(await action(null, formData));
      } catch {
        setState({ error: "Unexpected error. Please try again." });
      } finally {
        setIsPending(false);
      }
    },
    [action, enqueue, isOnline, queueType],
  );

  return { formAction, isPending, state };
}
