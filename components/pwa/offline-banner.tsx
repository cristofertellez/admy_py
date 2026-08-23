"use client";

import { useConnectivity } from "@/hooks/use-connectivity";

// Offline mode is read-only: data comes from the Service Worker pages cache,
// so users must know they are looking at recently viewed information.
export function OfflineBanner() {
  const { isOnline } = useConnectivity();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-16 z-20 border-b border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
    >
      <p className="flex items-center justify-center gap-2 px-6 py-2 text-center text-caption font-medium">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
        You are offline. Showing recently viewed data — changes cannot be saved until you reconnect.
      </p>
    </div>
  );
}
