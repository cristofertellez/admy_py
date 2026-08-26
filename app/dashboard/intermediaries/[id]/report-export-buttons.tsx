"use client";

import { Button } from "@/components/ui/button";
import type { IntermediaryReport } from "@/features/intermediaries";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";

interface ExportButtonsProps {
  report: IntermediaryReport;
}

export function ReportExportButtons({ report }: ExportButtonsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseName = `report-${report.intermediary.first_name}-${report.intermediary.last_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  function generatePdf() {
    setIsGenerating(true);
    setError(null);

    try {
      const doc = new jsPDF();
      const p = report.summary.productivity;

      doc.setFontSize(16);
      doc.text("Intermediary Report", 14, 18);
      doc.setFontSize(10);
      doc.text(
        `${report.intermediary.first_name} ${report.intermediary.last_name} · ${report.intermediary.email}`,
        14,
        25,
      );
      doc.text(`Generated at ${new Date().toLocaleString()}`, 14, 30);

      autoTable(doc, {
        startY: 36,
        head: [["Summary", "Value"]],
        body: [
          ["Active projects", String(report.summary.activeProjects)],
          ["Completed projects", String(report.summary.completedProjects)],
          ["Total clients", String(report.summary.totalClients)],
          ["Active clients", String(report.summary.activeClients)],
          ["Task completion rate %", String(p.taskCompletionRate)],
          ["Hour utilization rate %", String(p.hourUtilizationRate)],
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [24, 24, 24] },
      });

      autoTable(doc, {
        head: [["Project", "Client", "Status", "Progress %", "Est. hours", "Worked hours"]],
        body: report.projects.map((project) => [
          project.name,
          project.client_name,
          project.status,
          String(project.completion_percentage ?? 0),
          String(project.estimated_hours ?? 0),
          String(project.worked_hours ?? 0),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [24, 24, 24] },
      });

      autoTable(doc, {
        head: [["Client", "Status", "Active projects", "Completed projects"]],
        body: report.clients.map((client) => [
          client.company_name,
          client.is_active === 1 ? "Active" : "Inactive",
          String(client.active_projects),
          String(client.completed_projects),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [24, 24, 24] },
      });

      autoTable(doc, {
        head: [["Productivity", "Value"]],
        body: [
          ["Total tasks", String(p.totalTasks)],
          ["Pending tasks", String(p.pendingTasks)],
          ["In progress tasks", String(p.inProgressTasks)],
          ["Blocked tasks", String(p.blockedTasks)],
          ["Completed tasks", String(p.completedTasks)],
          ["Estimated hours", String(p.estimatedHours)],
          ["Worked hours", String(p.workedHours)],
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [24, 24, 24] },
      });

      if (report.upcomingDeliveries.length > 0) {
        autoTable(doc, {
          head: [["Type", "Delivery", "Project", "Due date"]],
          body: report.upcomingDeliveries.map((delivery) => [
            delivery.type,
            delivery.title,
            delivery.project_name ?? "",
            delivery.due_date,
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [24, 24, 24] },
        });
      }

      doc.save(`${baseName}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={generatePdf} disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Export PDF"}
      </Button>
      <a
        href={`/api/intermediaries/${report.intermediary.id}/report/export?format=xlsx`}
        className="inline-flex h-9 items-center rounded-md border border-hairline bg-surface-card px-4 text-body-sm text-body-strong transition-colors hover:border-hairline-strong"
      >
        Export Excel
      </a>
      <a
        href={`/api/intermediaries/${report.intermediary.id}/report/export?format=csv`}
        className="inline-flex h-9 items-center rounded-md border border-hairline bg-surface-card px-4 text-body-sm text-body-strong transition-colors hover:border-hairline-strong"
      >
        Export CSV
      </a>
      {error && (
        <span role="alert" className="text-caption text-error">
          {error}
        </span>
      )}
    </div>
  );
}
