"use server";

import { ProjectsService } from "@/features/projects";
import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { revalidatePath } from "next/cache";

export async function createProject(_prevState: unknown, formData: FormData) {
  const actor = await requirePermission("projects.create");

  try {
    const created = await ProjectsService.create({
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      client_id: formData.get("client_id") as string,
      status: (formData.get("status") as string) || "Proposed",
      priority: (formData.get("priority") as string) || "Medium",
      estimated_start_date: formData.get("estimated_start_date") as string || null,
      estimated_end_date: formData.get("estimated_end_date") as string || null,
      estimated_hours: parseFloat(formData.get("estimated_hours") as string) || 0,
      visibility: "Internal",
    } as Parameters<typeof ProjectsService.create>[0]);

    await ActivityService.log({
      user_id: actor.id,
      action: "created_project",
      entity: "Project",
      entity_id: created.id,
      new_value: { name: created.name, client_id: created.client_id, status: created.status },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/clients/${created.client_id}`);
    return { success: "Project created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create project." };
  }
}

export async function updateProject(_prevState: unknown, formData: FormData) {
  await requirePermission("projects.update");

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing project ID." };

  try {
    await ProjectsService.update(id, {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      status: formData.get("status") as string,
      priority: formData.get("priority") as string,
      estimated_start_date: formData.get("estimated_start_date") as string || null,
      estimated_end_date: formData.get("estimated_end_date") as string || null,
    } as Partial<Parameters<typeof ProjectsService.update>[1]>);
    revalidatePath("/dashboard/projects");
    return { success: "Project updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update." };
  }
}

export async function archiveProject(id: string) {
  await requirePermission("projects.update");

  try {
    await ProjectsService.archive(id);
    revalidatePath("/dashboard/projects");
  } catch {
    throw new Error("Failed to archive.");
  }
}
