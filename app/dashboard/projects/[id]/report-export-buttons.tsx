"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getProjectExportData } from "@/actions/reports";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonsProps {
  projectId: string;
  projectName: string;
}

function asText(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function ReportExportButtons({ projectId, projectName }: ExportButtonsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseName = `project-${projectName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  function addSection(doc: jsPDF, head: string[], body: (string | number)[][]) {
    autoTable(doc, {
      head: [head],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [24, 24, 24] },
    });
  }

  async function generatePdf() {
    setIsGenerating(true);
    setError(null);

    try {
      const data = await getProjectExportData(projectId);
      if ("error" in data) {
        setError(data.error);
        return;
      }
      const report = data;
      const { estimates, schedule, indicators } = report.indicators;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Project Report", 14, 18);
      doc.setFontSize(10);
      doc.text(report.projectName, 14, 25);
      doc.text(`Generated at ${new Date().toLocaleString()}`, 14, 30);

      const general = report.general;
      addSection(doc, ["General information", "Value"], [
        ["Code", asText(general.code)],
        ["Client", asText(general.clients?.company_name ?? "")],
        [
          "Intermediary",
          general.users ? `${general.users.first_name} ${general.users.last_name}` : "",
        ],
        ["Status", asText(general.status)],
        ["Priority", asText(general.priority)],
        ["Estimated start", asText(general.estimated_start_date)],
        ["Estimated end", asText(general.estimated_end_date)],
        ["Real start", asText(general.real_start_date)],
        ["Real end", asText(general.real_end_date)],
        ["Estimated hours", asText(general.estimated_hours)],
        ["Worked hours", asText(general.worked_hours)],
        ["Completion %", asText(general.completion_percentage)],
      ]);

      addSection(
        doc,
        ["Milestone", "Status", "Estimated date", "Completed date", "%"],
        report.schedule.map((m) => [
          m.title,
          m.status,
          asText(m.estimated_date),
          asText(m.completed_date),
          String(m.completion_percentage),
        ]),
      );

      addSection(doc, ["Indicator", "Value"], [
        ["Completion %", indicators.completionPercentage],
        ["Expected progress %", asText(indicators.expectedProgressPct)],
        ["Schedule slippage %", asText(indicators.scheduleSlippagePct)],
        ["Used hours", indicators.usedHours],
        ["Remaining hours", indicators.remainingHours],
        ["Effort variation %", asText(estimates.effortVariationPct)],
        ["Deviation (days)", asText(schedule.deviationDays)],
        ["Health", indicators.health],
        ["Risk level", indicators.risk.level],
      ]);

      addSection(doc, ["Progress", "Count"], [
        ...indicators.openTasksByStatus.map((row) => [row.status, row.count] as (string | number)[]),
        ["Delayed tasks", indicators.delayedTaskCount],
        ["Overdue milestones", indicators.overdueMilestoneCount],
        ["Pending dependencies", indicators.pendingDependencyCount],
        ["Task completion rate %", indicators.productivity.taskCompletionRatePct],
      ]);

      addSection(
        doc,
        ["Member", "Total hours", "Entries", "First entry", "Last entry"],
        report.hoursByUser.map((row) => [
          row.user,
          row.total_hours,
          row.entries,
          asText(row.first_date),
          asText(row.last_date),
        ]),
      );

      if (report.activity.length > 0) {
        addSection(doc, ["Date", "Action", "Entity", "User"], 
          report.activity.map((entry) => [
            entry.date,
            entry.action,
            entry.entity,
            entry.user,
          ]),
        );
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
        href={`/api/projects/${projectId}/export?format=xlsx`}
        className="inline-flex h-9 items-center rounded-md border border-hairline bg-surface-card px-4 text-body-sm text-body-strong transition-colors hover:border-hairline-strong"
      >
        Export Excel
      </a>
      <a
        href={`/api/projects/${projectId}/export?format=csv`}
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
