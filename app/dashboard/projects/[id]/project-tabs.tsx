"use client";

import { KanbanBoard } from "@/components/tables/kanban-board";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { createTask, updateTask } from "@/actions/tasks";
import { createProjectCommentAction } from "@/actions/comments";
import { createMilestone, updateMilestone } from "@/actions/milestones";
import { FormField, FormSelect, FormTextarea } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Timeline } from "@/components/charts/timeline";
import { useActionState, useState, useTransition } from "react";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
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
  id: string; message: string; created_at: string; user_id: string;
  users: { first_name: string; last_name: string; avatar: string | null };
}

interface Props {
  projectId: string;
  tasks: unknown[];
  milestones: unknown[];
  comments: unknown[];
  projectStartDate: string | null;
  projectEndDate: string | null;
}

export function ProjectTabs({ projectId, tasks, milestones, comments, projectStartDate, projectEndDate }: Props) {
  const [tab, setTab] = useState<"overview" | "tasks" | "kanban" | "milestones" | "timeline" | "comments">("overview");
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

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "tasks" as const, label: "Tasks" },
    { id: "kanban" as const, label: "Kanban" },
    { id: "milestones" as const, label: "Milestones" },
    { id: "timeline" as const, label: "Timeline" },
    { id: "comments" as const, label: "Comments" },
  ];

  const kanbanTasks = tasksState.map((t) => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority, assigned_to: null,
  }));

  const taskActionColumns: ColumnDef<TaskRow>[] = [...taskColumns, {
    id: "actions", header: "",
    cell: ({ row }) => <button onClick={() => setEditingTask(row.original)} className="text-body-sm text-primary hover:underline">Edit</button>,
  }];

  const statusOpts = [{ value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" }, { value: "Blocked", label: "Blocked" }, { value: "In Review", label: "In Review" }, { value: "QA", label: "QA" }, { value: "Completed", label: "Completed" }];
  const priorityOpts = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }, { value: "Critical", label: "Critical" }];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-hairline">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-body-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-body-strong"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
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
      )}

      {tab === "tasks" && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => setShowTaskForm(true)}>New Task</Button></div>
          <DataTable columns={taskActionColumns} data={tasksState} searchColumn="title" />
        </div>
      )}

      {tab === "kanban" && (
        <KanbanBoard tasks={kanbanTasks} onStatusChange={handleKanbanStatusChange} />
      )}

      {tab === "milestones" && (
        <MilestonesSection milestones={milestones as unknown as MilestoneRow[]} projectId={projectId} />
      )}

      {tab === "timeline" && (
        <Timeline
          items={milestones as unknown as MilestoneRow[]}
          projectStartDate={projectStartDate}
          projectEndDate={projectEndDate}
        />
      )}

      {tab === "comments" && (
        <CommentsTab projectId={projectId} comments={comments as unknown as CommentRow[]} />
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

function CommentsTab({ projectId, comments }: { projectId: string; comments: CommentRow[] }) {
  const { formAction, isPending, state } = useQueuedFormAction(
    "project-comment.create",
    createProjectCommentAction,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Add Comment</CardTitle></CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="project_id" value={projectId} />
            <FormTextarea label="Message" name="message" required />
            {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
            {state?.success && <p className="text-body-sm text-success">{state.success}</p>}
            <div>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {comments.length === 0 ? (
        <p className="text-body-sm text-muted-soft">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-body-sm font-medium">
                    {c.users?.first_name?.[0]}{c.users?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-body-strong">
                        {c.users?.first_name} {c.users?.last_name}
                      </span>
                      <span className="text-caption text-muted">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-body-sm text-body">{c.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MilestonesSection({ milestones, projectId }: { milestones: MilestoneRow[]; projectId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MilestoneRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setShowForm(true)}>Add Milestone</Button></div>
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
              <button onClick={() => setEditing(m)} className="text-body-sm text-primary hover:underline">Edit</button>
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
