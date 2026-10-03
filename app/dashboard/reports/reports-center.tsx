"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { getModuleReport, logReportExported } from "@/actions/reports";
import { exportReportPdf } from "@/lib/export-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { DataTable } from "@/components/tables/data-table";
import { BarChart, PieChart, LineChart } from "@/components/charts";
import type {
  ModuleReport,
  ReportDefinition,
  ReportFilterOptions,
} from "@/features/reports";

// Épica 12.1 — Centro de Reportes: catálogo categorizado, buscador, favoritos
// (persistidos localmente), filtros avanzados (12.9), KPIs, gráficos (12.14)
// y exportación PDF/Excel/CSV (12.10).

const FAVORITES_KEY = "reportCenterFavorites";
const EMPTY_FILTERS = {
  dateFrom: "",
  dateTo: "",
  projectId: "",
  clientId: "",
  intermediaryId: "",
  status: "",
  priority: "",
};

const STATUS_OPTIONS = ["Active", "Pending", "In Progress", "Completed", "Cancelled", "Blocked"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

interface ReportsCenterProps {
  catalog: ReportDefinition[];
  filterOptions: ReportFilterOptions;
  canExport: boolean;
}

export function ReportsCenter({ catalog, filterOptions, canExport }: ReportsCenterProps) {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [report, setReport] = useState<ModuleReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored) as string[]);
    } catch {
      // localStorage no disponible: los favoritos simplemente no persisten.
    }
  }, []);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // Ver comentario anterior.
      }
      return next;
    });
  }

  const categories = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = catalog.filter(
      (report) =>
        !term ||
        report.title.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term),
    );
    const grouped = new Map<string, ReportDefinition[]>();
    for (const report of visible) {
      const list = grouped.get(report.category) ?? [];
      list.push(report);
      grouped.set(report.category, list);
    }
    return [...grouped.entries()];
  }, [catalog, search]);

  const favoriteReports = catalog.filter((report) => favorites.includes(report.id));

  function loadReport(id: string) {
    setSelectedId(id);
    setError(null);
    startTransition(async () => {
      const result = await getModuleReport(id, filters);
      if ("error" in result) {
        setError(result.error ?? "Failed to load report.");
        setReport(null);
      } else {
        setReport(result.report);
      }
    });
  }

  function exportHref(format: "csv" | "xlsx") {
    const params = new URLSearchParams({ format });
    if (filters.dateFrom) params.set("from", filters.dateFrom);
    if (filters.dateTo) params.set("to", filters.dateTo);
    if (filters.projectId) params.set("project", filters.projectId);
    if (filters.clientId) params.set("client", filters.clientId);
    if (filters.intermediaryId) params.set("intermediary", filters.intermediaryId);
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    return `/api/reports/${selectedId}/export?${params.toString()}`;
  }

  const tableColumns: ColumnDef<Record<string, string | number>>[] = useMemo(() => {
    if (!report) return [];
    return report.table.columns.map((column) => ({
      id: column,
      accessorFn: (row) => row[column],
      header: column,
    }));
  }, [report]);

  const tableData = useMemo(() => {
    if (!report) return [];
    return report.table.rows.map((row) =>
      Object.fromEntries(report.table.columns.map((column, i) => [column, row[i]])),
    );
  }, [report]);

  const selectClasses =
    "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="report-search" className="mb-1.5 block text-body-sm font-medium text-body-strong">
            Search reports
          </label>
          <input
            id="report-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description..."
            className={selectClasses}
          />
        </div>
      </div>

      {favoriteReports.length > 0 && (
        <div>
          <p className="mb-2 text-caption-uppercase text-muted">Favorites</p>
          <div className="flex flex-wrap gap-2">
            {favoriteReports.map((report) => (
              <Button
                key={report.id}
                variant={selectedId === report.id ? "primary" : "secondary"}
                size="sm"
                onClick={() => loadReport(report.id)}
              >
                {report.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {categories.map(([category, reports]) => (
          <div key={category}>
            <p className="mb-2 text-caption-uppercase text-muted">{category}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((reportDef) => (
                <Card key={reportDef.id} className={selectedId === reportDef.id ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <CardTitle>{reportDef.title}</CardTitle>
                    <button
                      onClick={() => toggleFavorite(reportDef.id)}
                      aria-pressed={favorites.includes(reportDef.id)}
                      aria-label={favorites.includes(reportDef.id) ? "Remove from favorites" : "Add to favorites"}
                      className="text-lg leading-none text-muted hover:text-primary"
                    >
                      {favorites.includes(reportDef.id) ? "★" : "☆"}
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-body-sm text-muted">{reportDef.description}</p>
                    <Button size="sm" className="w-full" onClick={() => loadReport(reportDef.id)}>
                      Generate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="filter-from" className="mb-1.5 block text-body-sm font-medium text-body-strong">From</label>
                <input id="filter-from" type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className={selectClasses} />
              </div>
              <div>
                <label htmlFor="filter-to" className="mb-1.5 block text-body-sm font-medium text-body-strong">To</label>
                <input id="filter-to" type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className={selectClasses} />
              </div>
              <div>
                <label htmlFor="filter-project" className="mb-1.5 block text-body-sm font-medium text-body-strong">Project</label>
                <select id="filter-project" value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))} className={selectClasses}>
                  <option value="">All projects</option>
                  {filterOptions.projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {filterOptions.clients.length > 0 && (
                <div>
                  <label htmlFor="filter-client" className="mb-1.5 block text-body-sm font-medium text-body-strong">Client</label>
                  <select id="filter-client" value={filters.clientId} onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value }))} className={selectClasses}>
                    <option value="">All clients</option>
                    {filterOptions.clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {filterOptions.intermediaries.length > 0 && (
                <div>
                  <label htmlFor="filter-intermediary" className="mb-1.5 block text-body-sm font-medium text-body-strong">Intermediary</label>
                  <select id="filter-intermediary" value={filters.intermediaryId} onChange={(e) => setFilters((f) => ({ ...f, intermediaryId: e.target.value }))} className={selectClasses}>
                    <option value="">All intermediaries</option>
                    {filterOptions.intermediaries.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="filter-status" className="mb-1.5 block text-body-sm font-medium text-body-strong">Status</label>
                <select id="filter-status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className={selectClasses}>
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-priority" className="mb-1.5 block text-body-sm font-medium text-body-strong">Priority</label>
                <select id="filter-priority" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className={selectClasses}>
                  <option value="">All priorities</option>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => loadReport(selectedId)} disabled={isPending}>
                {isPending ? "Generating..." : "Apply filters"}
              </Button>
              <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear
              </Button>
              {canExport && report && (
                <div className="ml-auto flex flex-wrap gap-2" role="group" aria-label="Export report">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      exportReportPdf(report);
                      void logReportExported(report.id, "pdf");
                    }}
                  >
                    Export PDF
                  </Button>
                  <a href={exportHref("xlsx")} className="inline-flex h-9 items-center rounded-md border border-hairline bg-surface-card px-4 text-body-sm text-body-strong transition-colors hover:border-hairline-strong">
                    Export Excel
                  </a>
                  <a href={exportHref("csv")} className="inline-flex h-9 items-center rounded-md border border-hairline bg-surface-card px-4 text-body-sm text-body-strong transition-colors hover:border-hairline-strong">
                    Export CSV
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report.kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-6 text-center">
                  <p className="text-display-md text-ink">{kpi.value}</p>
                  <p className="text-caption text-muted">{kpi.label}</p>
                  {kpi.hint && <p className="mt-1 text-caption text-muted-soft">{kpi.hint}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {report.chart && (
            <Card>
              <CardHeader><CardTitle>{report.chart.title}</CardTitle></CardHeader>
              <CardContent>
                {report.chart.type === "pie" && <PieChart data={report.chart.items} />}
                {report.chart.type === "bar" && (
                  <BarChart
                    data={report.chart.items.slice(0, 10)}
                  />
                )}
                {report.chart.type === "line" && <LineChart data={report.chart.items} area />}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Detail</CardTitle>
              <Badge>{String(report.table.rows.length)} rows</Badge>
            </CardHeader>
            <CardContent>
              {report.table.rows.length === 0 ? (
                <p className="text-body-sm text-muted-soft py-8 text-center">No data for the selected filters.</p>
              ) : (
                <DataTable columns={tableColumns} data={tableData} pageSize={20} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
