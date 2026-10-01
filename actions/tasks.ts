"use server";

import { TasksService } from "@/features/tasks";
import { assertTaskStatusTransition } from "@/features/tasks/task-status";
import { isValidCatalogValue } from "@/features/settings";
import { TASK_STATUSES, PRIORITIES } from "@/constants";
import { notifyTaskCreated } from "@/features/notifications";
import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { taskSchema, taskUpdateSchema, bulkUpdateTaskStatusSchema, TASK_AUDIT_FIELDS } from "@/schemas";
import { revalidatePath } from "next/cache";
import type { Task } from "@/types";
import type { z } from "zod";

type ActionState = { success?: string; error?: string };

function firstFieldError(error: z.ZodError): string {
  return Object.values(error.flatten().fieldErrors).flat()[0] || "Invalid data.";
}

// Guards status/priority against the configured catalogs (Historia 15.15).
async function assertTaskCatalogStatusPriority(status: string, priority: string): Promise<boolean> {
  return (
    (await isValidCatalogValue("task_statuses", status, Object.values(TASK_STATUSES))) &&
    (await isValidCatalogValue("task_priorities", priority, Object.values(PRIORITIES)))
  );
}

function parseTaskForm<T extends z.ZodTypeAny>(schema: T, formData: FormData) {
  const completionPercentage = formData.get("completion_percentage");
  return schema.safeParse({
    project_id: formData.get("project_id") ?? undefined,
    parent_task_id: formData.get("parent_task_id") || undefined,
    title: formData.get("title") ?? undefined,
    description: formData.get("description") || undefined,
    assigned_to: formData.get("assigned_to") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    estimated_hours: formData.get("estimated_hours") ?? undefined,
    estimated_start: formData.get("estimated_start") || undefined,
    estimated_end: formData.get("estimated_end") || undefined,
    ...(typeof completionPercentage === "string" && completionPercentage
      ? { completion_percentage: completionPercentage }
      : {}),
  });
}

export async function createTask(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("tasks.create");

  const parsed = parseTaskForm(taskSchema, formData);
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (!(await assertTaskCatalogStatusPriority(parsed.data.status, parsed.data.priority))) {
    return { error: "Invalid status or priority." };
  }

  try {
    const created = await TasksService.create({
      ...parsed.data,
      milestone_id: null,
      worked_hours: 0,
      real_start: null,
      real_end: null,
      completion_percentage: 0,
      position: 0,
      weight: 1,
      task_type: "Feature",
      deleted_at: null,
      is_active: true,
      created_by: actor.id,
      updated_by: actor.id,
    });

    await notifyTaskCreated(created.id, actor.id);

    await ActivityService.log({
      user_id: actor.id,
      action: "created_task",
      entity: "Task",
      entity_id: created.id,
      new_value: {
        title: created.title,
        project_id: created.project_id,
        status: created.status,
        priority: created.priority,
        assigned_to: created.assigned_to,
        estimated_hours: created.estimated_hours,
      },
    });

    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/projects/${created.project_id}`);
    revalidatePath("/dashboard");
    return { success: "Task created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create task." };
  }
}

export async function updateTask(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("tasks.update");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing task ID." };

  const parsed = parseTaskForm(taskUpdateSchema, formData);
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (!(await assertTaskCatalogStatusPriority(parsed.data.status, parsed.data.priority))) {
    return { error: "Invalid status or priority." };
  }

  try {
    // getById enforces data-layer visibility and provides the previous values
    // for the audit diff and the status transition check (Historias 7.3/7.5).
    const previous = await TasksService.getById(id);
    const next = parsed.data;

    const statusChanged = previous.status !== next.status;
    if (statusChanged) {
      assertTaskStatusTransition(previous.status, next.status);
    }

    // Edits are audited field by field; the status change gets its own
    // dedicated event so the history shows the workflow transitions.
    const changedFields = TASK_AUDIT_FIELDS.filter((field) => previous[field] !== next[field]);
    const progressChanged =
      next.completion_percentage !== undefined &&
      next.completion_percentage !== previous.completion_percentage;

    if (!statusChanged && changedFields.length === 0 && !progressChanged) {
      return { success: "No changes to save." };
    }

    await TasksService.update(id, {
      ...(Object.fromEntries(changedFields.map((field) => [field, next[field]])) as Partial<Task>),
      ...(statusChanged ? { status: next.status } : {}),
      ...(progressChanged ? { completion_percentage: next.completion_percentage } : {}),
      updated_by: actor.id,
    });

    if (statusChanged) {
      await ActivityService.log({
        user_id: actor.id,
        action: "changed_task_status",
        entity: "Task",
        entity_id: id,
        old_value: { status: previous.status },
        new_value: { status: next.status },
      });
    }

    if (changedFields.length > 0) {
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_task",
        entity: "Task",
        entity_id: id,
        old_value: Object.fromEntries(changedFields.map((field) => [field, previous[field]])),
        new_value: Object.fromEntries(changedFields.map((field) => [field, next[field]])),
      });
    }

    if (progressChanged) {
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_task_progress",
        entity: "Task",
        entity_id: id,
        old_value: { completion_percentage: previous.completion_percentage },
        new_value: { completion_percentage: next.completion_percentage },
      });
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/tasks/${id}`);
    revalidatePath(`/dashboard/projects/${previous.project_id}`);
    revalidatePath("/dashboard");
    return { success: "Task updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update task." };
  }
}

