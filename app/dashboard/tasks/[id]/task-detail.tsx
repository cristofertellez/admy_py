"use client";

import { createSubtask, updateTask, moveSubtask, toggleTaskCompletion, toggleTaskActive } from "@/actions/tasks";
import { createChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/actions/checklists";
import { updateTaskTags } from "@/actions/tags";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { FormField, FormSelect, FormTextarea, MentionTextarea, TagSelector } from "@/components/forms";
import { TagChip } from "@/components/shared/tag-chip";
import { CommentReactions } from "@/components/shared/comment-reactions";
import { CommentBody, extractMentionStrings } from "@/components/shared/comment-body";
import { TimeTracking, type TimeEntryRow } from "./time-tracking";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createTaskCommentAction } from "@/actions/comments";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
import { getAllowedTaskStatusOptions } from "@/features/tasks/task-status";
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from "@/constants";

interface SubtaskRow {
  id: string; title: string; status: string; priority: string;
  completion_percentage: number; estimated_hours: number;
}
interface CommentRow {
  id: string; message: string; created_at: string; user_id: string;
  users: { first_name: string; last_name: string; avatar: string | null };
}
interface ChecklistRow {
  id: string; title: string; is_completed: boolean; sort_order: number;
}
interface TagRow {
  id: string; name: string; color: string | null;
}
interface AssigneeOption {
  id: string; first_name: string; last_name: string; role: string;
}

interface Props {
  task: Record<string, unknown>;
  subtasks: SubtaskRow[];
  dependencies: { id: string; depends_on: { id: string; title: string; status: string } }[];
  availableTasks: Record<string, unknown>[];
  comments: CommentRow[];
  checklists: ChecklistRow[];
  timeEntries: TimeEntryRow[];
  tags: TagRow[];
  taskTags: TagRow[];
  assigneeOptions?: AssigneeOption[];
  statusOptions?: { value: string; label: string }[];
  priorityOptions?: { value: string; label: string }[];
  userId?: string;
  canCreateTasks?: boolean;
  canUpdateTasks?: boolean;
  canDeleteTasks?: boolean;
  canCreateTimeEntries?: boolean;
  canDeleteTimeEntries?: boolean;
}

const statusColors: Record<string, "success" | "error" | "warning" | "default"> = {
  Completed: "success", Blocked: "error", Cancelled: "error", "In Progress": "warning", "In Review": "default", QA: "default",
};

