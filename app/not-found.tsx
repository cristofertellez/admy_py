import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-display-mega font-medium text-muted-soft">404</p>
        <h1 className="mt-4 text-display-md text-ink">Page not found</h1>
        <p className="mt-3 max-w-md text-body-sm text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-button text-on-primary transition-colors hover:bg-primary-active"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
