"use client";

import { KanbanBoard } from "@/components/tables/kanban-board";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { createTask, updateTask } from "@/actions/tasks";
import {
  createProjectCommentAction,
  deleteProjectCommentAction,
  updateProjectCommentAction,
} from "@/actions/comments";
import { createMilestone, updateMilestone } from "@/actions/milestones";
import { FormField, FormSelect, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Timeline } from "@/components/charts/timeline";
import { DocumentsTab } from "@/app/dashboard/clients/[id]/documents-tab";
import { ActivityTimeline } from "@/app/dashboard/activity/activity-timeline";
import { HistoryFilters } from "@/app/dashboard/clients/[id]/history-filters";
import { IndicatorsTab } from "./indicators-tab";
import { TeamSection } from "./team-section";
import type {
  ProjectMetricsBundle,
  ProjectMember,
  ProjectMemberCandidate,
  ProjectHistoryCategory,
} from "@/features/projects";
import type { ActivityLog } from "@/features/activity";
import {
  useActionState,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
import { hasFullAccess } from "@/lib/roles";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

interface TaskRow {
  id: string; title: string; status: string; priority: string;
  estimated_hours: number; completion_percentage: number; description: string | null;
}
interface MilestoneRow {
  id: string; title: string; status: string; estimated_date: string | null; completion_percentage: number;
  description: string | null; completed_date: string | null;
}

function getStatusColor(status: string) {
  const colors: Record<string, "success" | "error" | "warning" | "default"> = {
    Completed: "success", Blocked: "error", "In Progress": "warning", "In Review": "default", QA: "default",
  };
  return colors[status] || "default";
}

const taskColumns: ColumnDef<TaskRow>[] = [
  {
    accessorKey: "title", header: "Task",
    cell: ({ row }) => (
      <Link href={`/dashboard/tasks/${row.original.id}`} className="text-body-strong hover:text-primary transition-colors">
        {row.original.title}
      </Link>
    ),
  },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge variant={getStatusColor(getValue() as string)}>{getValue() as string}</Badge> },
  { accessorKey: "priority", header: "Priority", cell: ({ getValue }) => <Badge>{getValue() as string}</Badge> },
  { accessorKey: "completion_percentage", header: "%", cell: ({ getValue }) => `${getValue() as number}%` },
];

interface CommentRow {
  id: string; parent_comment_id: string | null; message: string; is_edited: boolean;
  created_at: string; user_id: string;
  users: { first_name: string; last_name: string; avatar: string | null };
}

