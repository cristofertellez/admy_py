"use client";

import { useMemo, useState, useRef, useEffect, useId } from "react";
import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GanttTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimated_start: string | null;
  estimated_end: string | null;
  completion_percentage: number;
  project_id?: string | null;
  project_name?: string | null;
  assignee_name?: string | null;
}

export interface GanttDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
}

export interface GanttMilestone {
  id: string;
  title: string;
  status: string;
  estimated_date: string | null;
  project_name?: string | null;
}

interface TasksGanttProps {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  milestones?: GanttMilestone[];
}

type ZoomLevel = "days" | "weeks" | "months";
type GroupBy = "none" | "project" | "status";

const DAY_MS = 24 * 60 * 60 * 1000;
const ROW_HEIGHT = 46;
const HEADER_HEIGHT = 56;

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Pending: { bg: "bg-surface-card-elevated", border: "border-hairline", text: "text-muted" },
  Planned: { bg: "bg-surface-card-elevated", border: "border-hairline", text: "text-muted" },
  "In Progress": { bg: "bg-primary", border: "border-primary-active", text: "text-white" },
  "In Review": { bg: "bg-accent-violet", border: "border-purple-600", text: "text-white" },
  QA: { bg: "bg-accent-cyan", border: "border-cyan-600", text: "text-white" },
  Blocked: { bg: "bg-error", border: "border-red-600", text: "text-white" },
  Completed: { bg: "bg-success", border: "border-emerald-600", text: "text-white" },
  Cancelled: { bg: "bg-muted-soft", border: "border-hairline", text: "text-muted" },
};

