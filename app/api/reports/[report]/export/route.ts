import { NextResponse } from "next/server";
import { getUser, hasPermission } from "@/lib/auth";
import { ReportCenterService, isReportId, type ReportFilters } from "@/features/reports";
import { csvResponse, sanitizeFileSegment, xlsxResponse } from "@/lib/exports";
import { ActivityService } from "@/services/activity.service";

export const dynamic = "force-dynamic";

// Historia 12.10 — exportación centralizada de cualquier reporte del centro
// en CSV/XLSX. El PDF se genera en el cliente (jspdf) con lib/export-pdf.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!hasPermission(user, "reports.export")) {
      return NextResponse.json({ error: "Missing export permission." }, { status: 403 });
    }

    const { report } = await params;
    if (!isReportId(report)) {
      return NextResponse.json({ error: "Unknown report." }, { status: 400 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "csv";
    if (format !== "csv" && format !== "xlsx") {
      return NextResponse.json({ error: "Unsupported format." }, { status: 400 });
    }

    const filters: ReportFilters = {
      dateFrom: url.searchParams.get("from") || undefined,
      dateTo: url.searchParams.get("to") || undefined,
      projectId: url.searchParams.get("project") || undefined,
      clientId: url.searchParams.get("client") || undefined,
      intermediaryId: url.searchParams.get("intermediary") || undefined,
      status: url.searchParams.get("status") || undefined,
      priority: url.searchParams.get("priority") || undefined,
      userId: url.searchParams.get("user") || undefined,
    };

    const data = await ReportCenterService.getModuleReport(report, filters);

    // Auditoría (Historia 12.15): reporte exportado.
    await ActivityService.log({
      user_id: user.id,
      action: "exported_report",
      entity: "Report",
      entity_id: report,
      new_value: { format, filters },
    });

    const baseName = `${sanitizeFileSegment(report)}-report-${new Date().toISOString().slice(0, 10)}`;
    return format === "csv" ? csvResponse(data, baseName) : xlsxResponse(data, baseName);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export report.";
    const status = message.includes("access") || message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
