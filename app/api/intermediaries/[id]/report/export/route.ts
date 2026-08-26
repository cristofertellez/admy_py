import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getUser, hasPermission } from "@/lib/auth";
import {
  IntermediaryReportsService,
  type IntermediaryReport,
} from "@/features/intermediaries";

export const dynamic = "force-dynamic";

const EXPORT_FORMATS = ["csv", "xlsx"] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

function sanitizeSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report";
}

function buildWorkbook(report: IntermediaryReport): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const summary = [
    ["Intermediary Report"],
    ["Intermediary", `${report.intermediary.first_name} ${report.intermediary.last_name}`],
    ["Email", report.intermediary.email],
    ["Generated at", new Date().toISOString()],
    [],
    ["Metric", "Value"],
    ["Active projects", report.summary.activeProjects],
    ["Completed projects", report.summary.completedProjects],
    ["Total clients", report.summary.totalClients],
    ["Active clients", report.summary.activeClients],
    ["Total tasks", report.summary.productivity.totalTasks],
    ["Completed tasks", report.summary.productivity.completedTasks],
    ["Task completion rate %", report.summary.productivity.taskCompletionRate],
    ["Estimated hours", report.summary.productivity.estimatedHours],
    ["Worked hours", report.summary.productivity.workedHours],
    ["Hour utilization rate %", report.summary.productivity.hourUtilizationRate],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Summary");

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      report.projects.map((p) => ({
        Project: p.name,
        Client: p.client_name,
        Status: p.status,
        Priority: p.priority,
        "Progress %": p.completion_percentage ?? 0,
        "Estimated start": p.estimated_start_date ?? "",
        "Estimated end": p.estimated_end_date ?? "",
        "Estimated hours": p.estimated_hours ?? 0,
        "Worked hours": p.worked_hours ?? 0,
      })),
    ),
    "Projects",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      report.clients.map((c) => ({
        Client: c.company_name,
        Status: c.is_active === 1 ? "Active" : "Inactive",
        "Active projects": c.active_projects,
        "Completed projects": c.completed_projects,
      })),
    ),
    "Clients",
  );

  const productivity = report.summary.productivity;
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Productivity"],
      ["Metric", "Value"],
      ["Total tasks", productivity.totalTasks],
      ["Pending tasks", productivity.pendingTasks],
      ["In progress tasks", productivity.inProgressTasks],
      ["Blocked tasks", productivity.blockedTasks],
      ["Completed tasks", productivity.completedTasks],
      ["Task completion rate %", productivity.taskCompletionRate],
      ["Estimated hours", productivity.estimatedHours],
      ["Worked hours", productivity.workedHours],
      ["Hour utilization rate %", productivity.hourUtilizationRate],
    ]),
    "Productivity",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      report.upcomingDeliveries.map((d) => ({
        Type: d.type,
        Delivery: d.title,
        Project: d.project_name ?? "",
        "Due date": d.due_date,
      })),
    ),
    "Upcoming deliveries",
  );

  return workbook;
}

function buildFullReportRows(report: IntermediaryReport): (string | number)[][] {
  const p = report.summary.productivity;

  return [
    ["Intermediary Report"],
    ["Intermediary", `${report.intermediary.first_name} ${report.intermediary.last_name}`],
    ["Email", report.intermediary.email],
    ["Generated at", new Date().toISOString()],
    [],
    ["Summary"],
    ["Metric", "Value"],
    ["Active projects", report.summary.activeProjects],
    ["Completed projects", report.summary.completedProjects],
    ["Total clients", report.summary.totalClients],
    ["Active clients", report.summary.activeClients],
    [],
    ["Projects"],
    ["Project", "Client", "Status", "Priority", "Progress %", "Estimated start", "Estimated end", "Estimated hours", "Worked hours"],
    ...report.projects.map((project) => [
      project.name,
      project.client_name,
      project.status,
      project.priority,
      project.completion_percentage ?? 0,
      project.estimated_start_date ?? "",
      project.estimated_end_date ?? "",
      project.estimated_hours ?? 0,
      project.worked_hours ?? 0,
    ]),
    [],
    ["Clients"],
    ["Client", "Status", "Active projects", "Completed projects"],
    ...report.clients.map((client) => [
      client.company_name,
      client.is_active === 1 ? "Active" : "Inactive",
      client.active_projects,
      client.completed_projects,
    ]),
    [],
    ["Productivity"],
    ["Metric", "Value"],
    ["Total tasks", p.totalTasks],
    ["Pending tasks", p.pendingTasks],
    ["In progress tasks", p.inProgressTasks],
    ["Blocked tasks", p.blockedTasks],
    ["Completed tasks", p.completedTasks],
    ["Task completion rate %", p.taskCompletionRate],
    ["Estimated hours", p.estimatedHours],
    ["Worked hours", p.workedHours],
    ["Hour utilization rate %", p.hourUtilizationRate],
    [],
    ["Upcoming deliveries (next 30 days)"],
    ["Type", "Delivery", "Project", "Due date"],
    ...report.upcomingDeliveries.map((delivery) => [
      delivery.type,
      delivery.title,
      delivery.project_name ?? "",
      delivery.due_date,
    ]),
  ];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { id } = await params;

    await IntermediaryReportsService.assertCanAccessReport(id);

    if (!hasPermission(user, "reports.export")) {
      return NextResponse.json({ error: "Missing export permission." }, { status: 403 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "csv";
    if (!EXPORT_FORMATS.includes(format as ExportFormat)) {
      return NextResponse.json({ error: "Unsupported format." }, { status: 400 });
    }
    const exportFormat = format as ExportFormat;

    const report = await IntermediaryReportsService.getReport(id);

    const baseName = `report-${sanitizeSegment(
      `${report.intermediary.first_name}-${report.intermediary.last_name}`,
    )}-${new Date().toISOString().slice(0, 10)}`;

    const workbook = buildWorkbook(report);

    if (exportFormat === "csv") {
      const csvSheet = XLSX.utils.aoa_to_sheet(buildFullReportRows(report));
      const csv = XLSX.utils.sheet_to_csv(csvSheet);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${baseName}.csv"`,
        },
      });
    }

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export report.";
    const status = message.includes("access") || message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
