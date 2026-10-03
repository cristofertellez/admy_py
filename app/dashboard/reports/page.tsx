import { requirePermission, hasPermission } from "@/lib/auth";
import { ReportCenterService } from "@/features/reports";
import { ReportsCenter } from "./reports-center";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

// Épica 12 — Centro de Reportes: catálogo único de reportes del sistema con
// filtros avanzados y exportaciones. Las consultas están acotadas a nivel de
// datos por lib/auth-scope, así que Client e Intermediary solo ven lo suyo
// (Historias 12.12 / 12.13 / 12.16).
export default async function ReportsPage() {
  const user = await requirePermission("reports.view");

  const [catalog, filterOptions] = await Promise.all([
    ReportCenterService.getCatalog(),
    ReportCenterService.getFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Reports Center</h1>
        <p className="mt-1 text-body-sm text-muted">
          Generate operational, executive and statistical reports across the platform.
        </p>
      </div>
      <ReportsCenter
        catalog={catalog}
        filterOptions={filterOptions}
        canExport={hasPermission(user, "reports.export")}
      />
    </div>
  );
}
