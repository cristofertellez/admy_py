import { OfflineRecents } from "./offline-recents";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-display-lg text-ink">You are offline</h1>
      <p className="mt-4 max-w-md text-center text-body text-muted">
        Check your internet connection and try again. Previously visited pages
        remain available while offline.
      </p>
      <OfflineRecents />
      <a
        href="/dashboard"
        className="mt-8 rounded-md bg-primary px-5 py-2.5 text-button text-on-primary transition-colors hover:bg-primary-active"
      >
        Retry connection
      </a>
    </div>
  );
}
