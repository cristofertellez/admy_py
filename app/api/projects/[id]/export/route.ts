import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getUser, hasPermission } from "@/lib/auth";
import { assertProjectVisible } from "@/lib/auth-scope";
import {
  ProjectExportService,
  type ProjectExportData,
  type ProjectExportHoursByUser,
  type ProjectExportMilestone,
} from "@/features/projects";

export const dynamic = "force-dynamic";

const EXPORT_FORMATS = ["csv", "xlsx"] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

function sanitizeSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}

function value(value: unknown): string | number {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return value;
  return String(value);
}

function generalRows(data: ProjectExportData): (string | number)[][] {
  const g = data.general;
  return [
    ["Field", "Value"],
    ["Code", value(g.code)],
    ["Name", value(g.name)],
    ["Description", value(g.description)],
    ["Client", value(g.clients?.company_name)],
    ["Intermediary", g.users ? `${g.users.first_name} ${g.users.last_name}` : ""],
    ["Status", value(g.status)],
    ["Priority", value(g.priority)],
    ["Estimated start", value(g.estimated_start_date)],
    ["Estimated end", value(g.estimated_end_date)],
    ["Real start", value(g.real_start_date)],
    ["Real end", value(g.real_end_date)],
    ["Estimated hours", value(g.estimated_hours)],
    ["Worked hours", value(g.worked_hours)],
    ["Completion %", value(g.completion_percentage)],
    ["Budget", value(g.budget)],
  ];
}

function scheduleRows(schedule: ProjectExportMilestone[]): (string | number)[][] {
  return [
    ["Milestone", "Status", "Estimated date", "Completed date", "Completion %"],
    ...schedule.map((m) => [
      value(m.title),
      value(m.status),
      value(m.estimated_date),
      value(m.completed_date),
      m.completion_percentage,
    ]),
  ];
}

function indicatorRows(data: ProjectExportData): (string | number)[][] {
  const { estimates, schedule, indicators } = data.indicators;
  return [
    ["Indicator", "Value"],
    ["Completion %", indicators.completionPercentage],
    ["Expected progress %", value(indicators.expectedProgressPct)],
    ["Schedule slippage %", value(indicators.scheduleSlippagePct)],
    ["Used hours", indicators.usedHours],
    ["Remaining hours", indicators.remainingHours],
    ["Estimated hours", estimates.estimatedHours],
    ["Consumed hours", estimates.consumedHours],
    ["Effort variation %", value(estimates.effortVariationPct)],
    ["Planned duration (days)", value(schedule.plannedDurationDays)],
    ["Actual duration (days)", value(schedule.actualDurationDays)],
    ["Deviation (days)", value(schedule.deviationDays)],
    ["Health", indicators.health],
    ["Risk level", indicators.risk.level],
    ["Risk score", indicators.risk.score],
    ...indicators.risk.factors.map((f) => [`Risk: ${f.label}`, f.triggered ? "Triggered" : "OK"]),
  ];
}

function progressRows(data: ProjectExportData): (string | number)[][] {
  const p = data.indicators.indicators;
  return [
    ["Task status", "Count"],
    ...p.openTasksByStatus.map((row) => [row.status, row.count]),
    [],
    ["Metric", "Value"],
    ["Delayed tasks", p.delayedTaskCount],
    ["Overdue milestones", p.overdueMilestoneCount],
    ["Pending dependencies", p.pendingDependencyCount],
    ["Completed tasks", p.productivity.completedTasks],
    ["Total tasks", p.productivity.totalTasks],
    ["Task completion rate %", p.productivity.taskCompletionRatePct],
    ["Avg hours per completed task", value(p.productivity.avgHoursPerCompletedTask)],
  ];
}

function hoursRows(hoursByUser: ProjectExportHoursByUser[]): (string | number)[][] {
  return [
    ["Member", "Total hours", "Entries", "First entry", "Last entry"],
    ...hoursByUser.map((row) => [
      row.user,
      row.total_hours,
      row.entries,
      value(row.first_date),
      value(row.last_date),
    ]),
  ];
}

function activityRows(data: ProjectExportData): (string | number)[][] {
  return [
    ["Date", "Action", "Entity", "User"],
    ...data.activity.map((entry) => [
      entry.date,
      entry.action,
      entry.entity,
      entry.user,
    ]),
  ];
}

function buildFullReportRows(data: ProjectExportData): (string | number)[][] {
  return [
    ["Project Report"],
    ["Project", data.projectName],
    ["Generated at", new Date().toISOString()],
    [],
    ["General information"],
    ...generalRows(data),
    [],
    ["Schedule"],
    ...scheduleRows(data.schedule),
    [],
    ["Indicators"],
    ...indicatorRows(data),
    [],
    ["Progress"],
    ...progressRows(data),
    [],
    ["Hours"],
    ...hoursRows(data.hoursByUser),
    [],
    ["Activity"],
    ...activityRows(data),
  ];
}

function buildWorkbook(data: ProjectExportData): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const summary = [["Project Report"], ["Project", data.projectName], ["Generated at", new Date().toISOString()], [], ...generalRows(data)];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "General");

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(scheduleRows(data.schedule)), "Schedule");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(indicatorRows(data)), "Indicators");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(progressRows(data)), "Progress");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(hoursRows(data.hoursByUser)), "Hours");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(activityRows(data)), "Activity");

  return workbook;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { id } = await params;

    // Data-layer authorization: every role only exports visible projects.
    await assertProjectVisible(id);

    if (!hasPermission(user, "reports.export")) {
      return NextResponse.json({ error: "Missing export permission." }, { status: 403 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "csv";
    if (!EXPORT_FORMATS.includes(format as ExportFormat)) {
      return NextResponse.json({ error: "Unsupported format." }, { status: 400 });
    }
    const exportFormat = format as ExportFormat;

    const data = await ProjectExportService.getExportData(id);

    const baseName = `project-${sanitizeSegment(data.projectName)}-${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (exportFormat === "csv") {
      const csvSheet = XLSX.utils.aoa_to_sheet(buildFullReportRows(data));
      const csv = XLSX.utils.sheet_to_csv(csvSheet);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${baseName}.csv"`,
        },
      });
    }

    const buffer = XLSX.write(buildWorkbook(data), { bookType: "xlsx", type: "buffer" }) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export project.";
    const status = message.includes("access") || message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
