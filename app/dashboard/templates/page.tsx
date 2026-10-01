import { requirePermission } from "@/lib/auth";
import { TemplatesService } from "@/features/templates";
import { TemplatesPanel } from "./templates-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  await requirePermission("settings.read");

  const templates = await TemplatesService.list();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Templates</h1>
        <p className="mt-1 text-body-sm text-muted">
          Manage reusable templates for projects, tasks, milestones and reports.
        </p>
      </div>

      <TemplatesPanel templates={templates} />
    </div>
  );
}