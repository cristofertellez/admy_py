"use client";

import { useEffect, useRef, useState } from "react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

interface ServiceWorkerRegisterProps {
  /**
   * Historia 14.9/14.13 — when automatic updates are enabled the new
   * Service Worker activates silently (current behavior). Otherwise the
   * user is prompted with "Update now" / "Remind later".
   */
  autoUpdate?: boolean;
}

async function reportPwaEvent(type: string, detail?: Record<string, unknown>): Promise<void> {
  try {
    await fetch("/api/pwa/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, detail }),
    });
  } catch {
    // Audit events must never break the app lifecycle.
  }
}

export function ServiceWorkerRegister({ autoUpdate = true }: ServiceWorkerRegisterProps) {
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pendingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    let isReloading = false;
    let updateInterval: ReturnType<typeof setInterval> | undefined;
    let registration: ServiceWorkerRegistration | undefined;

    const onControllerChange = () => {
      if (!isReloading) {
        isReloading = true;
        void reportPwaEvent("updated");
        window.location.reload();
      }
    };

    const trackUpdate = (worker: ServiceWorker) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          if (autoUpdate) {
            worker.postMessage("SKIP_WAITING");
          } else {
            pendingWorkerRef.current = worker;
            setUpdateReady(true);
          }
        }
      });
    };

    const checkForUpdate = () => {
      registration?.update().catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    };

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      registration = reg;

      if (reg.waiting) {
        trackUpdate(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        if (reg.installing) {
          trackUpdate(reg.installing);
        }
      });

      updateInterval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener("visibilitychange", onVisibilityChange);
    }).catch(() => {});

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [autoUpdate]);

  if (!updateReady || dismissed) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Application update"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border border-hairline bg-surface-card p-4 shadow-lg sm:left-auto sm:right-4"
    >
      <p className="text-body-sm font-medium text-body-strong">A new version is available</p>
      <p className="mt-1 text-caption text-muted">
        Update now to get the latest features and fixes. Your offline data stays intact.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setUpdateReady(false);
            pendingWorkerRef.current?.postMessage("SKIP_WAITING");
          }}
          className="rounded-md bg-primary px-3 py-1.5 text-body-sm font-medium text-white"
        >
          Update now
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-md border border-hairline px-3 py-1.5 text-body-sm text-muted hover:text-body-strong"
        >
          Remind later
        </button>
      </div>
    </div>
  );
}
