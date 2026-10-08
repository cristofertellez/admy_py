"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { SettingsService } from "@/features/settings";
import { settingsCategorySchema, validateSettingValue, type SettingsUpdateResult } from "@/schemas/settings";
import { ActivityService } from "@/services/activity.service";
import {
  getCategoryDefaults,
  type SettingCategoryId,
} from "@/features/settings/settings.definition";

export async function updateSettings(
  categoryId: SettingCategoryId,
  values: Record<string, unknown>,
): Promise<SettingsUpdateResult> {
  const user = await requirePermission("settings.update");

  const parsed = settingsCategorySchema(categoryId).safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  const data = parsed.data as Record<string, unknown>;
  await SettingsService.setMany(Object.entries(data).map(([key, value]) => ({ key, value })));

  await ActivityService.log({
    user_id: user.id,
    action: "updated_settings",
    entity: "Settings",
    entity_id: categoryId,
    new_value: data,
  });

  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Settings saved successfully." };
}

export async function exportSettings(): Promise<Record<string, unknown>> {
  const user = await requirePermission("settings.read");
  const data = await SettingsService.getMap();

  await ActivityService.log({
    user_id: user.id,
    action: "exported_settings",
    entity: "Settings",
  });

  return data;
}

export async function importSettings(payload: unknown): Promise<SettingsUpdateResult> {
  const user = await requirePermission("settings.update");

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, message: "Invalid backup data." };
  }

  const entries: { key: string; value: unknown }[] = [];
  for (const [key, value] of Object.entries(payload)) {
    const result = validateSettingValue(key, value);
    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    entries.push({ key, value: result.value });
  }

  await SettingsService.setMany(entries);

  await ActivityService.log({
    user_id: user.id,
    action: "imported_settings",
    entity: "Settings",
    new_value: payload as Record<string, unknown>,
  });

  revalidatePath("/dashboard/settings");
  return { ok: true, message: `Imported ${entries.length} settings.` };
}

export async function restoreSettings(categoryId: SettingCategoryId): Promise<SettingsUpdateResult> {
  const user = await requirePermission("settings.update");

  const defaults = getCategoryDefaults(categoryId);
  await SettingsService.setMany(
    Object.entries(defaults).map(([key, value]) => ({ key, value })),
  );

  await ActivityService.log({
    user_id: user.id,
    action: "restored_settings",
    entity: "Settings",
    entity_id: categoryId,
  });

  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Settings restored to defaults." };
}