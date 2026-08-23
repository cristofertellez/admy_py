"use server";

import { query, newId } from "@/lib/turso/client";
import { requirePermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createMilestone(_prevState: unknown, formData: FormData) {
  await requirePermission("projects.update");

  try {
    await query(
      `INSERT INTO milestones (id, project_id, title, description, estimated_date, status, sort_order)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [
        newId(),
        formData.get("project_id") as string,
        formData.get("title") as string,
        (formData.get("description") as string) || null,
        (formData.get("estimated_date") as string) || null,
        parseInt(formData.get("sort_order") as string) || 0,
      ],
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create milestone." };
  }

  revalidatePath("/dashboard/projects/[id]/milestones", "layout");
  revalidatePath("/dashboard/projects/[id]", "layout");
  return { success: "Milestone created." };
}

export async function updateMilestone(_prevState: unknown, formData: FormData) {
  await requirePermission("projects.update");

  const id = formData.get("id") as string;

  try {
    await query(
      `UPDATE milestones
       SET title = ?, description = ?, estimated_date = ?, status = ?, completion_percentage = ?, updated_at = ?
       WHERE id = ?`,
      [
        formData.get("title") as string,
        (formData.get("description") as string) || null,
        (formData.get("estimated_date") as string) || null,
        formData.get("status") as string,
        parseFloat(formData.get("completion_percentage") as string) || 0,
        new Date().toISOString(),
        id,
      ],
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update milestone." };
  }

  revalidatePath("/dashboard/projects/[id]/milestones", "layout");
  revalidatePath("/dashboard/projects/[id]", "layout");
  return { success: "Milestone updated." };
}
