import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-display-lg text-ink">Access Denied</h1>
      <p className="mt-4 text-body text-muted">
        You do not have permission to view this page.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-md bg-primary px-5 py-2.5 text-button text-on-primary hover:bg-primary-active transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
