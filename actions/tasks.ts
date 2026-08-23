"use server";

import { TasksService } from "@/features/tasks";
import { requirePermission } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTask(_prevState: unknown, formData: FormData) {
  await requirePermission("tasks.create");

  try {
    await TasksService.create({
      project_id: formData.get("project_id") as string,
      parent_task_id: (formData.get("parent_task_id") as string) || null,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      status: (formData.get("status") as string) || "Pending",
      priority: (formData.get("priority") as string) || "Medium",
      estimated_hours: parseFloat(formData.get("estimated_hours") as string) || 0,
      completion_percentage: 0,
      position: 0,
      weight: 1,
      task_type: "Feature",
    } as Parameters<typeof TasksService.create>[0]);
    revalidatePath("/dashboard/projects/[id]/tasks", "layout");
    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: "Task created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create task." };
  }
}

export async function updateTask(_prevState: unknown, formData: FormData) {
  await requirePermission("tasks.update");

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing task ID." };
  try {
    await TasksService.update(id, {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      status: formData.get("status") as string,
      priority: formData.get("priority") as string,
      assigned_to: (formData.get("assigned_to") as string) || null,
      estimated_hours: formData.get("estimated_hours")
        ? parseFloat(formData.get("estimated_hours") as string)
        : undefined,
      completion_percentage: formData.get("completion_percentage")
        ? parseFloat(formData.get("completion_percentage") as string)
        : undefined,
      estimated_start: (formData.get("estimated_start") as string) || null,
      estimated_end: (formData.get("estimated_end") as string) || null,
    });
    revalidatePath("/dashboard/projects/[id]/tasks", "layout");
    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: "Task updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update." };
  }
}

export async function createSubtask(_prevState: unknown, formData: FormData) {
  await requirePermission("tasks.create");

  try {
    const parentTaskId = formData.get("parent_task_id") as string;
    if (!parentTaskId) return { error: "Parent task ID is required." };

    await TasksService.create({
      project_id: formData.get("project_id") as string,
      parent_task_id: parentTaskId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      status: (formData.get("status") as string) || "Pending",
      priority: (formData.get("priority") as string) || "Medium",
      estimated_hours: parseFloat(formData.get("estimated_hours") as string) || 0,
      completion_percentage: 0,
      position: 0,
      weight: 1,
      task_type: "Feature",
    } as Parameters<typeof TasksService.create>[0]);
    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: "Subtask created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create subtask." };
  }
}

export async function toggleTaskCompletion(_prevState: unknown, formData: FormData) {
  await requirePermission("tasks.update");

  const id = formData.get("id") as string;
  const completed = formData.get("completed") === "true";
  try {
    await TasksService.update(id, {
      status: completed ? "Completed" : "In Progress",
      completion_percentage: completed ? 100 : 0,
    });
    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: completed ? "Task completed." : "Task reopened." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update." };
  }
}

export async function addTaskDependency(_prevState: unknown, formData: FormData) {
  await requirePermission("tasks.update");

  try {
    const taskId = formData.get("task_id") as string;
    const dependsOnTaskId = formData.get("depends_on_task_id") as string;
    const dependencyType = (formData.get("dependency_type") as string) || "Finish to Start";

    if (!taskId || !dependsOnTaskId) {
      return { error: "Both tasks are required." };
    }

    await TasksService.addDependency(taskId, dependsOnTaskId, dependencyType);
    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: "Dependency added." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add dependency." };
  }
}

export async function removeTaskDependency(_prevState: unknown, formData: FormData) {
  await requirePermission("tasks.update");

  try {
    const dependencyId = formData.get("dependency_id") as string;
    if (!dependencyId) return { error: "Dependency ID is required." };

    await TasksService.removeDependency(dependencyId);
    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: "Dependency removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove dependency." };
  }
}
