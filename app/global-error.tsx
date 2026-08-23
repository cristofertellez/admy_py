"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-body antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-surface-card-elevated">
              <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-display-md text-ink">Critical Error</h1>
            <p className="mt-3 max-w-md text-body-sm text-muted">
              A critical system error occurred. Please try again.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-button text-on-primary transition-colors hover:bg-primary-active"
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
