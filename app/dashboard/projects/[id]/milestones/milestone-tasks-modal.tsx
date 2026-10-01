"use client";

import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { assignTaskToMilestone, removeTaskFromMilestone } from "@/actions/milestones";
import type { MilestoneProjectTask } from "@/features/milestones";
import { useActionState } from "react";

type ActionState = { success?: string; error?: string } | null;

function AssignForm({ taskId, milestoneId }: { taskId: string; milestoneId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(assignTaskToMilestone, null);

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="milestone_id" value={milestoneId} />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Assigning..." : "Assign"}
      </Button>
      {state?.error && (
        <p className="text-caption text-error" role="alert">{state.error}</p>
      )}
    </form>
  );
}

function RemoveForm({ taskId }: { taskId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(removeTaskFromMilestone, null);

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="task_id" value={taskId} />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Removing..." : "Remove"}
      </Button>
      {state?.error && (
        <p className="text-caption text-error" role="alert">{state.error}</p>
      )}
    </form>
  );
}

interface MilestoneTasksModalProps {
  milestone: { id: string; title: string };
  tasks: MilestoneProjectTask[];
  canManageTasks: boolean;
  onClose: () => void;
}

// Historia 8.5 — Asignación de tareas: link project tasks to the milestone or
// detach them; moving between milestones is just reassigning the link.
export function MilestoneTasksModal({ milestone, tasks, canManageTasks, onClose }: MilestoneTasksModalProps) {
  const assigned = tasks.filter((task) => task.milestone_id === milestone.id);
  const available = tasks.filter((task) => task.milestone_id !== milestone.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Tasks for ${milestone.title}`}
    >
      <Card className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Tasks — {milestone.title}</CardTitle>
          <button onClick={onClose} aria-label="Close" className="text-lg leading-none text-muted hover:text-body-strong">✕</button>
        </CardHeader>
        <CardContent className="flex-1 space-y-6 overflow-y-auto">
          <section aria-label="Assigned tasks">
            <h3 className="mb-2 text-body-strong">Assigned ({assigned.length})</h3>
            {assigned.length === 0 ? (
              <p className="text-body-sm text-muted-soft">No tasks linked to this milestone.</p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {assigned.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0">
                    <span className="truncate text-body-sm font-medium text-body-strong">{task.title}</span>
                    <Badge variant={task.status === "Completed" ? "success" : "default"}>{task.status}</Badge>
                    {canManageTasks && (
                      <span className="ml-auto"><RemoveForm taskId={task.id} /></span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Other project tasks">
            <h3 className="mb-2 text-body-strong">Other project tasks ({available.length})</h3>
            {available.length === 0 ? (
              <p className="text-body-sm text-muted-soft">No remaining tasks in this project.</p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {available.map((task) => (
                  <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0">
                    <span className="truncate text-body-sm font-medium text-body-strong">{task.title}</span>
                    {task.milestone_title && (
                      <span className="truncate text-caption text-muted">in {task.milestone_title}</span>
                    )}
                    {canManageTasks && (
                      <span className="ml-auto">
                        <AssignForm taskId={task.id} milestoneId={milestone.id} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!canManageTasks && (
            <p className="text-caption text-muted">You need task permissions to change assignments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
