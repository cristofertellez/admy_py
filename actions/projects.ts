"use server";

import { ProjectsService } from "@/features/projects";
import { assertProjectStatusTransition } from "@/features/projects/project-status";
import { TagsService } from "@/features/tags";
import { isValidCatalogValue } from "@/features/settings";
import { PROJECT_STATUSES, PRIORITIES } from "@/constants";
import { notifyProjectCompleted, notifyProjectCreated, notifyProjectStatusChanged, notifyProjectUpdated } from "@/features/notifications";
import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import {
  projectSchema,
  projectUpdateSchema,
  assignProjectMembersSchema,
  PROJECT_AUDIT_FIELDS,
} from "@/schemas";
import { revalidatePath } from "next/cache";
import type { Project } from "@/types";
import type { z } from "zod";

type ActionState = { success?: string; error?: string };

function firstFieldError(error: z.ZodError): string {
  return Object.values(error.flatten().fieldErrors).flat()[0] || "Invalid data.";
}

function parseProjectForm<T extends z.ZodTypeAny>(schema: T, formData: FormData) {
  return schema.safeParse({
    name: formData.get("name") ?? undefined,
    code: formData.get("code") ?? undefined,
    description: formData.get("description") ?? undefined,
    client_id: formData.get("client_id") ?? undefined,
    intermediary_id: formData.get("intermediary_id") ?? undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    estimated_start_date: formData.get("estimated_start_date") ?? undefined,
    estimated_end_date: formData.get("estimated_end_date") ?? undefined,
    estimated_hours: formData.get("estimated_hours") ?? undefined,
    tags: formData.getAll("tags"),
  });
}

