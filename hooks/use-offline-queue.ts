"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import {
  PendingActionValidationError,
  enqueuePendingAction,
  listPendingActions,
  subscribeToPendingActions,
  toSerializablePayload,
  type PendingAction,
  type PendingActionType,
} from "@/lib/offline/pending-actions";
import { flushPendingActions } from "@/lib/offline/sync";

export interface QueuedFormActionState {
  success?: string;
  error?: string;
}

export const OFFLINE_QUEUED_MESSAGE =
  "No connection: your change was saved locally and will be sent automatically when you are back online.";

const EMPTY_ACTIONS: PendingAction[] = [];

function getServerSnapshot(): PendingAction[] {
  return EMPTY_ACTIONS;
}

// Historia 14.14 — reconnection and synchronization results are audited.
function reportPwaEvent(type: string, detail?: Record<string, unknown>): void {
  void fetch("/api/pwa/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, detail }),
  }).catch(() => undefined);
}

interface UseOfflineQueueResult {
  actions: PendingAction[];
  count: number;
  isFlushing: boolean;
  isOnline: boolean;
  enqueue: (
    type: PendingActionType,
    input: FormData | Record<string, string>,
  ) => PendingAction | null;
  flush: () => Promise<void>;
}

interface UseOfflineQueueOptions {
  /**
   * Historia 14.13 — when false (pwa_background_sync disabled), queued
   * actions are not flushed automatically on reconnection; the user
   * triggers them manually through the connectivity indicator.
   */
  autoSync?: boolean;
}

export function useOfflineQueue({ autoSync = true }: UseOfflineQueueOptions = {}): UseOfflineQueueResult {
  const queryClient = useQueryClient();
  const [isFlushing, setIsFlushing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());
  const actions = useSyncExternalStore(
    subscribeToPendingActions,
    listPendingActions,
    getServerSnapshot,
  );

  useEffect(() => {
    return onlineManager.subscribe((online) => setIsOnline(online));
  }, []);

  const flush = useCallback(async () => {
    setIsFlushing(true);
    try {
      const result = await flushPendingActions();
      if (result.synced > 0) {
        queryClient.invalidateQueries();
        reportPwaEvent("sync_completed", { synced: result.synced });
      }
      if (result.failed > 0) {
        reportPwaEvent("offline_error", { failed: result.failed });
      }
    } finally {
      setIsFlushing(false);
    }
  }, [queryClient]);

  // Process queued actions as soon as the connection is restored (unless
  // background sync is disabled in settings — manual retry then).
  const wasOffline = useRef(!onlineManager.isOnline());

  useEffect(() => {
    if (!autoSync) return;

    const unsubscribe = onlineManager.subscribe((online) => {
      if (online && wasOffline.current) {
        wasOffline.current = false;
        void flush();
      } else if (!online) {
        wasOffline.current = true;
      }
    });

    if (onlineManager.isOnline() && listPendingActions().length > 0) {
      void flush();
    }

    return unsubscribe;
  }, [flush, autoSync]);

  const enqueue = useCallback(
    (type: PendingActionType, input: FormData | Record<string, string>) => {
      const payload = input instanceof FormData ? toSerializablePayload(input) : input;

      try {
        return enqueuePendingAction(type, payload);
      } catch (error) {
        if (error instanceof PendingActionValidationError) {
          return null;
        }
        throw error;
      }
    },
    [],
  );

  return { actions, count: actions.length, isFlushing, isOnline, enqueue, flush };
}
