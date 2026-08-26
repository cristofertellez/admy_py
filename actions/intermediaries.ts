"use server";

import { IntermediariesService } from "@/features/intermediaries";
import { ClientsService } from "@/features/clients";
import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { assignClientsToIntermediarySchema, intermediarySchema } from "@/schemas";
import { revalidatePath } from "next/cache";

export async function createIntermediary(_prevState: unknown, formData: FormData) {
  const actor = await requirePermission("intermediaries.create");

  const parsed = intermediarySchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const created = await IntermediariesService.create({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      password: "temppass123",
    });

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: "created_intermediary",
        entity: "User",
        entity_id: created.id,
        new_value: {
          first_name: parsed.data.first_name,
          last_name: parsed.data.last_name,
          email: parsed.data.email,
          role: "Intermediary",
        },
      });
    }

    revalidatePath("/dashboard/intermediaries");
    return { success: "Intermediary created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create." };
  }
}

export async function updateIntermediary(_prevState: unknown, formData: FormData) {
  const actor = await requirePermission("intermediaries.update");

  const id = formData.get("id");

  const parsed = intermediarySchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
  });

  if (!parsed.success || typeof id !== "string" || !id) {
    return { error: parsed.success ? "Invalid intermediary." : Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    // getById validates the intermediary exists and provides the previous values for the audit diff.
    const previous = await IntermediariesService.getById(id);
    const updated = await IntermediariesService.update(id, {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
    });

    const trackedFields = ["first_name", "last_name", "email"] as const;
    const changedFields = trackedFields.filter((field) => {
      const before = String(previous[field] ?? "").trim().toLowerCase();
      const after = String(updated[field] ?? "").trim().toLowerCase();
      return before !== after;
    });

    if (actor && changedFields.length > 0) {
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_intermediary",
        entity: "User",
        entity_id: id,
        old_value: Object.fromEntries(changedFields.map((field) => [field, previous[field]])),
        new_value: Object.fromEntries(changedFields.map((field) => [field, updated[field]])),
      });
    }

    revalidatePath("/dashboard/intermediaries");
    revalidatePath(`/dashboard/intermediaries/${id}`);
    return { success: "Intermediary updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update." };
  }
}

export async function toggleIntermediaryActive(id: string, isActive: boolean) {
  await requirePermission("intermediaries.update");

  try {
    await IntermediariesService.toggleActive(id, isActive);
    revalidatePath("/dashboard/intermediaries");
    return { success: isActive ? "Intermediary activated." : "Intermediary deactivated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update." };
  }
}

export async function assignClientsToIntermediary(_prevState: unknown, formData: FormData) {
  const actor = await requirePermission("clients.update");

  const parsed = assignClientsToIntermediarySchema.safeParse({
    intermediary_id: formData.get("intermediary_id"),
    client_ids: formData.getAll("client_ids").filter((value): value is string => typeof value === "string"),
  });

  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const result = await ClientsService.assignClientsToIntermediary(
      parsed.data.intermediary_id,
      parsed.data.client_ids,
    );

    for (const change of result.changes) {
      await ActivityService.log({
        user_id: actor.id,
        action: "assigned_intermediary",
        entity: "Client",
        entity_id: change.clientId,
        old_value: change.previousIntermediary
          ? {
              intermediary_id: change.previousIntermediary.id,
              intermediary_name: change.previousIntermediary.name,
            }
          : null,
        new_value: {
          intermediary_id: parsed.data.intermediary_id,
          intermediary_name: result.intermediaryName,
        },
      });
    }

    revalidatePath(`/dashboard/intermediaries/${parsed.data.intermediary_id}`);
    for (const change of result.changes) {
      revalidatePath(`/dashboard/clients/${change.clientId}`);
    }
    revalidatePath("/dashboard/clients");

    if (result.assignedCount === 0) {
      return { success: "All selected clients are already assigned to this intermediary." };
    }
    return {
      success: `Assigned ${result.assignedCount} client${result.assignedCount === 1 ? "" : "s"}${
        result.skippedCount > 0 ? ` (${result.skippedCount} already assigned)` : ""
      }.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to assign clients." };
  }
}

export async function removeClientFromIntermediary(intermediaryId: string, clientId: string) {
  const actor = await requirePermission("clients.update");

  if (!intermediaryId || !clientId) {
    return { error: "Intermediary and client are required." };
  }

  try {
    const current = await ClientsService.getAssignedIntermediary(clientId);
    if (current?.id !== intermediaryId) {
      return { error: "This client is not assigned to this intermediary." };
    }

    const removed = await ClientsService.removeIntermediary(clientId);

    if (removed) {
      await ActivityService.log({
        user_id: actor.id,
        action: "removed_intermediary",
        entity: "Client",
        entity_id: clientId,
        old_value: { intermediary_id: removed.id, intermediary_name: removed.name },
        new_value: { intermediary_id: null },
      });
    }

    revalidatePath(`/dashboard/intermediaries/${intermediaryId}`);
    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard/clients");
    return { success: "Client removed from this intermediary." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove client." };
  }
}