export async function createSubtask(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("tasks.create");

  const parsed = parseTaskForm(taskSchema, formData);
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (!(await assertTaskCatalogStatusPriority(parsed.data.status, parsed.data.priority))) {
    return { error: "Invalid status or priority." };
  }

  try {
    const parentTaskId = parsed.data.parent_task_id;
    if (!parentTaskId) return { error: "Parent task ID is required." };

    const created = await TasksService.create({
      ...parsed.data,
      milestone_id: null,
      worked_hours: 0,
      real_start: null,
      real_end: null,
      completion_percentage: 0,
      position: 0,
      weight: 1,
      task_type: "Feature",
      deleted_at: null,
      is_active: true,
      created_by: actor.id,
      updated_by: actor.id,
    });

    await notifyTaskCreated(created.id, actor.id);

    // Recorded on the parent so its change history includes subtask activity.
    await ActivityService.log({
      user_id: actor.id,
      action: "created_subtask",
      entity: "Task",
      entity_id: parentTaskId,
      new_value: { title: created.title },
    });

    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/tasks/${parentTaskId}`);
    revalidatePath(`/dashboard/projects/${created.project_id}`);
    revalidatePath("/dashboard");
    return { success: "Subtask created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create subtask." };
  }
}

export async function toggleTaskCompletion(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("tasks.update");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing task ID." };
  const completed = formData.get("completed") === "true";

  try {
    const previous = await TasksService.getById(id);
    const nextStatus = completed ? "Completed" : "In Progress";
    if (previous.status !== nextStatus) {
      assertTaskStatusTransition(previous.status, nextStatus);
    }

    await TasksService.update(id, {
      status: nextStatus,
      completion_percentage: completed ? 100 : 0,
      updated_by: actor.id,
    });

    if (previous.status !== nextStatus) {
      await ActivityService.log({
        user_id: actor.id,
        action: "changed_task_status",
        entity: "Task",
        entity_id: id,
        old_value: { status: previous.status },
        new_value: { status: nextStatus },
      });
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/tasks/${id}`);
    revalidatePath("/dashboard");
    return { success: completed ? "Task completed." : "Task reopened." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update task." };
  }
}

