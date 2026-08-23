"use server";

import { revalidatePath } from "next/cache";
import { ChecklistsService } from "@/features/checklists";
import { getUser, requirePermission } from "@/lib/auth";

export async function createChecklistItem(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  await requirePermission("tasks.create");

  try {
    const user = await getUser();
    const taskId = formData.get("task_id") as string;
    const title = formData.get("title") as string;

    if (!taskId || !title) {
      return { error: "Task ID and title are required." };
    }

    await ChecklistsService.create({
      task_id: taskId,
      title,
      created_by: user?.id,
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
  await requirePermission("tasks.update");

  try {
    const id = formData.get("id") as string;
    const taskId = formData.get("task_id") as string;

    if (!id) {
      return { error: "Checklist item ID is required." };
    }

    await ChecklistsService.toggle(id);

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: "Checklist item toggled." };
  } catch {
    return { error: "Failed to toggle checklist item." };
  }
}

export async function deleteChecklistItem(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  await requirePermission("tasks.update");

  try {
    const id = formData.get("id") as string;
    const taskId = formData.get("task_id") as string;

    if (!id) {
      return { error: "Checklist item ID is required." };
    }

    await ChecklistsService.delete(id);

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: "Checklist item deleted." };
  } catch {
    return { error: "Failed to delete checklist item." };
  }
}
