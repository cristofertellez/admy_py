"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ModuleReport } from "@/features/reports";

// Historia 12.10 — exportación PDF centralizada en el cliente. Recibe el
// ModuleReport ya autorizado por el servidor y compone un documento único
// con KPIs, tabla de detalle y datos del gráfico.
export function exportReportPdf(report: ModuleReport) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(report.title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated at ${new Date(report.generatedAt).toLocaleString()}`, 14, 25);

  autoTable(doc, {
    head: [["KPI", "Value"]],
    body: report.kpis.map((kpi) => [kpi.label, String(kpi.value)]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [24, 24, 24] },
  });

  autoTable(doc, {
    head: [report.table.columns],
    body: report.table.rows.map((row) => row.map((cell) => String(cell))),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [24, 24, 24] },
    margin: { top: 10 },
  });

  if (report.chart) {
    autoTable(doc, {
      head: [[report.chart.title, "Value"]],
      body: report.chart.items.map((item) => [item.label, String(item.value)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [24, 24, 24] },
    });
  }

  const baseName = report.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  doc.save(`${baseName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
