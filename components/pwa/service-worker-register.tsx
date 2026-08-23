"use client";

import { useEffect } from "react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function ServiceWorkerRegister() {
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
        window.location.reload();
      }
    };

    const trackUpdate = (worker: ServiceWorker) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage("SKIP_WAITING");
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
  }, []);

  return null;
}
