"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { TemplatesService } from "@/features/templates";
import { templateSchema, type TemplateInput } from "@/schemas/template";
import { ActivityService } from "@/services/activity.service";

interface TemplateActionResult {
  success?: string;
  error?: string;
}

export async function createTemplate(input: TemplateInput): Promise<TemplateActionResult> {
  const user = await requirePermission("settings.update");

  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid template data." };
  }

  const template = await TemplatesService.create(parsed.data, user.id);

  await ActivityService.log({
    user_id: user.id,
    action: "created_template",
    entity: "Template",
    entity_id: template?.id,
    new_value: { name: parsed.data.name, entity_type: parsed.data.entity_type },
  });

  revalidatePath("/dashboard/templates");
  return { success: "Template created." };
}

export async function updateTemplate(
  id: string,
  input: TemplateInput,
): Promise<TemplateActionResult> {
  const user = await requirePermission("settings.update");

  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid template data." };
  }

  await TemplatesService.update(id, parsed.data);

  await ActivityService.log({
    user_id: user.id,
    action: "updated_template",
    entity: "Template",
    entity_id: id,
    new_value: { name: parsed.data.name, entity_type: parsed.data.entity_type },
  });

  revalidatePath("/dashboard/templates");
  return { success: "Template updated." };
}

export async function deleteTemplate(id: string): Promise<TemplateActionResult> {
  const user = await requirePermission("settings.update");

  await TemplatesService.remove(id);

  await ActivityService.log({
    user_id: user.id,
    action: "deleted_template",
    entity: "Template",
    entity_id: id,
  });

  revalidatePath("/dashboard/templates");
  return { success: "Template deleted." };
}