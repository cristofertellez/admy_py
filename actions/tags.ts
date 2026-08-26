"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { assertTaskVisible } from "@/lib/auth-scope";
import { TagsService } from "@/features/tags";
import { ActivityService } from "@/services/activity.service";
import { parseTagIds, tagSchema } from "@/schemas";
import type { z } from "zod";

type TagActionState = {
  data?: unknown;
  success?: string;
  error?: string;
};

function firstFieldError(error: z.ZodError): string {
  return Object.values(error.flatten().fieldErrors).flat()[0] || "Invalid data.";
}

function revalidateTagViews() {
  revalidatePath("/dashboard/tags");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
}

export async function getTags() {
  await requirePermission("tasks.read");
  return TagsService.list();
}

export async function createTag(formData: FormData): Promise<TagActionState> {
  const actor = await requirePermission("tasks.create");

  const parsed = tagSchema.safeParse({
    name: formData.get("name") ?? undefined,
    color: formData.get("color") ?? undefined,
  });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  try {
    const tag = await TagsService.create(parsed.data.name, parsed.data.color);

    await ActivityService.log({
      user_id: actor.id,
      action: "created_tag",
      entity: "Tag",
      entity_id: tag.id,
      new_value: { name: tag.name, color: tag.color },
    });

    revalidateTagViews();
    return { data: tag, success: "Tag created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create tag." };
  }
}

export async function updateTag(formData: FormData): Promise<TagActionState> {
  const actor = await requirePermission("tasks.update");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing tag ID." };

  const parsed = tagSchema.safeParse({
    name: formData.get("name") ?? undefined,
    color: formData.get("color") ?? undefined,
  });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  try {
    const previous = await TagsService.getById(id);
    const tag = await TagsService.update(id, parsed.data.name, parsed.data.color);

    await ActivityService.log({
      user_id: actor.id,
      action: "updated_tag",
      entity: "Tag",
      entity_id: id,
      old_value: { name: previous.name, color: previous.color },
      new_value: { name: tag.name, color: tag.color },
    });

    revalidateTagViews();
    return { data: tag, success: "Tag updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update tag." };
  }
}

export async function deleteTag(formData: FormData): Promise<TagActionState> {
  const actor = await requirePermission("tasks.delete");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing tag ID." };

  try {
    // Snapshot before deletion so the audit keeps the removed values; the
    // cascade removes project/task assignments atomically.
    const previous = await TagsService.getById(id);
    await TagsService.remove(id);

    await ActivityService.log({
      user_id: actor.id,
      action: "deleted_tag",
      entity: "Tag",
      entity_id: id,
      old_value: { name: previous.name, color: previous.color },
    });

    revalidateTagViews();
    return { success: "Tag deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete tag." };
  }
}

// Tag assignment for tasks (Historia 7.17). Mirrors the project flow: replace
// the full set transactionally and audit only when something changed.
export async function updateTaskTags(
  _prevState: unknown,
  formData: FormData,
): Promise<{ success?: string; error?: string }> {
  const actor = await requirePermission("tasks.update");

  const taskId = formData.get("task_id");
  if (typeof taskId !== "string" || !taskId) {
    return { error: "Missing task ID." };
  }

  const tagIds = parseTagIds(formData.getAll("tags"));

  try {
    await assertTaskVisible(taskId);

    const previous = await TagsService.listByTask(taskId);
    const previousIds = previous.map((tag) => tag.id);
    const tagsChanged =
      previousIds.length !== tagIds.length ||
      [...previousIds].sort().join(",") !== [...tagIds].sort().join(",");

    if (!tagsChanged) {
      return { success: "No changes to save." };
    }

    const next = await TagsService.setTaskTags(taskId, tagIds);

    await ActivityService.log({
      user_id: actor.id,
      action: "updated_task_tags",
      entity: "Task",
      entity_id: taskId,
      old_value: { tags: previous.map((tag) => tag.name) },
      new_value: { tags: next.map((tag) => tag.name) },
    });

    revalidatePath(`/dashboard/tasks/${taskId}`, "layout");
    revalidatePath("/dashboard");
    return { success: "Task tags updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update task tags." };
  }
}
