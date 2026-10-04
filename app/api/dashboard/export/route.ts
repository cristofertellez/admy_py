import { getUser } from "@/lib/auth";
import { DashboardService, type DashboardFilters } from "@/features/dashboard";
import { csvResponse, xlsxResponse } from "@/lib/exports";
import { ActivityService } from "@/services/activity.service";
import { NextResponse } from "next/server";

// Historia 11.13 — dashboard data export. The same global filters as the
// page apply; exports are audited (Historia 11.17).
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const filters: DashboardFilters = {
    projectId: url.searchParams.get("project") || undefined,
    clientId: url.searchParams.get("client") || undefined,
    intermediaryId: url.searchParams.get("intermediary") || undefined,
    status: url.searchParams.get("status") || undefined,
    priority: url.searchParams.get("priority") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
  };

  try {
    const report = await DashboardService.getDashboardReport(user, filters);

    await ActivityService.logAccessOnce({
      user_id: user.id,
      action: "exported_dashboard",
      entity: "Dashboard",
      new_value: { format, ...filters },
    });

    return format === "xlsx"
      ? xlsxResponse(report, "dashboard")
      : csvResponse(report, "dashboard");
  } catch (err) {
    console.error("[dashboard-export]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to export dashboard." }, { status: 500 });
  }
}
