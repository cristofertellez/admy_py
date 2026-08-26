"use client";

import { createTimeEntry, deleteTimeEntry } from "@/actions/time-entries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { FormField, FormTextarea } from "@/components/forms";
import { useQueuedFormAction } from "@/hooks/use-queued-form-action";
import { TaskTimer } from "./task-timer";

// Shape returned by TimeEntriesService.listByTask (rows include the author
// columns joined as `users`).
export interface TimeEntryRow {
  id: string;
  task_id: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  total_hours: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  users: { first_name: string; last_name: string } | null;
}

interface Props {
  taskId: string;
  entries: TimeEntryRow[];
  canCreate: boolean;
  canDelete: boolean;
}

function todayLocalDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatAuthor(entry: TimeEntryRow): string {
  if (!entry.users) return "Unknown";
  return `${entry.users.first_name} ${entry.users.last_name}`.trim() || "Unknown";
}

// Manual time registration and per-task history (Historia 7.11). The timer
// (Historia 7.12) lives inside this card because both produce time entries.
export function TimeTracking({ taskId, entries, canCreate, canDelete }: Props) {
  const { formAction, isPending, state } = useQueuedFormAction(null, createTimeEntry);
  const { formAction: deleteAction, isPending: isDeleting } = useQueuedFormAction(
    null,
    deleteTimeEntry,
  );

  const totalHours = entries.reduce((sum, entry) => sum + entry.total_hours, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Time Tracking</CardTitle>
          <span className="text-body-sm text-muted">
            Total logged: <span className="font-semibold text-body-strong">{totalHours.toFixed(2)}h</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {canCreate && <TaskTimer taskId={taskId} />}

        {canCreate && (
          <form action={formAction} className="flex flex-col gap-4 border-b border-hairline-soft pb-6">
            <input type="hidden" name="task_id" value={taskId} />
            <div className="grid gap-4 sm:grid-cols-4">
              <FormField label="Date" name="date" type="date" defaultValue={todayLocalDate()} required />
              <FormField label="Start (optional)" name="start_time" type="time" />
              <FormField label="End (optional)" name="end_time" type="time" />
              <FormField
                label="Hours"
                name="total_hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                placeholder="e.g. 1.5"
                required
              />
            </div>
            <FormTextarea label="Description (optional)" name="description" rows={2} />
            {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
            {state?.success && <p className="text-body-sm text-success">{state.success}</p>}
            <div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Log Time"}
              </Button>
            </div>
          </form>
        )}

        {entries.length === 0 ? (
          <p className="text-body-sm text-muted-soft py-4 text-center">
            No time logged yet.{canCreate ? " Use the timer or log hours manually." : ""}
          </p>
        ) : (
          <div className="divide-y divide-hairline-soft">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-body-sm font-medium text-body-strong">{entry.date}</span>
                    <span className="rounded bg-surface-card-elevated px-2 py-0.5 text-caption font-semibold text-body-strong tabular-nums">
                      {entry.total_hours.toFixed(2)}h
                    </span>
                    {entry.start_time && entry.end_time && (
                      <span className="text-caption text-muted tabular-nums">
                        {entry.start_time} – {entry.end_time}
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="mt-1 text-body-sm text-body">{entry.description}</p>
                  )}
                  <p className="mt-0.5 text-caption text-muted">by {formatAuthor(entry)}</p>
                </div>
                {canDelete && (
                  <form action={deleteAction} className="shrink-0">
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="task_id" value={taskId} />
                    <button
                      type="submit"
                      disabled={isDeleting}
                      className="text-caption text-error hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
