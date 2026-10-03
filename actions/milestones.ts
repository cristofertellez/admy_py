"use server";

import { MilestonesService } from "@/features/milestones";
import { assertMilestoneStatusTransition } from "@/features/milestones/milestone-status";
import { isValidCatalogValue } from "@/features/settings";
import { MILESTONE_STATUSES } from "@/constants";
import { notifyMilestoneCompleted } from "@/features/notifications";
import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import {
  milestoneSchema,
  milestoneUpdateSchema,
  assignTaskToMilestoneSchema,
  MILESTONE_AUDIT_FIELDS,
} from "@/schemas";
import { revalidatePath } from "next/cache";
import type { Milestone } from "@/types";
import type { z } from "zod";
import { queryOne } from "@/lib/turso/client";

type ActionState = { success?: string; error?: string };

function firstFieldError(error: z.ZodError): string {
  return Object.values(error.flatten().fieldErrors).flat()[0] || "Invalid data.";
}

const MILESTONE_STATUS_FALLBACK = Object.values(MILESTONE_STATUSES) as readonly string[];

function revalidateMilestonePaths(projectId?: string) {
  revalidatePath("/dashboard/projects/[id]/milestones", "layout");
  revalidatePath("/dashboard/projects/[id]", "layout");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`);
}

function parseMilestoneForm<T extends z.ZodTypeAny>(schema: T, formData: FormData) {
  const completionPercentage = formData.get("completion_percentage");
  return schema.safeParse({
    project_id: formData.get("project_id") ?? undefined,
    title: formData.get("title") ?? undefined,
    description: formData.get("description") || undefined,
    estimated_date: formData.get("estimated_date") || undefined,
    status: formData.get("status") || undefined,
    ...(typeof completionPercentage === "string" && completionPercentage
      ? { completion_percentage: completionPercentage }
      : {}),
  });
}

// Historia 8.2 — Crear Hito: shared Zod schema, catalog-guarded status and a
// full audit entry; the milestone is appended at the end of the project plan.
export async function createMilestone(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  const parsed = parseMilestoneForm(milestoneSchema, formData);
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (!(await isValidCatalogValue("milestone_statuses", parsed.data.status, MILESTONE_STATUS_FALLBACK))) {
    return { error: "Invalid milestone status." };
  }

  try {
    const created = await MilestonesService.create({
      ...parsed.data,
      completed_date: null,
      completion_percentage: 0,
      created_by: actor.id,
      updated_by: actor.id,
      deleted_at: null,
      is_active: true,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "created_milestone",
      entity: "Milestone",
      entity_id: created.id,
      new_value: {
        title: created.title,
        project_id: created.project_id,
        status: created.status,
        estimated_date: created.estimated_date,
      },
    });

    revalidateMilestonePaths(created.project_id);
    return { success: "Milestone created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create milestone." };
  }
}

// Historias 8.3 / 8.4 / 8.13 — Editar Hito: field-level audit diff, dedicated
// status event with workflow validation, and automatic completed_date.
export async function updateMilestone(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing milestone ID." };

  const parsed = parseMilestoneForm(milestoneUpdateSchema, formData);
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (!(await isValidCatalogValue("milestone_statuses", parsed.data.status, MILESTONE_STATUS_FALLBACK))) {
    return { error: "Invalid milestone status." };
  }

  try {
    // getById enforces data-layer visibility and provides the previous values
    // for the audit diff and the status transition check.
    const previous = await MilestonesService.getById(id);
    const next = parsed.data;

    const statusChanged = previous.status !== next.status;
    if (statusChanged) {
      assertMilestoneStatusTransition(previous.status, next.status);
    }

    const changedFields = MILESTONE_AUDIT_FIELDS.filter((field) => previous[field] !== next[field]);
    const progressChanged =
      next.completion_percentage !== undefined &&
      next.completion_percentage !== previous.completion_percentage;

    if (!statusChanged && changedFields.length === 0 && !progressChanged) {
      return { success: "No changes to save." };
    }

    // The completion date follows the status workflow automatically.
    const today = new Date().toISOString().slice(0, 10);
    const completedDateUpdate: Partial<Milestone> = statusChanged
      ? next.status === "Completed"
        ? { completed_date: previous.completed_date ?? today }
        : { completed_date: null }
      : {};

    await MilestonesService.update(id, {
      ...(Object.fromEntries(changedFields.map((field) => [field, next[field]])) as Partial<Milestone>),
      ...(statusChanged ? { status: next.status } : {}),
      ...(progressChanged ? { completion_percentage: next.completion_percentage } : {}),
      ...completedDateUpdate,
      updated_by: actor.id,
    });

    if (statusChanged) {
      await ActivityService.log({
        user_id: actor.id,
        action: "changed_milestone_status",
        entity: "Milestone",
        entity_id: id,
        old_value: { status: previous.status },
        new_value: { status: next.status },
      });
      // Historia 13.2 — milestone completion reaches the project audience.
      if (previous.status !== "Completed" && next.status === "Completed") {
        await notifyMilestoneCompleted(id, actor.id);
      }
    }

    if (changedFields.length > 0) {
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_milestone",
        entity: "Milestone",
        entity_id: id,
        old_value: Object.fromEntries(changedFields.map((field) => [field, previous[field]])),
        new_value: Object.fromEntries(changedFields.map((field) => [field, next[field]])),
      });
    }

    if (progressChanged) {
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_milestone_progress",
        entity: "Milestone",
        entity_id: id,
        old_value: { completion_percentage: previous.completion_percentage },
        new_value: { completion_percentage: next.completion_percentage },
      });
    }

    revalidateMilestonePaths(previous.project_id);
    return { success: "Milestone updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update milestone." };
  }
}

// Historia 8.13 — Eliminación lógica del hito, con restauración y auditoría.
export async function toggleMilestoneActive(id: string, isActive: boolean): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  try {
    const milestone = await MilestonesService.getById(id);

    if (isActive) {
      await MilestonesService.restore(id);
      await ActivityService.log({
        user_id: actor.id,
        action: "restored_milestone",
        entity: "Milestone",
        entity_id: id,
        new_value: { is_active: true },
      });
    } else {
      await MilestonesService.archive(id);
      await ActivityService.log({
        user_id: actor.id,
        action: "archived_milestone",
        entity: "Milestone",
        entity_id: id,
        old_value: { is_active: true },
        new_value: { is_active: false },
      });
    }

    revalidateMilestonePaths(milestone.project_id);
    return { success: isActive ? "Milestone restored." : "Milestone archived." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update milestone." };
  }
}

// Historia 8.1 — Ordenamiento: swap con el vecino inmediato; la numeración
// completa se recalcula en el servicio.
export async function moveMilestone(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  const projectId = formData.get("project_id");
  const milestoneId = formData.get("milestone_id");
  const direction = formData.get("direction");
  if (typeof projectId !== "string" || !projectId || typeof milestoneId !== "string" || !milestoneId) {
    return { error: "Project and milestone are required." };
  }
  if (direction !== "up" && direction !== "down") {
    return { error: "Invalid move direction." };
  }

  try {
    await MilestonesService.moveMilestone(projectId, milestoneId, direction);

    await ActivityService.log({
      user_id: actor.id,
      action: "moved_milestone",
      entity: "Milestone",
      entity_id: milestoneId,
      new_value: { direction },
    });

    revalidateMilestonePaths(projectId);
    return { success: "Milestone reordered." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reorder milestone." };
  }
}

// Historia 8.5 — Asignar / mover una tarea al hito.
export async function assignTaskToMilestone(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("tasks.update");

  const parsed = assignTaskToMilestoneSchema.safeParse({
    milestone_id: formData.get("milestone_id") ?? undefined,
    task_id: formData.get("task_id") ?? undefined,
  });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  try {
    const milestone = await MilestonesService.getById(parsed.data.milestone_id);

    await MilestonesService.assignTaskToMilestone(parsed.data.milestone_id, parsed.data.task_id);

    const task = await queryOne<{ title: string }>(
      "SELECT title FROM tasks WHERE id = ? AND deleted_at IS NULL",
      [parsed.data.task_id],
    );

    await ActivityService.log({
      user_id: actor.id,
      action: "assigned_task_to_milestone",
      entity: "Milestone",
      entity_id: parsed.data.milestone_id,
      new_value: { task_id: parsed.data.task_id, title: task?.title ?? null },
    });

    revalidateMilestonePaths(milestone.project_id);
    return { success: "Task assigned to milestone." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to assign task." };
  }
}

// Historia 8.5 — Quitar una tarea del hito.
export async function removeTaskFromMilestone(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("tasks.update");

  const taskId = formData.get("task_id");
  if (typeof taskId !== "string" || !taskId) return { error: "Task is required." };

  try {
    const milestoneId = await MilestonesService.removeTaskFromMilestone(taskId);
    if (!milestoneId) return { success: "No changes to save." };

    const milestone = await MilestonesService.getById(milestoneId);

    const task = await queryOne<{ title: string }>(
      "SELECT title FROM tasks WHERE id = ? AND deleted_at IS NULL",
      [taskId],
    );

    await ActivityService.log({
      user_id: actor.id,
      action: "removed_task_from_milestone",
      entity: "Milestone",
      entity_id: milestoneId,
      new_value: { task_id: taskId, title: task?.title ?? null },
    });

    revalidateMilestonePaths(milestone.project_id);
    return { success: "Task removed from milestone." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove task." };
  }
}

// Historia 8.8 — Dependencias entre hitos (predecesor / relacionado), con
// validación de ciclos en la capa de servicio y auditoría por hito.
export async function addMilestoneDependency(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  try {
    const milestoneId = formData.get("milestone_id");
    const dependsOnMilestoneId = formData.get("depends_on_milestone_id");
    const dependencyType = (formData.get("dependency_type") as string) || "Finish to Start";

    if (typeof milestoneId !== "string" || !milestoneId || typeof dependsOnMilestoneId !== "string" || !dependsOnMilestoneId) {
      return { error: "Both milestones are required." };
    }

    await MilestonesService.addMilestoneDependency(milestoneId, dependsOnMilestoneId, dependencyType);

    await ActivityService.log({
      user_id: actor.id,
      action: "added_milestone_dependency",
      entity: "Milestone",
      entity_id: milestoneId,
      new_value: { depends_on_milestone_id: dependsOnMilestoneId, dependency_type: dependencyType },
    });

    revalidatePath(`/dashboard/projects/[id]/milestones`, "layout");
    return { success: "Milestone dependency added." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add milestone dependency." };
  }
}

export async function removeMilestoneDependency(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  try {
    const dependencyId = formData.get("dependency_id");
    if (typeof dependencyId !== "string" || !dependencyId) return { error: "Dependency ID is required." };

    const milestoneId = await MilestonesService.removeMilestoneDependency(dependencyId);
    if (milestoneId) {
      await ActivityService.log({
        user_id: actor.id,
        action: "removed_milestone_dependency",
        entity: "Milestone",
        entity_id: milestoneId,
        new_value: { dependency_id: dependencyId },
      });
      revalidatePath(`/dashboard/projects/[id]/milestones`, "layout");
    }
    return { success: "Milestone dependency removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove milestone dependency." };
  }
}
