import { requirePermission } from "@/lib/auth";
import { ImportView } from "./import-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Data Import" };

// Épica 17 (17.10) — CSV import for clients and projects with a validation
// preview before anything is written.
export default async function ImportPage() {
  await requirePermission("clients.create");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Data Import</h1>
        <p className="mt-1 text-body-sm text-muted">
          Import clients and projects from CSV files. Every row is validated before anything is written.
        </p>
      </div>
      <ImportView />
    </div>
  );
}
