"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { FormField, FormSelect, FormTextarea } from "@/components/forms";
import { createMilestone, updateMilestone } from "@/actions/milestones";
import { useActionState } from "react";

interface MilestoneFormValues {
  id: string;
  title: string;
  description: string | null;
  status: string;
  estimated_date: string | null;
  completion_percentage: number;
}

interface MilestoneFormModalProps {
  projectId?: string;
  item?: MilestoneFormValues;
  statusOptions: { value: string; label: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

// Historia 8.2/8.3 — single create/edit form modal reused by the milestones
// page and the project overview tab, so the flow cannot diverge.
export function MilestoneFormModal({ projectId, item, statusOptions, onClose, onSuccess }: MilestoneFormModalProps) {
  const action = item ? updateMilestone : createMilestone;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label={item ? "Edit milestone" : "Add milestone"}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{item ? "Edit" : "Add"} Milestone</CardTitle>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-body-strong text-lg leading-none">✕</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-body-sm text-success" role="status">{state.success}</p>
              <Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              {item && <input type="hidden" name="id" value={item.id} />}
              {projectId && <input type="hidden" name="project_id" value={projectId} />}
              <FormField label="Title" name="title" defaultValue={item?.title} required maxLength={200} />
              <FormTextarea label="Description" name="description" defaultValue={item?.description || ""} />
              <FormSelect label="Status" name="status" options={statusOptions} defaultValue={item?.status || "Pending"} />
              <FormField label="Target Date" name="estimated_date" type="date" defaultValue={item?.estimated_date || ""} />
              {item && (
                <FormField
                  label="Progress (%)"
                  name="completion_percentage"
                  type="number"
                  defaultValue={String(item.completion_percentage ?? 0)}
                />
              )}
              {state?.error && <p className="text-body-sm text-error" role="alert">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Saving..." : item ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
