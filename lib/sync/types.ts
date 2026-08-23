export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SyncError {
  message: string;
}

export interface SyncSnapshot {
  isOnline: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  /** Queued actions awaiting sync plus TanStack mutations paused while offline. */
  pendingChanges: number;
  conflicts: number;
  lastErrors: SyncError[];
}
