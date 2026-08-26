"use server";

import { ClientsService } from "@/features/clients";
import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { clientSchema, type ClientInput } from "@/schemas";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_name: formData.get("contact_name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
    website: formData.get("website") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

function firstFieldError(error: z.ZodError): string {
  return Object.values(error.flatten().fieldErrors).flat()[0] || "Invalid data.";
}

function clientTextFields(data: ClientInput) {
  return {
    company_name: data.company_name,
    contact_name: data.contact_name || null,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    country: data.country || null,
    city: data.city || null,
    website: data.website || null,
    notes: data.notes || null,
  };
}

export async function createClient(_prevState: unknown, formData: FormData) {
  const actor = await requirePermission("clients.create");

  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { error: firstFieldError(parsed.error) };
  }

  try {
    const created = await ClientsService.create({
      ...clientTextFields(parsed.data),
      logo: null,
      status: parsed.data.status,
      intermediary_id: parsed.data.intermediary_id ?? null,
      deleted_at: null,
      is_active: true,
      created_by: actor?.id ?? null,
      updated_by: actor?.id ?? null,
    });

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: "created_client",
        entity: "Client",
        entity_id: created.id,
        new_value: {
          company_name: created.company_name,
          contact_name: created.contact_name,
          email: created.email,
          phone: created.phone,
          status: created.status,
        },
      });
    }

    revalidatePath("/dashboard/clients");
    return { success: "Client created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create client." };
  }
}

export async function updateClient(_prevState: unknown, formData: FormData) {
  const actor = await requirePermission("clients.update");

  const id = formData.get("id");
  const parsed = parseClientForm(formData);

  if (!parsed.success || typeof id !== "string" || !id) {
    return { error: parsed.success ? "Invalid client." : firstFieldError(parsed.error) };
  }

  try {
    // getById runs the data-layer visibility check and provides the previous values for the audit diff.
    const previous = await ClientsService.getById(id);
    const next = clientTextFields(parsed.data);

    // Status and intermediary assignment are managed by dedicated flows (archive/restore, assignment).
    await ClientsService.update(id, { ...next, updated_by: actor?.id ?? null });

    if (actor) {
      const changedFields = (Object.keys(next) as Array<keyof typeof next>).filter(
        (field) => previous[field] !== next[field],
      );

      if (changedFields.length > 0) {
        await ActivityService.log({
          user_id: actor.id,
          action: "updated_client",
          entity: "Client",
          entity_id: id,
          old_value: Object.fromEntries(changedFields.map((field) => [field, previous[field]])),
          new_value: Object.fromEntries(changedFields.map((field) => [field, next[field]])),
        });
      }
    }

    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${id}`);
    return { success: "Client updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update client." };
  }
}

export async function toggleClientActive(id: string, isActive: boolean) {
  const actor = await requirePermission("clients.update");

  try {
    if (isActive) {
      await ClientsService.restore(id);
      await ActivityService.log({
        user_id: actor.id,
        action: "restored_client",
        entity: "Client",
        entity_id: id,
        new_value: { is_active: true },
      });
    } else {
      await ClientsService.archive(id);
      await ActivityService.log({
        user_id: actor.id,
        action: "archived_client",
        entity: "Client",
        entity_id: id,
        old_value: { is_active: true },
        new_value: { is_active: false },
      });
    }
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: isActive ? "Client restored." : "Client archived." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update client." };
  }
}

export async function assignClientIntermediary(_prevState: unknown, formData: FormData) {
  const actor = await requirePermission("clients.update");

  const clientId = formData.get("client_id");
  const intermediaryId = formData.get("intermediary_id");

  if (typeof clientId !== "string" || !clientId || typeof intermediaryId !== "string" || !intermediaryId) {
    return { error: "Client and intermediary are required." };
  }

  try {
    const intermediaryName = await ClientsService.assignIntermediary(clientId, intermediaryId);

    await ActivityService.log({
      user_id: actor.id,
      action: "assigned_intermediary",
      entity: "Client",
      entity_id: clientId,
      new_value: { intermediary_id: intermediaryId, intermediary_name: intermediaryName },
    });

    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard");
    return { success: "Intermediary assigned." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to assign intermediary." };
  }
}

export async function removeClientIntermediary(clientId: string) {
  const actor = await requirePermission("clients.update");

  try {
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

    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath("/dashboard");
    return { success: "Intermediary removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove intermediary." };
  }
}
