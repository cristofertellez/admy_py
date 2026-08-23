"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Safari on iOS never fires beforeinstallprompt, so installation is manual
// through the Share menu and needs its own guidance instead of the native prompt.
type InstallVariant = "prompt" | "ios-manual";

const DISMISS_KEY = "pwa-install-dismissed";

function isStandaloneDisplay(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone)
  );
}

function isIosDevice(): boolean {
  const ua = window.navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  const isIpadOsOnMac =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isAppleMobile || isIpadOsOnMac;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [variant, setVariant] = useState<InstallVariant | null>(null);

  useEffect(() => {
    if (isStandaloneDisplay() || localStorage.getItem(DISMISS_KEY)) {
      return;
    }

    const hide = () => {
      localStorage.setItem(DISMISS_KEY, "1");
      setVariant(null);
      setInstallEvent(null);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVariant("prompt");
    };

    if (isIosDevice()) {
      setVariant("ios-manual");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", hide);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", hide);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVariant(null);
    setInstallEvent(null);
  };

  const handleInstall = async () => {
    if (!installEvent) {
      return;
    }
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setInstallEvent(null);
    setVariant(null);
  };

  if (!variant) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Install AdmiPy"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border border-hairline-strong bg-surface-card p-4 sm:inset-x-auto sm:right-6"
    >
      <div className="min-w-0">
        <p className="text-title-sm text-body-strong">Install AdmiPy</p>
        {variant === "ios-manual" ? (
          <p className="text-caption text-muted">
            Tap the Share icon in Safari and choose &ldquo;Add to Home Screen&rdquo;.
          </p>
        ) : (
          <p className="text-caption text-muted">Add the app to your home screen.</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleDismiss}
          className="rounded-md px-3 py-2 text-button text-muted transition-colors hover:text-body-strong"
          aria-label="Dismiss install prompt"
        >
          Dismiss
        </button>
        {variant === "prompt" && (
          <button
            onClick={handleInstall}
            className="h-10 rounded-md bg-primary px-[18px] text-button text-on-primary transition-colors hover:bg-primary-active"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
