"use client";

import { useSyncExternalStore } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getSyncManager } from "@/lib/sync/sync-manager";
import type { SyncSnapshot } from "@/lib/sync/types";

export type { SyncSnapshot };

const DEFAULT_SNAPSHOT: SyncSnapshot = {
  isOnline: true,
  syncStatus: "idle",
  lastSyncedAt: null,
  pendingChanges: 0,
  conflicts: 0,
  lastErrors: [],
};

function getServerSnapshot(): SyncSnapshot {
  return DEFAULT_SNAPSHOT;
}

export function useConnectivity(): SyncSnapshot & { retrySync: () => void } {
  const queryClient: QueryClient = useQueryClient();
  const syncManager = getSyncManager(queryClient);

  const state = useSyncExternalStore(
    (listener) => syncManager.subscribe(listener),
    () => syncManager.getSnapshot(),
    getServerSnapshot,
  );

  return { ...state, retrySync: () => syncManager.retrySync() };
}
