"use server";

import { revalidatePath } from "next/cache";
import { ChecklistsService } from "@/features/checklists";
import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";

export async function createChecklistItem(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const actor = await requirePermission("tasks.create");

  try {
    const taskId = formData.get("task_id") as string;
    const title = formData.get("title") as string;

    if (!taskId || !title) {
      return { error: "Task ID and title are required." };
    }

    await ChecklistsService.create({
      task_id: taskId,
      title,
      created_by: actor.id,
    });

    // Historia 7.23 — checklist changes are part of the task audit trail.
    await ActivityService.log({
      user_id: actor.id,
      action: "created_checklist_item",
      entity: "Task",
      entity_id: taskId,
      new_value: { title },
    });

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: "Checklist item created." };
  } catch {
    return { error: "Failed to create checklist item." };
  }
}

export async function toggleChecklistItem(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const actor = await requirePermission("tasks.update");

  try {
    const id = formData.get("id") as string;
    const taskId = formData.get("task_id") as string;

    if (!id) {
      return { error: "Checklist item ID is required." };
    }

    const updated = await ChecklistsService.toggle(id);

    await ActivityService.log({
      user_id: actor.id,
      action: "toggled_checklist_item",
      entity: "Task",
      entity_id: taskId || undefined,
      new_value: { checklist_item_id: id, completed: updated?.is_completed ?? null },
    });

    if (taskId) revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: "Checklist item toggled." };
  } catch {
    return { error: "Failed to toggle checklist item." };
  }
}

export async function deleteChecklistItem(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const actor = await requirePermission("tasks.update");

  try {
    const id = formData.get("id") as string;
    const taskId = formData.get("task_id") as string;

    if (!id) {
      return { error: "Checklist item ID is required." };
    }

    await ChecklistsService.delete(id);

    await ActivityService.log({
      user_id: actor.id,
      action: "deleted_checklist_item",
      entity: "Task",
      entity_id: taskId || undefined,
      old_value: { checklist_item_id: id },
    });

    if (taskId) revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: "Checklist item deleted." };
  } catch {
    return { error: "Failed to delete checklist item." };
  }
}