export function TaskDetail({
  task,
  subtasks,
  dependencies,
  availableTasks,
  comments,
  checklists,
  timeEntries,
  tags,
  taskTags,
  assigneeOptions = [],
  statusOptions = TASK_STATUS_OPTIONS,
  priorityOptions = TASK_PRIORITY_OPTIONS,
  canCreateTasks = true,
  canUpdateTasks = true,
  canDeleteTasks = false,
  canCreateTimeEntries = false,
  canDeleteTimeEntries = false,
}: Props) {
  const [showCreateSubtask, setShowCreateSubtask] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<SubtaskRow | null>(null);
  const [showEditTask, setShowEditTask] = useState(false);

  const completedCount = subtasks.filter((s) => s.status === "Completed").length;
  const checklistCompleted = checklists.filter((c) => c.is_completed).length;
  const assigneeOpts = [
    { value: "", label: "Unassigned" },
    ...assigneeOptions.map((a) => ({ value: a.id, label: `${a.first_name} ${a.last_name} (${a.role})` })),
  ];

  return (
    <div className="space-y-6">
      {canUpdateTasks && (
        <div className="flex items-center gap-4">
          <CompleteButton taskId={task.id as string} isCompleted={task.status === "Completed"} />
          <Button variant="secondary" onClick={() => setShowEditTask(true)}>Edit Task</Button>
          {canDeleteTasks && (
            <ArchiveButton taskId={task.id as string} taskTitle={task.title as string} />
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subtasks ({completedCount}/{subtasks.length})</CardTitle>
            {canCreateTasks && <Button onClick={() => setShowCreateSubtask(true)}>Add Subtask</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {subtasks.length === 0 ? (
            <p className="text-body-sm text-muted-soft py-4 text-center">No subtasks yet. Break down this task into smaller steps.</p>
          ) : (
            <div className="divide-y divide-hairline-soft">
              {subtasks.map((st, index) => (
                <div key={st.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {canUpdateTasks && <CompleteButton taskId={st.id} isCompleted={st.status === "Completed"} />}
                    <div>
                      <span className={`text-body-sm ${st.status === "Completed" ? "text-muted line-through" : "text-body-strong"}`}>
                        {st.title}
                      </span>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-caption text-muted">{st.estimated_hours}h</span>
                        <Badge variant={statusColors[st.status] || "default"}>{st.status}</Badge>
                        <Badge>{st.priority}</Badge>
                      </div>
                    </div>
                  </div>
                  {canUpdateTasks && (
                    <div className="flex items-center gap-3">
                      {subtasks.length > 1 && (
                        <MoveSubtaskButton
                          parentTaskId={task.id as string}
                          subtaskId={st.id}
                          direction="up"
                          disabled={index === 0}
                        />
                      )}
                      {subtasks.length > 1 && (
                        <MoveSubtaskButton
                          parentTaskId={task.id as string}
                          subtaskId={st.id}
                          direction="down"
                          disabled={index === subtasks.length - 1}
                        />
                      )}
                      <button onClick={() => setEditingSubtask(st)} className="text-body-sm text-primary hover:underline">Edit</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Checklist ({checklistCompleted}/{checklists.length})</CardTitle>
            {canCreateTasks && <AddChecklistItem taskId={task.id as string} />}
          </div>
        </CardHeader>
        <CardContent>
          {checklists.length === 0 ? (
            <p className="text-body-sm text-muted-soft py-4 text-center">No checklist items yet. Add steps to track progress.</p>
          ) : (
            <div className="space-y-1">
              {checklists.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1.5 group">
                  {canUpdateTasks && <ChecklistToggle item={item} taskId={task.id as string} />}
                  <span className={`text-body-sm flex-1 ${item.is_completed ? "text-muted line-through" : "text-body"}`}>
                    {item.title}
                  </span>
                  {canUpdateTasks && <DeleteChecklistItem itemId={item.id} taskId={task.id as string} />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TagsCard taskId={task.id as string} tags={tags} taskTags={taskTags} canUpdate={canUpdateTasks} />

      <TimeTracking
        taskId={task.id as string}
        entries={timeEntries}
        canCreate={canCreateTimeEntries}
        canDelete={canDeleteTimeEntries}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dependencies ({dependencies.length})</CardTitle>
            {canUpdateTasks && (
              <AddDependencyButton taskId={task.id as string} projectId={task.project_id as string} availableTasks={availableTasks as { id: string; title: string; status: string }[]} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dependencies.length === 0 ? (
            <p className="text-body-sm text-muted-soft py-4 text-center">No dependencies. Link this task to other tasks.</p>
          ) : (
            <div className="divide-y divide-hairline-soft">
              {dependencies.map((dep) => (
                <div key={dep.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-body-sm text-muted">Depends on</span>
                    <span className="text-body-sm text-body-strong">{dep.depends_on?.title || "Unknown task"}</span>
                    <Badge variant={statusColors[dep.depends_on?.status] || "default"}>
                      {dep.depends_on?.status || "—"}
                    </Badge>
                  </div>
                  {canUpdateTasks && <RemoveDependencyButton dependencyId={dep.id} />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <CommentForm taskId={task.id as string} />

          {comments.length === 0 ? (
            <p className="text-body-sm text-muted-soft">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3 rounded-lg bg-surface-hover p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-card-elevated text-body-sm font-medium">
                    {c.users?.first_name?.[0]}{c.users?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-body-strong">{c.users?.first_name} {c.users?.last_name}</span>
                      <span className="text-caption text-muted">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <CommentBody value={c.message} mentions={extractMentionStrings(c.message)} />
                    <CommentReactions entityType="task" commentId={c.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateSubtask && (
        <SubtaskModal
          parentTaskId={task.id as string}
          projectId={task.project_id as string}
          assigneeOptions={assigneeOpts}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onClose={() => setShowCreateSubtask(false)}
          onSuccess={() => setShowCreateSubtask(false)}
        />
      )}

      {editingSubtask && (
        <SubtaskModal
          parentTaskId={task.id as string}
          projectId={task.project_id as string}
          subtask={editingSubtask}
          assigneeOptions={assigneeOpts}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          onClose={() => setEditingSubtask(null)}
          onSuccess={() => setEditingSubtask(null)}
        />
      )}

      {showEditTask && (
        <EditTaskModal
          task={task}
          assigneeOptions={assigneeOpts}
          priorityOptions={priorityOptions}
          onClose={() => setShowEditTask(false)}
          onSuccess={() => setShowEditTask(false)}
        />
      )}
    </div>
  );
}

function CompleteButton({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) {
  const { formAction } = useQueuedFormAction("task.complete", toggleTaskCompletion);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={taskId} />
      <input type="hidden" name="completed" value={isCompleted ? "false" : "true"} />
      <button
        type="submit"
        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
          isCompleted
            ? "border-success bg-success text-white"
            : "border-hairline hover:border-muted"
        }`}
      >
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </form>
  );
}

function CommentForm({ taskId }: { taskId: string }) {
  const { formAction, isPending, state } = useQueuedFormAction(
    "task-comment.create",
    createTaskCommentAction,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="task_id" value={taskId} />
      <MentionTextarea label="Add a comment" name="message" required />
      {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
      {state?.success && <p className="text-body-sm text-success">{state.success}</p>}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md h-10 px-5 text-button font-medium bg-primary text-on-primary hover:bg-primary-active transition-colors w-full sm:w-auto disabled:opacity-60"
        >
          {isPending ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
}

function SubtaskModal({ parentTaskId, projectId, subtask, assigneeOptions, statusOptions, priorityOptions, onClose, onSuccess }: {
  parentTaskId: string; projectId: string; subtask?: SubtaskRow;
  assigneeOptions: { value: string; label: string }[]; onClose: () => void; onSuccess: () => void;
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
}) {
  const action = subtask ? updateTask : createSubtask;
  const { formAction, isPending, state } = useQueuedFormAction(subtask ? "task.update" : null, action);

  // Editing offers only the transitions allowed from the current status (Historia 7.5).
  const statusOpts = subtask ? getAllowedTaskStatusOptions(subtask.status) : statusOptions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{subtask ? "Edit" : "Create"} Subtask</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4"><p className="text-body-sm text-success">{state.success}</p><Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button></div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {subtask && <input type="hidden" name="id" value={subtask.id} />}
              <input type="hidden" name="parent_task_id" value={parentTaskId} />
              <input type="hidden" name="project_id" value={projectId} />
              <FormField label="Title" name="title" defaultValue={subtask?.title} required />
              <FormTextarea label="Description" name="description" />
              <FormSelect label="Assignee" name="assigned_to" options={assigneeOptions} defaultValue={""} />
              <FormSelect label="Status" name="status" options={statusOpts} defaultValue={subtask?.status || "Pending"} />
              <FormSelect label="Priority" name="priority" options={priorityOptions} defaultValue={subtask?.priority || "Medium"} />
              <FormField label="Estimated Hours" name="estimated_hours" type="number" defaultValue={String(subtask?.estimated_hours || 0)} />
              {subtask && (
                <FormField label="Progress %" name="completion_percentage" type="number" min="0" max="100" defaultValue={String(subtask.completion_percentage)} />
              )}
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Saving..." : subtask ? "Update" : "Create"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EditTaskModal({ task, assigneeOptions, priorityOptions, onClose, onSuccess }: {
  task: Record<string, unknown>; assigneeOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  onClose: () => void; onSuccess: () => void;
}) {
  const { formAction, isPending, state } = useQueuedFormAction("task.update", updateTask);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Edit Task</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4"><p className="text-body-sm text-success">{state.success}</p><Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button></div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={task.id as string} />
              <FormField label="Title" name="title" defaultValue={task.title as string} required />
              <FormTextarea label="Description" name="description" defaultValue={(task.description as string) || ""} />
              <FormSelect
                label="Assignee"
                name="assigned_to"
                options={assigneeOptions}
                defaultValue={(task.assigned_to as string) || ""}
              />
              <FormSelect label="Status" name="status" options={getAllowedTaskStatusOptions(task.status as string)} defaultValue={(task.status as string) || "Pending"} />
              <FormSelect label="Priority" name="priority" options={priorityOptions} defaultValue={(task.priority as string) || "Medium"} />
              <FormField label="Estimated Hours" name="estimated_hours" type="number" defaultValue={String(task.estimated_hours || 0)} />
              <FormField label="Progress %" name="completion_percentage" type="number" min="0" max="100" defaultValue={String(task.completion_percentage || 0)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Date" name="estimated_start" type="date" defaultValue={(task.estimated_start as string) || ""} />
                <FormField label="End Date" name="estimated_end" type="date" defaultValue={(task.estimated_end as string) || ""} />
              </div>
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Saving..." : "Update"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Historia 7.4 — archiving from the detail page; the list view keeps the
// restore affordance so archived tasks stay recoverable.
function ArchiveButton({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);

  async function handleArchive() {
    if (!window.confirm(`Archive task "${taskTitle}"? You can restore it later.`)) return;

    setIsArchiving(true);
    try {
      const result = await toggleTaskActive(taskId, false);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.push("/dashboard/tasks");
    } catch {
      window.alert("Unexpected error. Please try again.");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleArchive} disabled={isArchiving}>
      {isArchiving ? "Archiving..." : "Archive"}
    </Button>
  );
}

function AddDependencyButton({ taskId, projectId: _projectId, availableTasks }: {
  taskId: string; projectId: string; availableTasks: { id: string; title: string; status: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Dependency</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Add Dependency</CardTitle>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
            </CardHeader>
            <CardContent>
              {availableTasks.length === 0 ? (
                <p className="text-body-sm text-muted-soft">No other tasks available in this project.</p>
              ) : (
                <div className="divide-y divide-hairline-soft max-h-64 overflow-y-auto">
                  {availableTasks.map((t) => (
                    <form key={t.id} className="flex items-center justify-between py-2">
                      <input type="hidden" name="task_id" value={taskId} />
                      <input type="hidden" name="depends_on_task_id" value={t.id} />
                      <input type="hidden" name="dependency_type" value="Finish to Start" />
                      <span className="text-body-sm text-body-strong">{t.title}</span>
                      <button
                        type="submit"
                        formAction={async (fd: FormData) => {
                          const { addTaskDependency } = await import("@/actions/tasks");
                          await addTaskDependency(null, fd);
                          setOpen(false);
                        }}
                        className="text-body-sm text-primary hover:underline"
                      >
                        Link
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function RemoveDependencyButton({ dependencyId }: { dependencyId: string }) {
  return (
    <form>
      <input type="hidden" name="dependency_id" value={dependencyId} />
      <button
        type="submit"
        formAction={async (fd: FormData) => {
          const { removeTaskDependency } = await import("@/actions/tasks");
          await removeTaskDependency(null, fd);
        }}
        className="text-body-sm text-error hover:underline"
      >
        Remove
      </button>
    </form>
  );
}

function ChecklistToggle({ item, taskId }: { item: ChecklistRow; taskId: string }) {
  return (
    <form>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="task_id" value={taskId} />
      <button
        type="submit"
        formAction={async (fd: FormData) => {
          await toggleChecklistItem(null, fd);
        }}
        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
          item.is_completed
            ? "border-success bg-success text-white"
            : "border-hairline hover:border-muted"
        }`}
      >
        {item.is_completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </form>
  );
}

function DeleteChecklistItem({ itemId, taskId }: { itemId: string; taskId: string }) {
  return (
    <form className="opacity-0 group-hover:opacity-100 transition-opacity">
      <input type="hidden" name="id" value={itemId} />
      <input type="hidden" name="task_id" value={taskId} />
      <button
        type="submit"
        formAction={async (fd: FormData) => {
          await deleteChecklistItem(null, fd);
        }}
        className="text-caption text-error hover:underline"
      >
        Delete
      </button>
    </form>
  );
}

function MoveSubtaskButton({ parentTaskId, subtaskId, direction, disabled }: {
  parentTaskId: string; subtaskId: string; direction: "up" | "down"; disabled?: boolean;
}) {
  const { formAction, isPending } = useQueuedFormAction(null, moveSubtask);
  const label = direction === "up" ? "Move up" : "Move down";

  return (
    <form action={formAction} className="flex">
      <input type="hidden" name="parent_task_id" value={parentTaskId} />
      <input type="hidden" name="subtask_id" value={subtaskId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled || isPending}
        aria-label={label}
        title={label}
        className="flex h-6 w-6 items-center justify-center rounded border border-hairline text-muted transition-colors hover:border-muted hover:text-body-strong disabled:pointer-events-none disabled:opacity-30"
      >
        {direction === "up" ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 8V2M5 2L2 5M5 2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 2v6m0 0l3-3M5 8L2 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </form>
  );
}

function TagsCard({ taskId, tags, taskTags, canUpdate }: {
  taskId: string; tags: TagRow[]; taskTags: TagRow[]; canUpdate: boolean;
}) {
  const { formAction, isPending, state } = useQueuedFormAction(null, updateTaskTags);

  return (
    <Card>
      <CardHeader><CardTitle>Tags ({taskTags.length})</CardTitle></CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <p className="text-body-sm text-muted-soft py-4 text-center">
            No tags defined yet. Create them in Dashboard &rarr; Tags.
          </p>
        ) : canUpdate ? (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="task_id" value={taskId} />
            <TagSelector
              tags={tags}
              defaultSelected={taskTags.map((tag) => tag.id)}
              name="tags"
              label="Assign tags"
              hint="Toggle the tags that describe this task."
            />
            {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
            {state?.success && <p className="text-body-sm text-success">{state.success}</p>}
            <div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Tags"}
              </Button>
            </div>
          </form>
        ) : taskTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {taskTags.map((tag) => (
              <TagChip key={tag.id} label={tag.name} color={tag.color} />
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-muted-soft">No tags assigned.</p>
        )}
      </CardContent>
    </Card>
  );
}

function AddChecklistItem({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createChecklistItem, null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Item</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Add Checklist Item</CardTitle>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-body-strong text-lg leading-none">
                &times;
              </button>
            </CardHeader>
            <CardContent>
              {state?.success ? (
                <div className="space-y-4">
                  <p className="text-body-sm text-success">{state.success}</p>
                  <Button onClick={() => setOpen(false)} variant="secondary" className="w-full">Done</Button>
                </div>
              ) : (
                <form action={formAction} className="flex flex-col gap-4">
                  <input type="hidden" name="task_id" value={taskId} />
                  <FormField label="Title" name="title" required placeholder="e.g. Review wireframes" />
                  {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                    <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Adding..." : "Add"}</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