// Historia 7.7 (UI) — Reordenamiento de subtareas: swap con el vecino
// inmediato; la numeración completa se recalcula en el servicio.
export async function moveSubtask(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("tasks.update");

  const parentTaskId = formData.get("parent_task_id");
  const subtaskId = formData.get("subtask_id");
  const direction = formData.get("direction");
  if (typeof parentTaskId !== "string" || !parentTaskId || typeof subtaskId !== "string" || !subtaskId) {
    return { error: "Parent task and subtask are required." };
  }
  if (direction !== "up" && direction !== "down") {
    return { error: "Invalid move direction." };
  }

  try {
    await TasksService.moveSubtask(parentTaskId, subtaskId, direction);

    await ActivityService.log({
      user_id: actor.id,
      action: "moved_subtask",
      entity: "Task",
      entity_id: parentTaskId,
      new_value: { subtask_id: subtaskId, direction },
    });

    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/tasks/${parentTaskId}`);
    revalidatePath("/dashboard");
    return { success: "Subtask reordered." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reorder subtask." };
  }
}

// Historia 7.4 — Eliminar / Archivar Tarea. Logical delete with restore;
// every transition is audited so archived tasks remain traceable.
export async function toggleTaskActive(id: string, isActive: boolean): Promise<ActionState> {
  const actor = await requirePermission("tasks.delete");

  try {
    if (isActive) {
      await TasksService.restore(id);
      await ActivityService.log({
        user_id: actor.id,
        action: "restored_task",
        entity: "Task",
        entity_id: id,
        new_value: { is_active: true },
      });
    } else {
      await TasksService.archive(id);
      await ActivityService.log({
        user_id: actor.id,
        action: "archived_task",
        entity: "Task",
        entity_id: id,
        old_value: { is_active: true },
        new_value: { is_active: false },
      });
    }
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/projects/[id]/tasks", "layout");
    revalidatePath("/dashboard");
    return { success: isActive ? "Task restored." : "Task archived." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update task." };
  }
}

// Historia 7.1 — Acciones masivas: aplica un cambio de estado a un lote de
// tareas. Visibility and status transitions are re-validated per task at the
// data layer; each task gets its own audit event so the batch stays traceable.
export async function bulkUpdateTaskStatus(ids: string[], status: string): Promise<ActionState> {
  const actor = await requirePermission("tasks.update");

  const parsed = bulkUpdateTaskStatusSchema.safeParse({ ids, status });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (!(await isValidCatalogValue("task_statuses", status, Object.values(TASK_STATUSES)))) {
    return { error: "Invalid status." };
  }

  let succeeded = 0;
  for (const id of parsed.data.ids) {
    let previousStatus: string | null = null;
    try {
      const previous = await TasksService.getById(id);
      previousStatus = previous.status;
      if (previousStatus !== status) {
        assertTaskStatusTransition(previousStatus, status);
        await TasksService.update(id, { status, updated_by: actor.id });
      }
    } catch (err) {
      // An invalid transition or an out-of-scope task stops the batch with a
      // friendly message; already-processed tasks stay consistent.
      const reason = err instanceof Error ? err.message : "Failed to update task.";
      const processed = succeeded > 0 ? `${succeeded} processed before stopping. ` : "";
      return { error: `${processed}${reason}` };
    }

    if (previousStatus !== status) {
      await ActivityService.log({
        user_id: actor.id,
        action: "changed_task_status",
        entity: "Task",
        entity_id: id,
        old_value: { status: previousStatus },
        new_value: { status },
      });
    }
    succeeded += 1;
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/projects/[id]/tasks", "layout");
  revalidatePath("/dashboard");
  return {
    success: `${succeeded} ${succeeded === 1 ? "task" : "tasks"} updated.`,
  };
}

export async function addTaskDependency(_prevState: unknown, formData: FormData): Promise<ActionState> {
  await requirePermission("tasks.update");

  try {
    const taskId = formData.get("task_id");
    const dependsOnTaskId = formData.get("depends_on_task_id");
    const dependencyType = (formData.get("dependency_type") as string) || "Finish to Start";

    if (typeof taskId !== "string" || !taskId || typeof dependsOnTaskId !== "string" || !dependsOnTaskId) {
      return { error: "Both tasks are required." };
    }

    await TasksService.addDependency(taskId, dependsOnTaskId, dependencyType);
    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: "Dependency added." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add dependency." };
  }
}

export async function removeTaskDependency(_prevState: unknown, formData: FormData): Promise<ActionState> {
  await requirePermission("tasks.update");

  try {
    const dependencyId = formData.get("dependency_id");
    if (typeof dependencyId !== "string" || !dependencyId) return { error: "Dependency ID is required." };

    const taskId = await TasksService.removeDependency(dependencyId);
    if (taskId) revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: "Dependency removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove dependency." };
  }
}
