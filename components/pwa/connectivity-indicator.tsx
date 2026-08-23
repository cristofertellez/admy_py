"use client";

import { Badge } from "@/components/shared/badge";
import { useConnectivity } from "@/hooks/use-connectivity";
import type { SyncSnapshot } from "@/lib/sync/types";

const SYNC_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

function getSyncTooltip(snapshot: SyncSnapshot): string {
  const { lastSyncedAt, lastErrors } = snapshot;

  if (lastErrors.length > 0) {
    return `Last sync issue: ${lastErrors[0].message}`;
  }
  if (!lastSyncedAt) {
    return "Data has not been synchronized yet.";
  }

  return `Last sync: ${SYNC_TIME_FORMAT.format(new Date(lastSyncedAt))}`;
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-2 animate-spin rounded-full border border-current border-t-transparent"
    />
  );
}

export function ConnectivityIndicator() {
  const {
    isOnline,
    syncStatus,
    lastSyncedAt,
    pendingChanges,
    conflicts,
    lastErrors,
    retrySync,
  } = useConnectivity();

  const hasSyncIssues = conflicts > 0 || syncStatus === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      title={getSyncTooltip({ isOnline, syncStatus, lastSyncedAt, pendingChanges, conflicts, lastErrors })}
      className="flex items-center gap-2"
    >
      {pendingChanges > 0 && (
        <Badge variant="warning">
          {pendingChanges} pending change{pendingChanges === 1 ? "" : "s"}
        </Badge>
      )}
      {conflicts > 0 && (
        <Badge variant="error">
          {conflicts} conflict{conflicts === 1 ? "" : "s"}
        </Badge>
      )}
      {!isOnline ? (
        <Badge variant="error" className="gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          <span className="hidden sm:inline">Offline</span>
          <span className="sr-only">Offline</span>
        </Badge>
      ) : syncStatus === "syncing" ? (
        <Badge variant="default" className="gap-1.5">
          <Spinner />
          <span className="hidden sm:inline">Syncing…</span>
          <span className="sr-only">Syncing</span>
        </Badge>
      ) : (
        <Badge
          variant={hasSyncIssues ? "error" : "success"}
          className={hasSyncIssues ? "gap-1.5" : undefined}
        >
          {hasSyncIssues && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
          <span className="hidden sm:inline">{hasSyncIssues ? "Sync error" : "Online"}</span>
          <span className="sr-only">{hasSyncIssues ? "Sync error" : "Online"}</span>
        </Badge>
      )}
      {isOnline && hasSyncIssues && (
        <button
          type="button"
          onClick={retrySync}
          className="text-caption-uppercase font-semibold text-body transition-colors hover:text-body-strong hover:underline underline-offset-4"
        >
          Retry
        </button>
      )}
    </div>
  );
}
