"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { TimeEntriesService } from "@/features/time-entries";
import { ActivityService } from "@/services/activity.service";
import { timeEntrySchema } from "@/schemas";
import type { z } from "zod";

type TimeEntryActionState = { success?: string; error?: string };

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid data.";
}

// Manual time registration (Historia 7.11); also used by the task timer
// finalize step (Historia 7.12).
export async function createTimeEntry(
  _prevState: unknown,
  formData: FormData,
): Promise<TimeEntryActionState> {
  const actor = await requirePermission("time-entries.create");

  const parsed = timeEntrySchema.safeParse({
    task_id: formData.get("task_id") ?? undefined,
    date: formData.get("date") ?? undefined,
    start_time: formData.get("start_time") ?? "",
    end_time: formData.get("end_time") ?? "",
    total_hours: formData.get("total_hours") ?? undefined,
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  try {
    const entry = await TimeEntriesService.create({
      task_id: parsed.data.task_id,
      user_id: actor.id,
      date: parsed.data.date,
      start_time: parsed.data.start_time || undefined,
      end_time: parsed.data.end_time || undefined,
      total_hours: parsed.data.total_hours,
      description: parsed.data.description || undefined,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "created_time_entry",
      entity: "Task",
      entity_id: parsed.data.task_id,
      new_value: {
        entry_id: entry?.id ?? null,
        date: parsed.data.date,
        start_time: parsed.data.start_time || null,
        end_time: parsed.data.end_time || null,
        total_hours: parsed.data.total_hours,
        description: parsed.data.description || null,
      },
    });

    revalidatePath(`/dashboard/tasks/${parsed.data.task_id}`, "layout");
    revalidatePath("/dashboard");
    return { success: "Time logged." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to log time." };
  }
}

export async function deleteTimeEntry(
  _prevState: unknown,
  formData: FormData,
): Promise<TimeEntryActionState> {
  const actor = await requirePermission("time-entries.delete");

  const id = formData.get("id");
  const taskId = formData.get("task_id");
  if (typeof id !== "string" || !id) return { error: "Missing time entry ID." };

  try {
    // Snapshot before deletion so the audit keeps the removed values.
    const previous = await TimeEntriesService.getById(id);
    const previousTaskId =
      typeof taskId === "string" && taskId ? taskId : (previous.task_id as string);

    await TimeEntriesService.remove(id);

    await ActivityService.log({
      user_id: actor.id,
      action: "deleted_time_entry",
      entity: "Task",
      entity_id: previousTaskId,
      old_value: {
        entry_id: id,
        date: previous.date,
        total_hours: previous.total_hours,
        description: previous.description ?? null,
      },
    });

    revalidatePath(`/dashboard/tasks/${previousTaskId}`, "layout");
    revalidatePath("/dashboard");
    return { success: "Time entry deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete time entry." };
  }
}