interface ProjectHistory {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface Props {
  projectId: string;
  initialTab?: string;
  history?: ProjectHistory | null;
  historyFilters: { search: string; category: ProjectHistoryCategory | null };
  tasks: unknown[];
  milestones: unknown[];
  comments: unknown[];
  documents: unknown[];
  projectStartDate: string | null;
  projectEndDate: string | null;
  indicators: ProjectMetricsBundle | null;
  role: string | null;
  members: ProjectMember[];
  availableMembers: ProjectMemberCandidate[];
  canManageMembers: boolean;
  canCreateTasks?: boolean;
  canUpdateTasks?: boolean;
  canManageMilestones?: boolean;
  canUploadFiles?: boolean;
  canDeleteFiles?: boolean;
  canDownloadFiles?: boolean;
  currentUserId?: string | null;
  canCreateComments?: boolean;
  canModerateComments?: boolean;
}

// Historias 6.12 / 6.13 — Vista del Cliente y del Intermediario. Both roles get
// read-only monitoring tabs; the Kanban board is a management view reserved for
// the full-access roles (Developer / Administrator / Super Administrator, 6.18).
const STAKEHOLDER_TABS = [
  "overview",
  "indicators",
  "tasks",
  "milestones",
  "timeline",
  "documents",
  "comments",
  "activity",
] as const;

function visibleTabsForRole(role: string | null) {
  const allTabs = [
    { id: "overview", label: "Overview" },
    { id: "indicators", label: "Indicators" },
    { id: "tasks", label: "Tasks" },
    { id: "kanban", label: "Kanban" },
    { id: "milestones", label: "Milestones" },
    { id: "timeline", label: "Timeline" },
    { id: "documents", label: "Documents" },
    { id: "comments", label: "Comments" },
    { id: "activity", label: "Activity" },
  ] as const;

  if (hasFullAccess(role)) return [...allTabs];
  return allTabs.filter((t) => (STAKEHOLDER_TABS as readonly string[]).includes(t.id));
}

export function ProjectTabs({
  projectId,
  initialTab,
  history,
  historyFilters,
  tasks,
  milestones,
  comments,
  documents,
  projectStartDate,
  projectEndDate,
  indicators,
  role,
  members,
  availableMembers,
  canManageMembers,
  canCreateTasks = true,
  canUpdateTasks = true,
  canManageMilestones = true,
  canUploadFiles = false,
  canDeleteFiles = false,
  canDownloadFiles = true,
  currentUserId = null,
  canCreateComments = true,
  canModerateComments = false,
}: Props) {
  const tabs = visibleTabsForRole(role);
  type TabId = (typeof tabs)[number]["id"];
  const [tab, setTab] = useState<TabId>(
    tabs.some((t) => t.id === initialTab) ? (initialTab as TabId) : "overview",
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startNavigation] = useTransition();

  // Historia 6.14: activity tab state (search, event type, page) lives in the URL.
  function navigateToActivity(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.set("tab", "activity");
    const qs = next.toString();
    startNavigation(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }
  const [tasksState, setTasksState] = useState(tasks as unknown as TaskRow[]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [, startTransition] = useTransition();

  function handleKanbanStatusChange(taskId: string, newStatus: string) {
    startTransition(async () => {
      await updateTask(null, new FormData());
      setTasksState((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    });
  }

  const kanbanTasks = tasksState.map((t) => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority, assigned_to: null,
  }));

  const taskActionColumns: ColumnDef<TaskRow>[] = [
    ...taskColumns,
    ...(canUpdateTasks
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: TaskRow } }) => (
              <button onClick={() => setEditingTask(row.original)} className="text-body-sm text-primary hover:underline">Edit</button>
            ),
          } as ColumnDef<TaskRow>,
        ]
      : []),
  ];

  const statusOpts = [{ value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" }, { value: "Blocked", label: "Blocked" }, { value: "In Review", label: "In Review" }, { value: "QA", label: "QA" }, { value: "Completed", label: "Completed" }];
  const priorityOpts = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }, { value: "Critical", label: "Critical" }];

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Project sections" className="flex overflow-x-auto border-b border-hairline">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-body-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-body-strong"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Recent Tasks</CardTitle></CardHeader>
              <CardContent>
                {tasksState.length === 0 ? <p className="text-body-sm text-muted-soft">No tasks yet.</p> : (
                  <div className="divide-y divide-hairline-soft">
                    {tasksState.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-2">
                        <span className="text-body-sm text-body-strong">{t.title}</span>
                        <Badge variant={getStatusColor(t.status)}>{t.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
              <CardContent>
                {(milestones as MilestoneRow[]).length === 0 ? <p className="text-body-sm text-muted-soft">No milestones yet.</p> : (
                  <div className="divide-y divide-hairline-soft">
                    {(milestones as MilestoneRow[]).slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2">
                        <span className="text-body-sm text-body-strong">{m.title}</span>
                        <Badge variant={getStatusColor(m.status)}>{m.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Historia 6.7 — Gestión de miembros (vista de administración). */}
          {canManageMembers && (
            <TeamSection projectId={projectId} members={members} available={availableMembers} />
          )}
        </div>
      )}

      {tab === "indicators" && (
        indicators ? (
          <IndicatorsTab bundle={indicators} />
        ) : (
          <p className="text-body-sm text-muted-soft py-8 text-center">
            Indicators are not available for this project yet.
          </p>
        )
      )}

      {tab === "tasks" && (
        <div className="space-y-4">
          {canCreateTasks && <div className="flex justify-end"><Button onClick={() => setShowTaskForm(true)}>New Task</Button></div>}
          <DataTable columns={taskActionColumns} data={tasksState} searchColumn="title" />
        </div>
      )}

      {tab === "kanban" && (
        <KanbanBoard tasks={kanbanTasks} onStatusChange={canUpdateTasks ? handleKanbanStatusChange : undefined} />
      )}

      {tab === "milestones" && (
        <MilestonesSection
          milestones={milestones as unknown as MilestoneRow[]}
          projectId={projectId}
          canManage={canManageMilestones}
        />
      )}

      {tab === "timeline" && (
        <Timeline
          items={milestones as unknown as MilestoneRow[]}
          projectStartDate={projectStartDate}
          projectEndDate={projectEndDate}
        />
      )}

      {tab === "documents" && (
        <DocumentsTab
          entityId={projectId}
          entityType="project"
          documents={documents as never[]}
          canUpload={canUploadFiles}
          canDelete={canDeleteFiles}
          canDownload={canDownloadFiles}
        />
      )}

      {tab === "comments" && (
        <CommentsTab
          projectId={projectId}
          comments={comments as unknown as CommentRow[]}
          currentUserId={currentUserId}
          canComment={canCreateComments}
          canModerate={canModerateComments}
        />
      )}

      {tab === "activity" && (
        <div className="space-y-4">
          {/* Historia 6.14 — Timeline de actividad con búsqueda y filtro por tipo. */}
          <HistoryFilters
            idPrefix="project-history"
            categoryOptions={[
              { value: "", label: "All events" },
              { value: "project", label: "Project management" },
              { value: "files", label: "Files" },
              { value: "comments", label: "Comments" },
            ]}
            initialSearch={historyFilters.search}
            category={historyFilters.category ?? ""}
            onNavigate={navigateToActivity}
          />
          <ActivityTimeline
            logs={history?.data ?? []}
            total={history?.total ?? 0}
            pageIndex={(history?.page ?? 1) - 1}
            pageSize={history?.pageSize ?? 20}
            onPageChange={(nextPageIndex) =>
              navigateToActivity({ page: nextPageIndex === 0 ? undefined : String(nextPageIndex + 1) })
            }
          />
        </div>
      )}

      {showTaskForm && (
        <TaskFormModal statusOpts={statusOpts} priorityOpts={priorityOpts} projectId={projectId} onClose={() => setShowTaskForm(false)} onSuccess={() => setShowTaskForm(false)} />
      )}
      {editingTask && (
        <TaskFormModal item={editingTask} statusOpts={statusOpts} priorityOpts={priorityOpts} onClose={() => setEditingTask(null)} onSuccess={() => setEditingTask(null)} />
      )}
    </div>
  );
}

function TaskFormModal({ item, statusOpts, priorityOpts, projectId, onClose, onSuccess }: {
  item?: TaskRow; statusOpts: { value: string; label: string }[]; priorityOpts: { value: string; label: string }[];
  projectId?: string; onClose: () => void; onSuccess: () => void;
}) {
  const action = item ? updateTask : createTask;
  const { formAction, isPending, state } = useQueuedFormAction(item ? "task.update" : null, action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader><CardTitle>{item ? "Edit" : "Create"} Task</CardTitle><button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">✕</button></CardHeader>
        <CardContent>
          {state?.success ? <div className="space-y-4"><p className="text-body-sm text-success">{state.success}</p><Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button></div> : (
            <form action={formAction} className="flex flex-col gap-4">
              {item && <input type="hidden" name="id" value={item.id} />}
              {projectId && <input type="hidden" name="project_id" value={projectId} />}
              <FormField label="Title" name="title" defaultValue={item?.title} required />
              <FormTextarea label="Description" name="description" defaultValue={item?.description || ""} />
              <FormSelect label="Status" name="status" options={statusOpts} defaultValue={item?.status || "Pending"} />
              <FormSelect label="Priority" name="priority" options={priorityOpts} defaultValue={item?.priority || "Medium"} />
              <FormField label="Estimated Hours" name="estimated_hours" type="number" defaultValue={String(item?.estimated_hours || 0)} />
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Saving..." : item ? "Update" : "Create"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ThreadNode extends CommentRow {
  replies: CommentRow[];
}

function buildThreads(comments: CommentRow[]): ThreadNode[] {
  const roots: ThreadNode[] = [];
  const byId = new Map<string, ThreadNode>();

  for (const comment of comments) {
    byId.set(comment.id, { ...comment, replies: [] });
  }

  for (const node of byId.values()) {
    if (node.parent_comment_id && byId.has(node.parent_comment_id)) {
      byId.get(node.parent_comment_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function canEditComment(comment: Pick<CommentRow, "user_id">, currentUserId: string | null, canModerate: boolean) {
  return !!currentUserId && (canModerate || comment.user_id === currentUserId);
}

function CommentsTab({
  projectId,
  comments,
  currentUserId,
  canComment,
  canModerate,
}: {
  projectId: string;
  comments: CommentRow[];
  currentUserId: string | null;
  canComment: boolean;
  canModerate: boolean;
}) {
  const threads = buildThreads(comments);

  return (
    <div className="space-y-6">
      {canComment ? (
        <Card>
          <CardHeader><CardTitle>Add Comment</CardTitle></CardHeader>
          <CardContent>
            <NewCommentForm projectId={projectId} />
          </CardContent>
        </Card>
      ) : null}

      {comments.length === 0 ? (
        <p className="text-body-sm text-muted-soft">No comments yet.</p>
      ) : (
        <ol aria-label="Project comments" className="relative ml-3 space-y-4 border-l border-hairline pl-6">
          {threads.map((thread) => (
            <li key={thread.id} className="space-y-3">
              <CommentCard projectId={projectId} comment={thread} currentUserId={currentUserId} canModerate={canModerate} canComment={canComment} />
              {thread.replies.length > 0 && (
                <ul className="space-y-3 pl-6">
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentCard projectId={projectId} comment={reply} currentUserId={currentUserId} canModerate={canModerate} canComment={canComment} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CommentCard({
  projectId,
  comment,
  currentUserId,
  canModerate,
  canComment,
}: {
  projectId: string;
  comment: CommentRow;
  currentUserId: string | null;
  canModerate: boolean;
  canComment: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [, startTransition] = useTransition();

  const authorName =
    [comment.users?.first_name, comment.users?.last_name].filter(Boolean).join(" ").trim() ||
    "Unknown user";
  const initials =
    `${comment.users?.first_name?.[0] ?? ""}${comment.users?.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const editable = canEditComment(comment, currentUserId, canModerate);

  function handleDelete() {
    if (!confirm("Delete this comment? This cannot be undone.")) return;

    setError(null);
    setIsBusy(true);
    startTransition(async () => {
      const result = await deleteProjectCommentAction(comment.id, projectId);
      setIsBusy(false);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <article className="rounded-xl border border-hairline bg-surface-card p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-card-elevated text-caption font-semibold text-body-strong"
        >
          {initials}
        </span>
        <span className="text-body-sm font-medium text-body-strong">{authorName}</span>
        <time
          dateTime={comment.created_at}
          className="text-caption text-muted"
          title={new Date(comment.created_at).toLocaleString()}
        >
          {new Date(comment.created_at).toLocaleDateString()}
        </time>
        {comment.is_edited && <span className="text-caption text-muted">(edited)</span>}
        <div className="ml-auto flex items-center gap-2">
          {editable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              disabled={isBusy}
              className="text-body-sm text-primary hover:underline disabled:opacity-50"
            >
              Edit
            </button>
          )}
          {editable && (
            <button
              onClick={handleDelete}
              disabled={isBusy}
              className="text-body-sm text-error hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <EditCommentForm
          projectId={projectId}
          comment={comment}
          onDone={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <p className="mt-2 whitespace-pre-line break-words text-body-sm text-body">{comment.message}</p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-caption text-error">
          {error}
        </p>
      )}

      {canComment && !isEditing && (
        <button
          onClick={() => setIsReplying((v) => !v)}
          className="mt-2 text-caption-uppercase text-muted transition-colors hover:text-primary"
        >
          Reply
        </button>
      )}

      {isReplying && (
        <div className="mt-3">
          <NewCommentForm projectId={projectId} parentCommentId={comment.id} onDone={() => setIsReplying(false)} />
        </div>
      )}
    </article>
  );
}

// Top-level comments keep the PWA offline queue; replies cannot be queued
// (their payload is not part of the pending-actions schema) so they go direct.
function NewCommentForm({
  projectId,
  parentCommentId,
  onDone,
}: {
  projectId: string;
  parentCommentId?: string;
  onDone?: () => void;
}) {
  const { formAction: queuedFormAction, isPending: isQueuedPending, state: queuedState } = useQueuedFormAction(
    "project-comment.create",
    createProjectCommentAction,
  );
  const [state, formAction, isPending] = useActionState(createProjectCommentAction, null);

  const activeState = parentCommentId ? state : queuedState;
  const activeFormAction = parentCommentId ? formAction : queuedFormAction;
  const activeIsPending = parentCommentId ? isPending : isQueuedPending;

  if (activeState?.success) {
    return (
      <div className="space-y-3">
        <p className="text-body-sm text-success">{activeState.success}</p>
        {onDone && <Button onClick={onDone} variant="secondary" className="w-full sm:w-auto">Done</Button>}
      </div>
    );
  }

  return (
    <form action={activeFormAction} className="flex flex-col gap-3">
      <input type="hidden" name="project_id" value={projectId} />
      {parentCommentId && <input type="hidden" name="parent_comment_id" value={parentCommentId} />}
      <FormTextarea label={parentCommentId ? "Your reply" : "Message"} name="message" required />
      {activeState?.error && <p role="alert" className="text-body-sm text-error">{activeState.error}</p>}
      <div>
        <Button type="submit" disabled={activeIsPending} className="w-full sm:w-auto">
          {activeIsPending ? "Posting..." : parentCommentId ? "Post Reply" : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}

function EditCommentForm({
  projectId,
  comment,
  onDone,
  onCancel,
}: {
  projectId: string;
  comment: CommentRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateProjectCommentAction, null);

  if (state?.success) {
    return (
      <div className="mt-3 space-y-3">
        <p className="text-body-sm text-success">{state.success}</p>
        <Button onClick={onDone} variant="secondary" className="w-full sm:w-auto">Done</Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="comment_id" value={comment.id} />
      <input type="hidden" name="project_id" value={projectId} />
      <FormTextarea label="Message" name="message" defaultValue={comment.message} required />
      {state?.error && <p role="alert" className="text-body-sm text-error">{state.error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

function MilestonesSection({
  milestones,
  projectId,
  canManage,
}: {
  milestones: MilestoneRow[];
  projectId: string;
  canManage: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MilestoneRow | null>(null);

  return (
    <div className="space-y-4">
      {canManage && <div className="flex justify-end"><Button onClick={() => setShowForm(true)}>Add Milestone</Button></div>}
      {milestones.length === 0 ? (
        <p className="text-body-sm text-muted-soft py-8 text-center">No milestones yet.</p>
      ) : (
        <div className="divide-y divide-hairline-soft rounded-lg border border-hairline-soft">
          {milestones.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4">
              <div>
                <span className="text-body-sm font-medium text-body-strong">{m.title}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getStatusColor(m.status)}>{m.status}</Badge>
                  <span className="text-caption text-muted">{m.estimated_date ? new Date(m.estimated_date).toLocaleDateString() : "No date"}</span>
                  <span className="text-caption text-muted">{m.completion_percentage}%</span>
                </div>
              </div>
              {canManage && (
                <button onClick={() => setEditing(m)} className="text-body-sm text-primary hover:underline">Edit</button>
              )}
            </div>
          ))}
        </div>
      )}
      {showForm && <MilestoneFormModal projectId={projectId} onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />}
      {editing && <MilestoneFormModal item={editing} projectId={projectId} onClose={() => setEditing(null)} onSuccess={() => setEditing(null)} />}
    </div>
  );
}

function MilestoneFormModal({ item, projectId, onClose, onSuccess }: {
  item?: MilestoneRow; projectId: string; onClose: () => void; onSuccess: () => void;
}) {
  const action = item ? updateMilestone : createMilestone;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{item ? "Edit" : "Create"} Milestone</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4"><p className="text-body-sm text-success">{state.success}</p><Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button></div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {item && <input type="hidden" name="id" value={item.id} />}
              <input type="hidden" name="project_id" value={projectId} />
              <FormField label="Title" name="title" defaultValue={item?.title} required />
              <FormTextarea label="Description" name="description" />
              <FormField label="Target Date" name="estimated_date" type="date" defaultValue={item?.estimated_date?.split("T")[0] || ""} />
              {item && <FormField label="Progress %" name="completion_percentage" type="number" min="0" max="100" defaultValue={String(item.completion_percentage)} />}
              {item && (
                <FormSelect label="Status" name="status" options={[
                  { value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" },
                  { value: "Completed", label: "Completed" },
                ]} defaultValue={item.status} />
              )}
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Saving..." : item ? "Update" : "Create"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
