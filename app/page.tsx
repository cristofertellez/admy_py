import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-display-mega text-ink tracking-tight">
          AdmiPy
        </h1>
        <p className="mt-6 max-w-md text-body-sm text-muted">
          Professional Project Management Platform — planning, tracking,
          collaboration and visualization.
        </p>
        <div className="mt-12 flex items-center justify-center gap-4">
          <span className="rounded-pill bg-surface-card-elevated px-3 py-1 text-caption-uppercase text-body-strong">
            P0 — Infrastructure
          </span>
          <span className="h-4 w-px bg-hairline" />
          <span className="text-caption text-muted-soft">v0.1.0</span>
        </div>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-button text-on-primary transition-colors hover:bg-primary-active"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
