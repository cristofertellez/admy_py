import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { ModuleReport } from "@/features/reports";

// ============================================================
// Épica 12.10 — exportaciones centralizadas. Cualquier reporte (módulo,
// tabla o estadística) se convierte a CSV/XLSX desde un único punto para
// evitar implementaciones paralelas en cada Route Handler.
// ============================================================

export function sanitizeFileSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report";
}

export function reportToRows(report: ModuleReport): (string | number)[][] {
  return [
    [report.title],
    ["Generated at", report.generatedAt],
    [],
    ["KPI", "Value", ...(report.kpis.some((k) => k.hint) ? ["Note"] : [])],
    ...report.kpis.map((kpi) => [kpi.label, kpi.value, ...(kpi.hint ? [kpi.hint] : [])]),
    [],
    report.table.columns,
    ...report.table.rows,
    ...(report.chart ? [[], [report.chart.title], ["Label", "Value"], ...report.chart.items.map((i) => [i.label, i.value])] : []),
  ];
}

export function csvResponse(report: ModuleReport, baseName: string): NextResponse {
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(reportToRows(report)));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
    },
  });
}

export function xlsxResponse(report: ModuleReport, baseName: string): NextResponse {
  const workbook = XLSX.utils.book_new();

  const summary = [["KPI", "Value"], ...report.kpis.map((k) => [k.label, kpiValueToCell(k.value)])];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Summary");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([report.table.columns, ...report.table.rows]),
    "Detail",
  );
  if (report.chart) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["Label", "Value"], ...report.chart.items.map((i) => [i.label, i.value])]),
      "Chart data",
    );
  }

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
    },
  });
}

function kpiValueToCell(value: string | number): string | number {
  return typeof value === "number" ? value : String(value);
}
