import { onlineManager, type QueryClient } from "@tanstack/react-query";
import {
  countConflictedActions,
  countPendingActions,
  listPendingActions,
  subscribeToPendingActions,
} from "../offline/pending-actions";
import { flushPendingActions } from "../offline/sync";
import type { SyncError, SyncSnapshot } from "./types";

const LAST_SYNC_STORAGE_KEY = "connectivity-last-sync";
const INITIAL_SNAPSHOT: SyncSnapshot = {
  isOnline: true,
  syncStatus: "idle",
  lastSyncedAt: null,
  pendingChanges: 0,
  conflicts: 0,
  lastErrors: [],
};

type SyncListener = () => void;

function readLastSyncedAt(): number | null {
  try {
    const stored = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
    const parsed = stored ? Number(stored) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistLastSyncedAt(timestamp: number): void {
  try {
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, String(timestamp));
  } catch {
    // Storage may be unavailable (private mode); the state stays in memory.
  }
}

function countPausedMutations(queryClient: QueryClient): number {
  return queryClient
    .getMutationCache()
    .getAll()
    .filter((mutation) => mutation.state.status === "pending").length;
}

function getRecentQueueErrors(): SyncError[] {
  return listPendingActions()
    .filter((action) => action.lastError !== null || action.conflict === true)
    .map((action) => ({ message: action.lastError ?? "Conflicting change requires review." }));
}

/**
 * Orchestrates synchronization whenever connectivity is restored:
 * 1. Resumes TanStack Query mutations that were paused while offline.
 * 2. Replays the persistent pending-actions queue (see offline/sync.ts).
 * 3. Invalidates queries so server state (source of truth) refreshes the UI.
 */
class SyncManager {
  private readonly queryClient: QueryClient;
  private listeners = new Set<SyncListener>();
  private unsubscribeFns: Array<() => void> = [];
  private syncing = false;
  private started = false;
  private snapshot: SyncSnapshot;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.snapshot = INITIAL_SNAPSHOT;
  }

  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;

    this.setSnapshot({ lastSyncedAt: readLastSyncedAt() });
    this.refreshSnapshot();

    this.unsubscribeFns = [
      onlineManager.subscribe((isOnline) => {
        this.setSnapshot({ isOnline });
        if (isOnline) {
          void this.triggerSync();
        }
      }),
      subscribeToPendingActions(() => this.refreshSnapshot()),
      this.queryClient.getMutationCache().subscribe(() => this.refreshSnapshot()),
    ];

    // Catch up on actions queued in previous sessions (e.g. closed tab).
    if (onlineManager.isOnline() && countPendingActions() > 0) {
      void this.triggerSync();
    }
  }

  stop(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];
    this.started = false;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): SyncSnapshot {
    return this.snapshot;
  }

  retrySync(): void {
    void this.triggerSync();
  }

  async triggerSync(): Promise<void> {
    if (this.syncing || !onlineManager.isOnline()) return;
    this.syncing = true;
    this.setSnapshot({ syncStatus: "syncing" });

    try {
      await this.queryClient.resumePausedMutations();
      const flushResult = await flushPendingActions();
      await this.queryClient.invalidateQueries();

      const syncedAt = Date.now();
      persistLastSyncedAt(syncedAt);
      this.refreshSnapshot({
        syncStatus: flushResult.conflicted > 0 || flushResult.failed > 0 ? "error" : "synced",
        lastSyncedAt: syncedAt,
      });
    } catch (error) {
      console.error("[offline-sync] unexpected sync failure:", error);
      this.refreshSnapshot({ syncStatus: "error" });
    } finally {
      this.syncing = false;
    }
  }

  private refreshSnapshot(
    overrides?: Partial<Pick<SyncSnapshot, "syncStatus" | "lastSyncedAt">>,
  ): void {
    this.setSnapshot({
      ...overrides,
      pendingChanges: countPendingActions() + countPausedMutations(this.queryClient),
      conflicts: countConflictedActions(),
      lastErrors: getRecentQueueErrors(),
    });
  }

  private setSnapshot(patch: Partial<SyncSnapshot>): void {
    const next = { ...this.snapshot, ...patch };
    if (shallowEqual(next, this.snapshot)) return;
    this.snapshot = next;
    for (const listener of this.listeners) {
      listener();
    }
  }
}

function shallowEqual(a: SyncSnapshot, b: SyncSnapshot): boolean {
  return (
    a.isOnline === b.isOnline &&
    a.syncStatus === b.syncStatus &&
    a.lastSyncedAt === b.lastSyncedAt &&
    a.pendingChanges === b.pendingChanges &&
    a.conflicts === b.conflicts &&
    a.lastErrors.length === b.lastErrors.length
  );
}

let singleton: SyncManager | null = null;

export function getSyncManager(queryClient: QueryClient): SyncManager {
  singleton ??= new SyncManager(queryClient);
  return singleton;
}