function toUtcMs(dateStr: string): number {
  return Date.parse(`${dateStr}T00:00:00Z`);
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function formatDayLabel(dateStr: string): { dayNum: string; dayName: string; isWeekend: boolean } {
  const d = new Date(toUtcMs(dateStr));
  const dayNum = d.getUTCDate().toString().padStart(2, "0");
  const dayName = d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
  const dayOfWeek = d.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return { dayNum, dayName, isWeekend };
}

/**
 * Roadmap v2 — Diagrama de Gantt Interactivo.
 * Renderiza tareas programadas con barras proporcionales a sus fechas,
 * dependencias visuales mediante SVG (líneas curvas con marcadores de flecha),
 * detección de conflictos de calendario, zoom temporal (días/semanas/meses),
 * agrupamiento por proyecto/estado, marcador del día de hoy y panel de tareas
 * sin fecha.
 */
export function TasksGantt({ tasks, dependencies, milestones = [] }: TasksGanttProps) {
  const uniqueId = useId().replace(/:/g, "");
  const [zoom, setZoom] = useState<ZoomLevel>("days");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [showDependencies, setShowDependencies] = useState(true);
  const [onlyConflicts, setOnlyConflicts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter tasks by client search query
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        (t.project_name && t.project_name.toLowerCase().includes(term)) ||
        (t.assignee_name && t.assignee_name.toLowerCase().includes(term)) ||
        t.status.toLowerCase().includes(term),
    );
  }, [tasks, searchTerm]);

  // Separate scheduled vs unscheduled
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: GanttTask[] = [];
    const unscheduled: GanttTask[] = [];
    for (const task of filteredTasks) {
      if (task.estimated_start && task.estimated_end) {
        scheduled.push(task);
      } else {
        unscheduled.push(task);
      }
    }
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [filteredTasks]);

  // Grouping logic
  const groupedRows = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", title: "All Tasks", tasks: scheduledTasks }];
    }
    const map = new Map<string, GanttTask[]>();
    for (const task of scheduledTasks) {
      const key =
        groupBy === "project"
          ? task.project_name || "Unassigned Project"
          : task.status || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return Array.from(map.entries()).map(([key, groupTasks]) => ({
      key,
      title: key,
      tasks: groupTasks,
    }));
  }, [groupBy, scheduledTasks]);

  // Flatten rows to determine exact Y coordinates for bars and SVG connectors
  const visibleTaskRows = useMemo(() => {
    const list: Array<{ task: GanttTask; groupKey: string; rowIndex: number }> = [];
    let currentIndex = 0;
    for (const group of groupedRows) {
      const isCollapsed = collapsedGroups.has(group.key);
      if (isCollapsed) continue;
      for (const task of group.tasks) {
        list.push({ task, groupKey: group.key, rowIndex: currentIndex });
        currentIndex++;
      }
    }
    return list;
  }, [groupedRows, collapsedGroups]);

  // Date range and column generation
  const { minDateMs, columns, columnWidth } = useMemo(() => {
    const datesMs: number[] = [toUtcMs(todayKey)];
    for (const t of scheduledTasks) {
      datesMs.push(toUtcMs(t.estimated_start!), toUtcMs(t.estimated_end!));
    }
    for (const m of milestones) {
      if (m.estimated_date) datesMs.push(toUtcMs(m.estimated_date));
    }

    const minMs = Math.min(...datesMs);
    const maxMs = Math.max(...datesMs);

    // Padding in days based on zoom
    const padBefore = zoom === "days" ? 4 : zoom === "weeks" ? 14 : 30;
    const padAfter = zoom === "days" ? 12 : zoom === "weeks" ? 28 : 60;

    const startMs = minMs - padBefore * DAY_MS;
    const endMs = maxMs + padAfter * DAY_MS;

    const cols: Array<{ key: string; label: string; subLabel: string; isWeekend?: boolean; dateMs: number }> = [];
    let colW = 42;

    if (zoom === "days") {
      colW = 44;
      let curr = startMs;
      while (curr <= endMs) {
        const iso = toIsoDate(curr);
        const { dayNum, dayName, isWeekend } = formatDayLabel(iso);
        cols.push({
          key: iso,
          label: dayNum,
          subLabel: dayName,
          isWeekend,
          dateMs: curr,
        });
        curr += DAY_MS;
      }
    } else if (zoom === "weeks") {
      colW = 76;
      let curr = startMs;
      while (curr <= endMs) {
        const d = new Date(curr);
        const dayOfWeek = d.getUTCDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        const mondayMs = curr - diffToMonday * DAY_MS;
        const mondayIso = toIsoDate(mondayMs);
        const mondayDate = new Date(mondayMs);
        cols.push({
          key: mondayIso,
          label: `${mondayDate.getUTCDate()} ${mondayDate.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })}`,
          subLabel: `W${Math.ceil(mondayDate.getUTCDate() / 7)}`,
          dateMs: mondayMs,
        });
        curr += 7 * DAY_MS;
      }
    } else {
      // months
      colW = 120;
      const curr = new Date(startMs);
      curr.setUTCDate(1);
      const endLimit = new Date(endMs);
      while (curr <= endLimit) {
        const iso = curr.toISOString().slice(0, 10);
        cols.push({
          key: iso,
          label: curr.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }),
          subLabel: curr.getUTCFullYear().toString(),
          dateMs: curr.getTime(),
        });
        curr.setUTCMonth(curr.getUTCMonth() + 1);
      }
    }

    return { minDateMs: startMs, maxDateMs: endMs, columns: cols, columnWidth: colW };
  }, [scheduledTasks, milestones, todayKey, zoom]);

  const totalGridWidth = columns.length * columnWidth;

  // Convert date to X pixel
  function dateToPixel(dateStr: string): number {
    const ms = toUtcMs(dateStr);
    if (zoom === "days") {
      const days = (ms - minDateMs) / DAY_MS;
      return days * columnWidth;
    }
    if (zoom === "weeks") {
      const weeks = (ms - minDateMs) / (7 * DAY_MS);
      return weeks * columnWidth;
    }
    // months
    const d = new Date(ms);
    const startD = new Date(minDateMs);
    const months = (d.getUTCFullYear() - startD.getUTCFullYear()) * 12 + (d.getUTCMonth() - startD.getUTCMonth()) + (d.getUTCDate() - 1) / 30;
    return months * columnWidth;
  }

  // Today pixel position
  const todayPixel = useMemo(() => dateToPixel(todayKey), [todayKey, minDateMs, zoom, columnWidth]);

  // Fast task lookup map
  const taskRowMap = useMemo(() => {
    const map = new Map<
      string,
      {
        task: GanttTask;
        rowIndex: number;
        startX: number;
        endX: number;
        width: number;
        centerY: number;
      }
    >();

    for (const item of visibleTaskRows) {
      const startX = dateToPixel(item.task.estimated_start!);
      const rawEndX = dateToPixel(item.task.estimated_end!) + columnWidth;
      const width = Math.max(columnWidth * 0.9, rawEndX - startX);
      const endX = startX + width;
      const centerY = item.rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

      map.set(item.task.id, {
        task: item.task,
        rowIndex: item.rowIndex,
        startX,
        endX,
        width,
        centerY,
      });
    }

    return map;
  }, [visibleTaskRows, columnWidth, minDateMs, zoom]);

  // Compute dependency lines with conflict detection
  const dependencyLines = useMemo(() => {
    const lines: Array<{
      id: string;
      fromId: string;
      toId: string;
      fromTitle: string;
      toTitle: string;
      type: string;
      d: string;
      isConflict: boolean;
      arrowMarkerId: string;
      strokeColor: string;
    }> = [];

    for (const dep of dependencies) {
      const from = taskRowMap.get(dep.depends_on_task_id);
      const to = taskRowMap.get(dep.task_id);
      if (!from || !to) continue;

      // Finish to Start: predecessor end -> successor start
      const x1 = from.endX;
      const y1 = from.centerY;
      const x2 = to.startX;
      const y2 = to.centerY;

      // Conflict: predecessor finishes AFTER successor starts
      const isConflict = from.task.estimated_end! > to.task.estimated_start!;

      if (onlyConflicts && !isConflict) continue;

      let d = "";
      if (x2 >= x1 + 14) {
        // Smooth S-curve
        const dx = Math.max(16, (x2 - x1) / 2);
        d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      } else {
        // Looped step curve around the overlapping task bars
        const loopX = x1 + 12;
        const returnY = y2 < y1 ? y2 + 16 : y2 - 16;
        d = `M ${x1} ${y1} H ${loopX} V ${returnY} H ${x2 - 12} V ${y2} H ${x2}`;
      }

      const isConnectedToHovered =
        hoveredTaskId && (dep.task_id === hoveredTaskId || dep.depends_on_task_id === hoveredTaskId);

      const strokeColor = isConflict
        ? "#ef4444" // red
        : isConnectedToHovered
          ? "#3b82f6" // blue
          : "#64748b"; // slate-500

      const marker = isConflict
        ? `url(#${uniqueId}-arrow-conflict)`
        : isConnectedToHovered
          ? `url(#${uniqueId}-arrow-active)`
          : `url(#${uniqueId}-arrow-normal)`;

      lines.push({
        id: dep.id,
        fromId: dep.depends_on_task_id,
        toId: dep.task_id,
        fromTitle: from.task.title,
        toTitle: to.task.title,
        type: dep.dependency_type || "Finish to Start",
        d,
        isConflict,
        arrowMarkerId: marker,
        strokeColor,
      });
    }

    return lines;
  }, [dependencies, taskRowMap, onlyConflicts, hoveredTaskId, uniqueId]);

  // Conflict count
  const conflictCount = useMemo(() => {
    return dependencies.filter((dep) => {
      const from = scheduledTasks.find((t) => t.id === dep.depends_on_task_id);
      const to = scheduledTasks.find((t) => t.id === dep.task_id);
      return from && to && from.estimated_end && to.estimated_start && from.estimated_end > to.estimated_start;
    }).length;
  }, [dependencies, scheduledTasks]);

  // Center on today
  const scrollToToday = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const targetScroll = Math.max(0, todayPixel - container.clientWidth / 2 + columnWidth);
    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  };

  // Auto center on mount
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const targetScroll = Math.max(0, todayPixel - container.clientWidth / 3);
    container.scrollTo({ left: targetScroll });
  }, [todayPixel]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* KPI & Summary Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-hairline bg-surface-card p-3">
          <p className="text-caption text-muted">Total Tasks</p>
          <p className="mt-1 text-display-xs font-semibold text-ink">{tasks.length}</p>
          <p className="text-[11px] text-muted-soft">
            {scheduledTasks.length} scheduled · {unscheduledTasks.length} unscheduled
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-3">
          <p className="text-caption text-muted">Dependencies</p>
          <p className="mt-1 text-display-xs font-semibold text-primary">{dependencies.length}</p>
          <p className="text-[11px] text-muted-soft">Active constraint links</p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-3">
          <p className="text-caption text-muted">Schedule Conflicts</p>
          <p
            className={cn(
              "mt-1 text-display-xs font-semibold",
              conflictCount > 0 ? "text-error" : "text-success",
            )}
          >
            {conflictCount}
          </p>
          <p className="text-[11px] text-muted-soft">
            {conflictCount > 0 ? "Predecessors finish after start" : "Timeline synchronized"}
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-card p-3">
          <p className="text-caption text-muted">Overall Progress</p>
          <p className="mt-1 text-display-xs font-semibold text-ink">
            {scheduledTasks.length > 0
              ? Math.round(
                  scheduledTasks.reduce((sum, t) => sum + (t.completion_percentage || 0), 0) /
                    scheduledTasks.length,
                )
              : 0}
            %
          </p>
          <p className="text-[11px] text-muted-soft">Average completion rate</p>
        </div>
      </div>

      {/* Control Bar: Zoom, Grouping, Filter, Today */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-md border border-hairline bg-surface-card-elevated p-0.5">
            <button
              onClick={() => setZoom("days")}
              className={cn(
                "rounded px-2.5 py-1 text-caption font-medium transition-colors",
                zoom === "days" ? "bg-primary text-white" : "text-muted hover:text-ink",
              )}
            >
              Days
            </button>
            <button
              onClick={() => setZoom("weeks")}
              className={cn(
                "rounded px-2.5 py-1 text-caption font-medium transition-colors",
                zoom === "weeks" ? "bg-primary text-white" : "text-muted hover:text-ink",
              )}
            >
              Weeks
            </button>
            <button
              onClick={() => setZoom("months")}
              className={cn(
                "rounded px-2.5 py-1 text-caption font-medium transition-colors",
                zoom === "months" ? "bg-primary text-white" : "text-muted hover:text-ink",
              )}
            >
              Months
            </button>
          </div>

          {/* Grouping */}
          <div className="flex items-center gap-1.5 text-caption text-muted">
            <span>Group:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="rounded border border-hairline bg-surface-card-elevated px-2 py-1 text-caption text-body-strong focus:outline-none"
            >
              <option value="none">Flat (None)</option>
              <option value="project">By Project</option>
              <option value="status">By Status</option>
            </select>
          </div>

          {/* Dependency line toggle */}
          <button
            onClick={() => setShowDependencies((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-caption font-medium transition-colors",
              showDependencies
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-hairline text-muted hover:text-ink",
            )}
            title="Toggle visual dependency arrows"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Dependencies ({dependencies.length})
          </button>

          {/* Conflicts toggle */}
          {conflictCount > 0 && (
            <button
              onClick={() => setOnlyConflicts((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-caption font-medium transition-colors",
                onlyConflicts
                  ? "border-error bg-error/15 text-error"
                  : "border-hairline text-error hover:bg-error/10",
              )}
            >
              <span className="h-2 w-2 rounded-full bg-error animate-pulse" />
              Conflicts ({conflictCount})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick search */}
          <input
            type="text"
            placeholder="Filter tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-40 rounded-md border border-hairline bg-surface-card-elevated px-2.5 text-caption text-ink placeholder:text-muted focus:outline-none sm:w-56"
          />

          {/* Today button */}
          <Button variant="outline" size="sm" onClick={scrollToToday} className="h-8 gap-1 text-caption">
            <span className="h-2 w-2 rounded-full bg-error" />
            Today
          </Button>
        </div>

        {/* Group chips */}
        {groupBy !== "none" && groupedRows.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-1.5 pt-2 border-t border-hairline/60">
            <span className="text-[11px] text-muted">Toggle groups:</span>
            {groupedRows.map((group) => {
              const isCollapsed = collapsedGroups.has(group.key);
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-colors border",
                    isCollapsed
                      ? "border-hairline bg-surface-card-elevated text-muted line-through opacity-70"
                      : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                >
                  {group.title} ({group.tasks.length})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Gantt Container */}
      <div className="relative flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface-card shadow-sm">
        <div className="grid grid-cols-[280px_1fr] sm:grid-cols-[320px_1fr]">
          {/* Left Panel: Task Hierarchy Table */}
          <div className="z-10 border-r border-hairline bg-surface-card">
            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-hairline px-4 text-caption font-semibold text-muted"
              style={{ height: HEADER_HEIGHT }}
            >
              <span>Task Name</span>
              <span className="text-[11px] font-normal text-muted-soft">Assignee / %</span>
            </div>

            {/* Task Rows List */}
            <div className="divide-y divide-hairline/60">
              {visibleTaskRows.length === 0 ? (
                <div className="p-8 text-center text-body-sm text-muted">
                  No scheduled tasks match the filter.
                </div>
              ) : (
                visibleTaskRows.map(({ task, rowIndex }) => {
                  const isHovered = hoveredTaskId === task.id;
                  const isSelected = selectedTask?.id === task.id;
                  const isOverdue =
                    task.estimated_end! < todayKey && task.status !== "Completed";
                  const taskDeps = dependencies.filter((d) => d.task_id === task.id);
                  const blocksDeps = dependencies.filter((d) => d.depends_on_task_id === task.id);

                  return (
                    <div
                      key={task.id}
                      style={{ height: ROW_HEIGHT }}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between px-3 text-caption transition-colors",
                        isHovered && "bg-surface-card-elevated",
                        isSelected && "bg-primary/10 border-l-2 border-l-primary",
                        rowIndex % 2 === 1 && !isHovered && "bg-white/[0.01]",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            STATUS_COLORS[task.status]?.bg || "bg-primary",
                            isOverdue && "ring-2 ring-error",
                          )}
                          title={`Status: ${task.status}`}
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="block truncate font-medium text-ink hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                            title={task.title}
                          >
                            {task.title}
                          </Link>
                          {task.project_name && groupBy !== "project" && (
                            <span className="block truncate text-[10px] text-muted-soft">
                              {task.project_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 pl-2">
                        {(taskDeps.length > 0 || blocksDeps.length > 0) && (
                          <span
                            className="rounded bg-surface-card-elevated px-1 py-0.5 text-[10px] text-muted font-mono"
                            title={`Depends on: ${taskDeps.length}, Blocks: ${blocksDeps.length}`}
                          >
                            {taskDeps.length > 0 ? `←${taskDeps.length}` : ""}
                            {blocksDeps.length > 0 ? `→${blocksDeps.length}` : ""}
                          </span>
                        )}
                        <span className="w-8 text-right font-mono text-[11px] text-muted">
                          {task.completion_percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Interactive Gantt Grid & SVG dependency canvas */}
          <div
            ref={scrollContainerRef}
            className="relative overflow-x-auto overflow-y-hidden select-none"
            style={{ minHeight: Math.max(300, visibleTaskRows.length * ROW_HEIGHT + HEADER_HEIGHT + 20) }}
          >
            <div style={{ width: totalGridWidth }} className="relative">
              {/* Timeline Header */}
              <div
                className="sticky top-0 z-20 flex border-b border-hairline bg-surface-card"
                style={{ height: HEADER_HEIGHT }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{ width: columnWidth }}
                    className={cn(
                      "flex flex-col items-center justify-center border-r border-hairline/60 px-0.5 text-center text-caption",
                      col.isWeekend && "bg-white/[0.015]",
                      col.key === todayKey && "bg-error/10 font-bold text-error",
                    )}
                  >
                    <span className="font-semibold text-ink leading-tight">{col.label}</span>
                    <span className="text-[10px] text-muted-soft">{col.subLabel}</span>
                  </div>
                ))}
              </div>

              {/* Background Grid Columns */}
              <div
                className="absolute left-0 top-[56px] bottom-0 flex pointer-events-none"
                style={{ width: totalGridWidth, height: visibleTaskRows.length * ROW_HEIGHT }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{ width: columnWidth }}
                    className={cn(
                      "h-full border-r border-hairline/40",
                      col.isWeekend && "bg-white/[0.015]",
                    )}
                  />
                ))}
              </div>

              {/* Background Horizontal Row Lines */}
              <div
                className="absolute left-0 top-[56px] bottom-0 pointer-events-none w-full"
                style={{ height: visibleTaskRows.length * ROW_HEIGHT }}
              >
                {visibleTaskRows.map((_, i) => (
                  <div
                    key={i}
                    style={{ height: ROW_HEIGHT, top: i * ROW_HEIGHT }}
                    className="absolute left-0 right-0 border-b border-hairline/30"
                  />
                ))}
              </div>

              {/* Today Vertical Marker */}
              {todayPixel >= 0 && todayPixel <= totalGridWidth && (
                <div
                  className="absolute top-0 bottom-0 z-10 w-px bg-error pointer-events-none shadow-sm"
                  style={{
                    left: todayPixel,
                    height: visibleTaskRows.length * ROW_HEIGHT + HEADER_HEIGHT,
                  }}
                >
                  <span className="absolute -top-1 -translate-x-1/2 rounded bg-error px-1 text-[9px] font-bold uppercase text-white shadow">
                    Today
                  </span>
                </div>
              )}

              {/* SVG Dependency Lines Layer */}
              {showDependencies && visibleTaskRows.length > 0 && (
                <svg
                  className="absolute left-0 top-[56px] z-10 pointer-events-none"
                  style={{
                    width: totalGridWidth,
                    height: visibleTaskRows.length * ROW_HEIGHT,
                  }}
                >
                  <defs>
                    <marker
                      id={`${uniqueId}-arrow-normal`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
                    </marker>
                    <marker
                      id={`${uniqueId}-arrow-active`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#3b82f6" />
                    </marker>
                    <marker
                      id={`${uniqueId}-arrow-conflict`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
                    </marker>
                  </defs>

                  {dependencyLines.map((line) => {
                    const isRelated =
                      hoveredTaskId && (line.fromId === hoveredTaskId || line.toId === hoveredTaskId);
                    const isDimmed = hoveredTaskId && !isRelated;

                    return (
                      <g key={line.id} className="transition-opacity duration-150">
                        <path
                          d={line.d}
                          fill="none"
                          stroke={line.strokeColor}
                          strokeWidth={isRelated ? 2.5 : 1.5}
                          strokeDasharray={line.isConflict ? "5 3" : undefined}
                          markerEnd={line.arrowMarkerId}
                          opacity={isDimmed ? 0.15 : isRelated ? 1 : 0.75}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Task Bars Layer */}
              <div
                className="relative top-[56px]"
                style={{ height: visibleTaskRows.length * ROW_HEIGHT }}
              >
                {visibleTaskRows.map(({ task, rowIndex }) => {
                  const geom = taskRowMap.get(task.id);
                  if (!geom) return null;

                  const isHovered = hoveredTaskId === task.id;
                  const isSelected = selectedTask?.id === task.id;
                  const isOverdue =
                    task.estimated_end! < todayKey && task.status !== "Completed";
                  const styleCfg = STATUS_COLORS[task.status] || STATUS_COLORS["In Progress"];

                  return (
                    <div
                      key={task.id}
                      style={{
                        top: rowIndex * ROW_HEIGHT + (ROW_HEIGHT - 28) / 2,
                        left: geom.startX,
                        width: geom.width,
                        height: 28,
                      }}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "group absolute z-10 flex cursor-pointer items-center rounded-md border text-caption shadow-sm transition-all duration-150",
                        styleCfg.bg,
                        styleCfg.border,
                        styleCfg.text,
                        isOverdue && "ring-2 ring-error",
                        isHovered && "ring-2 ring-primary scale-[1.01] z-20 shadow-md",
                        isSelected && "ring-2 ring-white z-20",
                      )}
                    >
                      {/* Completion Progress Overlay */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-l-md bg-white/20 transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, task.completion_percentage))}%`,
                        }}
                      />

                      {/* Bar Content */}
                      <div className="relative flex w-full items-center justify-between px-2 text-[11px] font-medium leading-none truncate">
                        <span className="truncate">{task.title}</span>
                        {geom.width > 90 && (
                          <span className="shrink-0 pl-1 text-[10px] opacity-90 font-mono">
                            {task.completion_percentage}%
                          </span>
                        )}
                      </div>

                      {/* Anchor points (visual cues for Finish-to-Start) */}
                      <span
                        className="absolute -left-1.5 h-3 w-3 rounded-full border-2 border-surface-card bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Start anchor"
                      />
                      <span
                        className="absolute -right-1.5 h-3 w-3 rounded-full border-2 border-surface-card bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Finish anchor"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Task Inspection Drawer / Modal Card */}
      {selectedTask && (
        <div className="rounded-lg border border-hairline bg-surface-card p-4 shadow-md transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-3 w-3 rounded-full",
                  STATUS_COLORS[selectedTask.status]?.bg || "bg-primary",
                )}
              />
              <h3 className="text-body-md font-semibold text-ink">{selectedTask.title}</h3>
              <Badge variant={selectedTask.status === "Completed" ? "success" : "default"}>
                {selectedTask.status}
              </Badge>
              <Badge variant="warning">{selectedTask.priority}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/tasks/${selectedTask.id}`}>
                <Button variant="outline" size="sm">
                  View Full Task
                </Button>
              </Link>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded p-1 text-muted hover:text-ink"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 text-caption sm:grid-cols-4">
            <div>
              <span className="text-muted">Dates:</span>
              <p className="font-medium text-body-strong">
                {selectedTask.estimated_start} → {selectedTask.estimated_end}
              </p>
            </div>
            <div>
              <span className="text-muted">Assignee:</span>
              <p className="font-medium text-body-strong">
                {selectedTask.assignee_name || "Unassigned"}
              </p>
            </div>
            <div>
              <span className="text-muted">Project:</span>
              <p className="font-medium text-body-strong">
                {selectedTask.project_name || "—"}
              </p>
            </div>
            <div>
              <span className="text-muted">Progress:</span>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-card-elevated">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${selectedTask.completion_percentage}%` }}
                  />
                </div>
                <span className="font-mono font-medium text-body-strong">
                  {selectedTask.completion_percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Dependencies breakdown for selected task */}
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-hairline pt-3 sm:grid-cols-2">
            <div>
              <span className="text-caption font-semibold text-muted">
                Blocked by (Predecessors):
              </span>
              <ul className="mt-1 space-y-1">
                {dependencies
                  .filter((d) => d.task_id === selectedTask.id)
                  .map((dep) => {
                    const pred = tasks.find((t) => t.id === dep.depends_on_task_id);
                    const isConflict =
                      pred?.estimated_end &&
                      selectedTask.estimated_start &&
                      pred.estimated_end > selectedTask.estimated_start;

                    return (
                      <li
                        key={dep.id}
                        className={cn(
                          "flex items-center justify-between rounded border px-2 py-1 text-caption",
                          isConflict
                            ? "border-error/40 bg-error/10 text-error"
                            : "border-hairline bg-surface-card-elevated text-body-strong",
                        )}
                      >
                        <Link
                          href={`/dashboard/tasks/${dep.depends_on_task_id}`}
                          className="hover:underline truncate"
                        >
                          {pred?.title || dep.depends_on_task_id}
                        </Link>
                        <span className="text-[10px] opacity-80">
                          {isConflict ? "Delay Conflict" : pred?.status || dep.dependency_type}
                        </span>
                      </li>
                    );
                  })}
                {dependencies.filter((d) => d.task_id === selectedTask.id).length === 0 && (
                  <li className="text-caption text-muted-soft">No predecessor tasks</li>
                )}
              </ul>
            </div>

            <div>
              <span className="text-caption font-semibold text-muted">
                Blocks (Successors):
              </span>
              <ul className="mt-1 space-y-1">
                {dependencies
                  .filter((d) => d.depends_on_task_id === selectedTask.id)
                  .map((dep) => {
                    const succ = tasks.find((t) => t.id === dep.task_id);
                    return (
                      <li
                        key={dep.id}
                        className="flex items-center justify-between rounded border border-hairline bg-surface-card-elevated px-2 py-1 text-caption text-body-strong"
                      >
                        <Link
                          href={`/dashboard/tasks/${dep.task_id}`}
                          className="hover:underline truncate"
                        >
                          {succ?.title || dep.task_id}
                        </Link>
                        <span className="text-[10px] opacity-80">{succ?.status}</span>
                      </li>
                    );
                  })}
                {dependencies.filter((d) => d.depends_on_task_id === selectedTask.id).length === 0 && (
                  <li className="text-caption text-muted-soft">No downstream tasks blocked</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <details className="rounded-lg border border-hairline bg-surface-card p-3 shadow-sm">
          <summary className="cursor-pointer text-body-sm font-medium text-body-strong hover:text-primary">
            Unscheduled Tasks ({unscheduledTasks.length}) — Click to view tasks without start or end dates
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {unscheduledTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-hairline bg-surface-card-elevated p-2 text-caption"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <Link
                    href={`/dashboard/tasks/${t.id}`}
                    className="block truncate font-medium text-ink hover:text-primary"
                  >
                    {t.title}
                  </Link>
                  <span className="text-[10px] text-muted-soft">
                    {t.project_name || "No project"}
                  </span>
                </div>
                <Badge variant={t.status === "Blocked" ? "error" : "default"}>
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
