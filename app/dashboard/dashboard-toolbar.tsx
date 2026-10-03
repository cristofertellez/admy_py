"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateDashboardLayout, getDashboardExportReport } from "@/actions/dashboard";
import { exportReportPdf } from "@/lib/export-pdf";
import { Button } from "@/components/ui/button";
import type {
  DashboardPanelId,
  DashboardWidgetDefinition,
  DashboardWidgetConfig,
} from "@/features/dashboard/dashboard-widgets";

interface DashboardToolbarProps {
  panel: DashboardPanelId;
  widgets: DashboardWidgetDefinition[];
  savedLayout: Record<string, DashboardWidgetConfig> | null;
  filterOptions: {
    projects: { id: string; name: string }[];
    clients: { id: string; name: string }[];
    statuses: { value: string; label: string }[];
    priorities: { value: string; label: string }[];
  };
  initialFilters: {
    project: string;
    client: string;
    status: string;
    priority: string;
    from: string;
    to: string;
  };
  canExport: boolean;
}

/**
 * Historias 11.11/11.12/11.13 — dashboard toolbar: global filters (URL
 * state), widget customization (visibility + order) and data exports
 * (PDF client-side, CSV/XLSX via the export route).
 */
export function DashboardToolbar({
  panel,
  widgets,
  savedLayout,
  filterOptions,
  initialFilters,
  canExport,
}: DashboardToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [showCustomize, setShowCustomize] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [layout, setLayout] = useState<Record<string, DashboardWidgetConfig>>(() => {
    const initial: Record<string, DashboardWidgetConfig> = {};
    widgets.forEach((widget, index) => {
      initial[widget.id] = savedLayout?.[widget.id] ?? { visible: true, order: index };
    });
    return initial;
  });

  function navigate(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function moveWidget(index: number, direction: -1 | 1) {
    const ordered = [...widgets].sort(
      (a, b) => (layout[a.id]?.order ?? 0) - (layout[b.id]?.order ?? 0),
    );
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const current = ordered[index];
    const other = ordered[target];
    setLayout((prev) => ({
      ...prev,
      [current.id]: { ...prev[current.id], order: target },
      [other.id]: { ...prev[other.id], order: index },
    }));
  }

  function handleSaveLayout() {
    startTransition(async () => {
      const result = await updateDashboardLayout(panel, layout);
      setFeedback(result.error ?? result.success ?? null);
      if (!result.error) setShowCustomize(false);
    });
  }

  function handleRestore() {
    const initial: Record<string, DashboardWidgetConfig> = {};
    widgets.forEach((widget, index) => {
      initial[widget.id] = { visible: true, order: index };
    });
    setLayout(initial);
    startTransition(async () => {
      const result = await updateDashboardLayout(panel, initial);
      setFeedback(result.error ?? result.success ?? null);
    });
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const { report, error } = await getDashboardExportReport({
        projectId: initialFilters.project || undefined,
        clientId: initialFilters.client || undefined,
        status: initialFilters.status || undefined,
        priority: initialFilters.priority || undefined,
        from: initialFilters.from || undefined,
        to: initialFilters.to || undefined,
      });
      if (error || !report) {
        setFeedback(error ?? "Failed to export.");
        return;
      }
      exportReportPdf(report);
    } finally {
      setExporting(false);
    }
  }

  const exportQuery = new URLSearchParams();
  if (initialFilters.project) exportQuery.set("project", initialFilters.project);
  if (initialFilters.client) exportQuery.set("client", initialFilters.client);
  if (initialFilters.status) exportQuery.set("status", initialFilters.status);
  if (initialFilters.priority) exportQuery.set("priority", initialFilters.priority);
  if (initialFilters.from) exportQuery.set("from", initialFilters.from);
  if (initialFilters.to) exportQuery.set("to", initialFilters.to);

  const selectClasses =
    "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  const orderedWidgets = [...widgets].sort(
    (a, b) => (layout[a.id]?.order ?? 0) - (layout[b.id]?.order ?? 0),
  );
  const hasActiveFilters = Boolean(
    initialFilters.project ||
      initialFilters.client ||
      initialFilters.status ||
      initialFilters.priority ||
      initialFilters.from ||
      initialFilters.to,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} aria-pressed={showFilters}>
          {hasActiveFilters ? "Filters •" : "Filters"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowCustomize((v) => !v)} aria-pressed={showCustomize}>
          Customize
        </Button>
        {canExport && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exporting}>
              {exporting ? "Exporting…" : "Export PDF"}
            </Button>
            <a
              href={`/api/dashboard/export?format=csv&${exportQuery.toString()}`}
              className="rounded-md border border-hairline bg-surface-card px-3 py-1.5 text-body-sm text-muted hover:text-body-strong"
            >
              CSV
            </a>
            <a
              href={`/api/dashboard/export?format=xlsx&${exportQuery.toString()}`}
              className="rounded-md border border-hairline bg-surface-card px-3 py-1.5 text-body-sm text-muted hover:text-body-strong"
            >
              Excel
            </a>
          </div>
        )}
        {feedback && (
          <p className="text-body-sm text-success" role="status">
            {feedback}
          </p>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-hairline p-3">
          <div className="w-full sm:w-52">
            <label htmlFor="dashboard-project-filter" className="mb-1 block text-caption text-muted">
              Project
            </label>
            <select
              id="dashboard-project-filter"
              value={initialFilters.project}
              onChange={(e) => navigate({ project: e.target.value || undefined })}
              className={selectClasses}
            >
              <option value="">All projects</option>
              {filterOptions.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {filterOptions.clients.length > 0 && (
            <div className="w-full sm:w-48">
              <label htmlFor="dashboard-client-filter" className="mb-1 block text-caption text-muted">
                Client
              </label>
              <select
                id="dashboard-client-filter"
                value={initialFilters.client}
                onChange={(e) => navigate({ client: e.target.value || undefined })}
                className={selectClasses}
              >
                <option value="">All clients</option>
                {filterOptions.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="w-full sm:w-40">
            <label htmlFor="dashboard-status-filter" className="mb-1 block text-caption text-muted">
              Project status
            </label>
            <select
              id="dashboard-status-filter"
              value={initialFilters.status}
              onChange={(e) => navigate({ status: e.target.value || undefined })}
              className={selectClasses}
            >
              <option value="">Any status</option>
              {filterOptions.statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="dashboard-priority-filter" className="mb-1 block text-caption text-muted">
              Task priority
            </label>
            <select
              id="dashboard-priority-filter"
              value={initialFilters.priority}
              onChange={(e) => navigate({ priority: e.target.value || undefined })}
              className={selectClasses}
            >
              <option value="">Any priority</option>
              {filterOptions.priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-36">
            <label htmlFor="dashboard-from-filter" className="mb-1 block text-caption text-muted">
              From
            </label>
            <input
              id="dashboard-from-filter"
              type="date"
              value={initialFilters.from}
              onChange={(e) => navigate({ from: e.target.value || undefined })}
              className={selectClasses}
            />
          </div>
          <div className="w-full sm:w-36">
            <label htmlFor="dashboard-to-filter" className="mb-1 block text-caption text-muted">
              To
            </label>
            <input
              id="dashboard-to-filter"
              type="date"
              value={initialFilters.to}
              onChange={(e) => navigate({ to: e.target.value || undefined })}
              className={selectClasses}
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ project: undefined, client: undefined, status: undefined, priority: undefined, from: undefined, to: undefined })}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {showCustomize && (
        <div className="space-y-3 rounded-lg border border-hairline p-3">
          <p className="text-caption text-muted">
            Show, hide and reorder your widgets. Hidden widgets keep their data history; the KPI row always stays visible.
          </p>
          <ul className="space-y-1">
            {orderedWidgets.map((widget, index) => (
              <li key={widget.id} className="flex items-center gap-2 rounded-md border border-hairline px-3 py-2">
                <label className="flex flex-1 items-center gap-2 text-body-sm text-body-strong">
                  <input
                    type="checkbox"
                    checked={layout[widget.id]?.visible !== false}
                    onChange={(e) =>
                      setLayout((prev) => ({
                        ...prev,
                        [widget.id]: { ...prev[widget.id], visible: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-hairline"
                  />
                  {widget.label}
                </label>
                <button
                  onClick={() => moveWidget(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${widget.label} up`}
                  className="text-caption text-muted hover:text-body-strong disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveWidget(index, 1)}
                  disabled={index === orderedWidgets.length - 1}
                  aria-label={`Move ${widget.label} down`}
                  className="text-caption text-muted hover:text-body-strong disabled:opacity-40"
                >
                  ↓
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveLayout}>
              Save layout
            </Button>
            <Button variant="outline" size="sm" onClick={handleRestore}>
              Restore defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
