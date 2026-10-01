"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/charts";
import { ActivityCard } from "@/components/dashboard";
import { moveMilestone, toggleMilestoneActive } from "@/actions/milestones";
import type { MilestoneIndicators, MilestoneProjectTask } from "@/features/milestones";
import type { ActivityLog } from "@/features/activity";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import type { ColumnDef } from "@tanstack/react-table";
import { MilestoneComments, type MilestoneCommentRow } from "./milestone-comments";
import { MilestoneFormModal } from "./milestone-form-modal";
import { MilestoneTasksModal } from "./milestone-tasks-modal";

// Row enriched server-side: aggregates + indicators come precomputed so the
// table never re-runs business rules on the client (Historias 8.6/8.9).
export interface MilestoneViewRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  estimated_date: string | null;
  completed_date: string | null;
  completion_percentage: number;
  task_count: number;
  completed_tasks: number;
  indicators: MilestoneIndicators;
}

type ViewMode = "table" | "timeline";

interface Props {
  projectId: string;
  rows: MilestoneViewRow[];
  projectTasks: MilestoneProjectTask[];
  statusOptions: { value: string; label: string }[];
  initialFilters: { search: string; status: string };
  view: ViewMode;
  projectStartDate: string | null;
  projectEndDate: string | null;
  historyLogs: ActivityLog[];
  canManage: boolean;
  canManageTasks: boolean;
  commentsByMilestone: Map<string, MilestoneCommentRow[]>;
  currentUserId: string | null;
  canComment: boolean;
  canModerate: boolean;
  canUploadFiles: boolean;
  canDeleteFiles: boolean;
  canDownloadFiles: boolean;
}

function statusVariant(status: string): "success" | "warning" | "default" {
  if (status === "Completed") return "success";
  if (status === "In Progress" || status === "In Review") return "warning";
  return "default";
}

