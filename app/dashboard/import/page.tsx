import { requireAuth } from "@/lib/auth";
import { canAccessRoute } from "@/lib/routes";
import { ImportView } from "./import-view";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Data Import" };

// Épica 17 (17.10) — CSV/Excel import for clients, projects, tasks and
// milestones with a validation preview before anything is written. The
// route is admin-only; each entity additionally revalidates its own
// permission inside the import actions.
export default async function ImportPage() {
  const actor = await requireAuth();
  if (!canAccessRoute("/dashboard/import", actor.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Data Import</h1>
        <p className="mt-1 text-body-sm text-muted">
          Import clients, projects, tasks and milestones from CSV or Excel files. Every row is
          validated before anything is written.
        </p>
      </div>
      <ImportView />
    </div>
  );
}
