"use client";

import { useOfflineQueue } from "@/hooks/use-offline-queue";

/**
 * Mounted once in the dashboard layout. Watches connectivity and replays the
 * pending actions queue whenever the device comes back online.
 */
export function OfflineSyncManager() {
  useOfflineQueue();
  return null;
}