function progressColor(row: MilestoneViewRow): string {
  if (row.indicators.progress >= 100) return "#10B981";
  if (row.indicators.isOverdue) return "#EF4444";
  return "#3B82F6";
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function MilestonesTable({
  projectId,
  rows,
  projectTasks,
  statusOptions,
  initialFilters,
  view,
  projectStartDate,
  projectEndDate,
  historyLogs,
  canManage,
  canManageTasks,
  commentsByMilestone,
  currentUserId,
  canComment,
  canModerate,
  canUploadFiles,
  canDeleteFiles,
  canDownloadFiles,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<MilestoneViewRow | null>(null);
  const [openMilestone, setOpenMilestone] = useState<string | null>(null);
  const [tasksMilestone, setTasksMilestone] = useState<MilestoneViewRow | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [, startTransition] = useTransition();
  const debouncedSearch = useDebounce(searchInput, 400);

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

  useEffect(() => {
    if (debouncedSearch === initialFilters.search) return;
    navigate({ q: debouncedSearch || undefined });
  }, [debouncedSearch]);

  async function handleArchive(row: MilestoneViewRow) {
    if (!window.confirm(`Archive milestone "${row.title}"? You can restore it later.`)) return;

    startTransition(async () => {
      const result = await toggleMilestoneActive(row.id, false);
      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({ type: "success", message: result.success ?? "Milestone archived." });
      router.refresh();
    });
  }

  async function handleMove(row: MilestoneViewRow, direction: "up" | "down") {
    const formData = new FormData();
    formData.set("project_id", projectId);
    formData.set("milestone_id", row.id);
    formData.set("direction", direction);

    startTransition(async () => {
      const result = await moveMilestone(null, formData);
      if (result?.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      router.refresh();
    });
  }

  const columns: ColumnDef<MilestoneViewRow>[] = [
    {
      accessorKey: "title",
      header: "Milestone",
      cell: ({ row, getValue }) => (
        <div className="min-w-0">
          <p className="truncate text-body-strong">{getValue() as string}</p>
          {row.original.description && (
            <p className="truncate text-caption text-muted">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const s = getValue() as string;
        return <Badge variant={statusVariant(s)}>{s}</Badge>;
      },
    },
    {
      accessorKey: "estimated_date",
      header: "Target Date",
      cell: ({ row, getValue }) => (
        <div className="flex flex-col">
          <span>{formatDate(getValue() as string | null)}</span>
          {row.original.indicators.delayDays !== null && (
            <span className="text-caption text-error">+{row.original.indicators.delayDays}d late</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "completion_percentage",
      header: "Progress",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-card-elevated">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${row.original.indicators.progress}%`, backgroundColor: progressColor(row.original) }}
            />
          </div>
          <span className="text-caption text-muted">{row.original.indicators.progress}%</span>
        </div>
      ),
    },
    {
      id: "tasks",
      header: "Tasks",
      cell: ({ row }) => (
        <span className="text-body-sm text-body">
          {row.original.completed_tasks}/{row.original.task_count}
        </span>
      ),
    },
    {
      id: "hours",
      header: "Hours",
      cell: ({ row }) => (
        <span
          className="text-body-sm text-body"
          title={`${row.original.indicators.remainingHours}h remaining of ${row.original.indicators.estimatedHours}h estimated`}
        >
          {row.original.indicators.workedHours}h / {row.original.indicators.estimatedHours}h
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOpenMilestone((cur) => (cur === row.original.id ? null : row.original.id))}
            className="text-body-sm text-primary hover:underline"
          >
            {openMilestone === row.original.id ? "Hide Comments" : "Comments"}
          </button>
          {canManageTasks && (
            <button onClick={() => setTasksMilestone(row.original)} className="text-body-sm text-primary hover:underline">
              Tasks
            </button>
          )}
          {canManage && (
            <>
              <button onClick={() => setEditing(row.original)} className="text-body-sm text-primary hover:underline">
                Edit
              </button>
              <button
                onClick={() => handleMove(row.original, "up")}
                aria-label={`Move ${row.original.title} up`}
                className="text-body-sm text-muted hover:text-body-strong"
              >
                Up
              </button>
              <button
                onClick={() => handleMove(row.original, "down")}
                aria-label={`Move ${row.original.title} down`}
                className="text-body-sm text-muted hover:text-body-strong"
              >
                Down
              </button>
              <button
                onClick={() => handleArchive(row.original)}
                className="text-body-sm text-muted hover:text-error"
              >
                Archive
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={feedback.type === "error" ? "text-body-sm text-error" : "text-body-sm text-success"}
        >
          {feedback.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-48">
          <label
            htmlFor="milestones-status-filter"
            className="mb-1.5 block text-body-sm font-medium text-body-strong"
          >
            Status
          </label>
          <select
            id="milestones-status-filter"
            value={initialFilters.status}
            onChange={(e) => navigate({ status: e.target.value || undefined })}
            className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex overflow-hidden rounded-md border border-hairline"
            role="group"
            aria-label="View mode"
          >
            <button
              onClick={() => navigate({ view: undefined })}
              aria-pressed={view === "table"}
              className={`px-4 py-2 text-body-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                view === "table" ? "bg-primary text-on-primary" : "text-body-strong hover:bg-surface-card-elevated"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => navigate({ view: "timeline" })}
              aria-pressed={view === "timeline"}
              className={`px-4 py-2 text-body-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                view === "timeline" ? "bg-primary text-on-primary" : "text-body-strong hover:bg-surface-card-elevated"
              }`}
            >
              Timeline
            </button>
          </div>
          <Button
            variant={showHistory ? "primary" : "outline"}
            onClick={() => setShowHistory((current) => !current)}
            aria-pressed={showHistory}
          >
            History
          </Button>
        </div>

        {canManage && <Button onClick={() => setShowCreate(true)}>Add Milestone</Button>}
      </div>

      {showHistory && (
        <ActivityCard
          logs={historyLogs}
          title="Milestone Activity"
          emptyMessage="No milestone changes recorded yet."
          href="/dashboard/activity"
        />
      )}

      {rows.length === 0 ? (
        <p className="py-12 text-center text-body-sm text-muted-soft">
          No milestones match the current filters.
        </p>
      ) : view === "timeline" ? (
        <Timeline items={rows} projectStartDate={projectStartDate} projectEndDate={projectEndDate} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          totalCount={rows.length}
          searchColumn="title"
          searchPlaceholder="Search milestones..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
        />
      )}

      {openMilestone && (
        <div className="rounded-xl border border-hairline bg-surface-card p-4">
          <h2 className="text-body-strong mb-4">Milestone Comments</h2>
          <MilestoneComments
            milestoneId={openMilestone}
            comments={commentsByMilestone.get(openMilestone) ?? []}
            currentUserId={currentUserId}
            canComment={canComment}
            canModerate={canModerate}
            canUploadFiles={canUploadFiles}
            canDeleteFiles={canDeleteFiles}
            canDownloadFiles={canDownloadFiles}
          />
        </div>
      )}

      {showCreate && (
        <MilestoneFormModal
          projectId={projectId}
          statusOptions={statusOptions}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); router.refresh(); }}
        />
      )}

      {editing && (
        <MilestoneFormModal
          item={editing}
          statusOptions={statusOptions}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); router.refresh(); }}
        />
      )}

      {tasksMilestone && (
        <MilestoneTasksModal
          milestone={{ id: tasksMilestone.id, title: tasksMilestone.title }}
          tasks={projectTasks}
          canManageTasks={canManageTasks}
          onClose={() => setTasksMilestone(null)}
        />
      )}
    </div>
  );
}
