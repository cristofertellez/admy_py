import { getUser, hasPermission } from "@/lib/auth";
import { ActivityLogService, type ActivityLogFilters } from "@/features/activity";
import { csvResponse, xlsxResponse } from "@/lib/exports";
import { ActivityService } from "@/services/activity.service";
import { NextResponse } from "next/server";

// Historia 16.11 — audit log export (CSV / XLSX) with the same filters as
// the activity page. Exports are audited (16.13/17.16 pattern).
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }
  if (!hasPermission(user, "users.read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const filters: ActivityLogFilters = {
    search: url.searchParams.get("search") || undefined,
    userId: url.searchParams.get("user") || undefined,
    entity: url.searchParams.get("entity") || undefined,
    projectId: url.searchParams.get("project") || undefined,
    dateFrom: url.searchParams.get("from") || undefined,
    dateTo: url.searchParams.get("to") || undefined,
  };

  try {
    const logs = await ActivityLogService.listForExport(filters);

    await ActivityService.logAccessOnce({
      user_id: user.id,
      action: "exported_activity",
      entity: "ActivityLog",
      new_value: { format, count: logs.length },
    });

    const report = {
      id: "activity",
      title: "Activity Log",
      kpis: [{ label: "Exported records", value: logs.length }],
      table: {
        columns: ["Date", "User", "Action", "Entity", "Entity ID", "Old Value", "New Value", "IP"],
        rows: logs.map((log) => [
          new Date(log.created_at).toISOString(),
          [log.user_first_name, log.user_last_name].filter(Boolean).join(" ") || "System",
          log.action,
          log.entity,
          log.entity_id ?? "—",
          log.old_value ?? "—",
          log.new_value ?? "—",
          log.ip_address ?? "—",
        ]),
      },
      generatedAt: new Date().toISOString(),
    };

    return format === "xlsx"
      ? xlsxResponse(report, "activity-log")
      : csvResponse(report, "activity-log");
  } catch (err) {
    console.error("[activity-export]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to export activity log." }, { status: 500 });
  }
}
