"use client";

import { useOfflineQueue } from "@/hooks/use-offline-queue";

/**
 * Mounted once in the dashboard layout. Watches connectivity and replays the
 * pending actions queue whenever the device comes back online.
 *
 * Historia 14.13 — `autoSync` mirrors the pwa_background_sync setting:
 * when it is off, queued actions only sync through the manual "Retry"
 * action in the connectivity indicator.
 */
export function OfflineSyncManager({ autoSync = true }: { autoSync?: boolean }) {
  useOfflineQueue({ autoSync });
  return null;
}