export async function createProject(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("projects.create");

const parsed = parseProjectForm(projectSchema, formData);
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (
    !(await isValidCatalogValue("project_statuses", parsed.data.status, Object.values(PROJECT_STATUSES))) ||
    !(await isValidCatalogValue("project_priorities", parsed.data.priority, Object.values(PRIORITIES)))
  ) {
    return { error: "Invalid status or priority." };
  }

  try {
    const created = await ProjectsService.create({
      ...parsed.data,
      visibility: "Internal",
      worked_hours: 0,
      completion_percentage: 0,
      budget: null,
      notes: null,
      real_start_date: null,
      real_end_date: null,
      deleted_at: null,
      is_active: true,
      created_by: actor.id,
      updated_by: actor.id,
    });

    // Tag assignments are part of the creation payload (Historia 6.10).
    if (parsed.data.tags.length > 0) {
      await TagsService.setProjectTags(created.id, parsed.data.tags);
    }

    // Historia 13.2 — project creation reaches the project audience.
    await notifyProjectCreated({ projectId: created.id, actorId: actor.id });

    await ActivityService.log({
      user_id: actor.id,
      action: "created_project",
      entity: "Project",
      entity_id: created.id,
      new_value: {
        name: created.name,
        client_name: created.clients?.company_name ?? null,
        status: created.status,
        priority: created.priority,
        estimated_hours: created.estimated_hours,
      },
    });

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/clients/${created.client_id}`);
    revalidatePath("/dashboard");
    return { success: "Project created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create project." };
  }
}

export async function updateProject(_prevState: unknown, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing project ID." };

const parsed = parseProjectForm(projectUpdateSchema, formData);
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  if (
    !(await isValidCatalogValue("project_statuses", parsed.data.status, Object.values(PROJECT_STATUSES))) ||
    !(await isValidCatalogValue("project_priorities", parsed.data.priority, Object.values(PRIORITIES)))
  ) {
    return { error: "Invalid status or priority." };
  }

  try {
    // getById enforces data-layer visibility and provides the previous values
    // for the audit diff and the status transition check.
    const previous = await ProjectsService.getById(id);
    const next = parsed.data;

    const statusChanged = previous.status !== next.status;
    if (statusChanged) {
      assertProjectStatusTransition(previous.status, next.status);
    }

    // Edits, date changes and estimate changes are audited field by field
    // (Historia 6.17); the status change gets its own dedicated event.
    const changedFields = PROJECT_AUDIT_FIELDS.filter(
      (field) => previous[field] !== next[field],
    );

    // Tag set changes are detected against the persisted assignments
    // (Historia 6.10) and audited with their own event below.
    const previousTags = await TagsService.listByProject(id);
    const previousTagIds = previousTags.map((tag) => tag.id);
    const tagsChanged =
      previousTagIds.length !== next.tags.length ||
      [...next.tags].sort().join(",") !== [...previousTagIds].sort().join(",");

    if (!statusChanged && changedFields.length === 0 && !tagsChanged) {
      return { success: "No changes to save." };
    }

    await ProjectsService.update(id, {
      ...(Object.fromEntries(changedFields.map((field) => [field, next[field]])) as Partial<Project>),
      status: next.status,
      updated_by: actor.id,
    });

    if (statusChanged) {
      await ActivityService.log({
        user_id: actor.id,
        action: "changed_project_status",
        entity: "Project",
        entity_id: id,
        old_value: { status: previous.status },
        new_value: { status: next.status },
      });
    }

    if (changedFields.length > 0) {
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_project",
        entity: "Project",
        entity_id: id,
        old_value: Object.fromEntries(changedFields.map((field) => [field, previous[field]])),
        new_value: Object.fromEntries(changedFields.map((field) => [field, next[field]])),
      });
    }

    if (tagsChanged) {
      const nextTags = await TagsService.setProjectTags(id, next.tags);
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_project_tags",
        entity: "Project",
        entity_id: id,
        old_value: { tags: previousTags.map((tag) => tag.name) },
        new_value: { tags: nextTags.map((tag) => tag.name) },
      });
    }

    if (previous.status !== "Completed" && next.status === "Completed") {
      await notifyProjectCompleted({ projectId: id, actorId: actor.id });
    } else if (statusChanged) {
      await notifyProjectStatusChanged({
        projectId: id,
        actorId: actor.id,
        from: previous.status,
        to: next.status,
      });
    } else {
      await notifyProjectUpdated({ projectId: id, actorId: actor.id });
    }

    revalidatePath("/dashboard/projects");
    revalidatePath(`/dashboard/projects/${id}`);
    revalidatePath("/dashboard");
    return { success: "Project updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update project." };
  }
}

export async function bulkToggleProjectsActive(
  ids: string[],
  isActive: boolean,
): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: "No projects selected." };
  }

  let succeeded = 0;
  try {
    for (const id of ids) {
      try {
        if (isActive) {
          await ProjectsService.restore(id);
        } else {
          await ProjectsService.archive(id);
        }
      } catch (err) {
        // The archive dependency rule (open tasks/milestones) stops the batch
        // with a friendly message; already-processed projects stay consistent.
        const reason = err instanceof Error ? err.message : "Failed to update project.";
        const processed = succeeded > 0 ? `${succeeded} processed before stopping. ` : "";
        return { error: `${processed}${reason}` };
      }

      await ActivityService.log({
        user_id: actor.id,
        action: isActive ? "restored_project" : "archived_project",
        entity: "Project",
        entity_id: id,
        old_value: { is_active: !isActive },
        new_value: { is_active: isActive },
      });
      succeeded += 1;
    }

    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard");
    return {
      success: `${succeeded} ${succeeded === 1 ? "project" : "projects"} ${isActive ? "restored" : "archived"}.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update projects." };
  }
}

// Historia 6.7 — Asignación de Responsables. Multi-select assignment of active
// Developers and Intermediaries; duplicates are skipped without failing.
export async function assignProjectMembers(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  const userIds = formData.getAll("user_ids").filter((value): value is string => typeof value === "string");
  const parsed = assignProjectMembersSchema.safeParse({
    project_id: formData.get("project_id") ?? undefined,
    user_ids: userIds,
  });
  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  try {
    const assigned = await ProjectsService.assignMembers(
      parsed.data.project_id,
      parsed.data.user_ids,
      actor.id,
    );

    if (assigned.length === 0) {
      return { success: "Those members are already assigned." };
    }

    await ActivityService.log({
      user_id: actor.id,
      action: "assigned_project_member",
      entity: "Project",
      entity_id: parsed.data.project_id,
      new_value: {
        members: assigned.map((member) => `${member.first_name} ${member.last_name}`),
        roles: assigned.map((member) => member.role),
      },
    });

    revalidatePath(`/dashboard/projects/${parsed.data.project_id}`);
    revalidatePath("/dashboard");
    return {
      success: `${assigned.length} ${assigned.length === 1 ? "member" : "members"} assigned.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to assign members." };
  }
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<ActionState> {
  const actor = await requirePermission("projects.update");

  try {
    const removed = await ProjectsService.removeMember(projectId, userId);

    if (removed) {
      await ActivityService.log({
        user_id: actor.id,
        action: "removed_project_member",
        entity: "Project",
        entity_id: projectId,
        old_value: { member: removed.name },
      });
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: "Member removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove member." };
  }
}
