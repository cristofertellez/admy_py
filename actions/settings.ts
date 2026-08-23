"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { SettingsService } from "@/features/settings";

export async function getSettings() {
  await requirePermission("settings.read");
  return SettingsService.getAll();
}

export async function updateSetting(key: string, value: Record<string, unknown>, description?: string) {
  await requirePermission("settings.update");
  const result = await SettingsService.set(key, value, description);
  revalidatePath("/dashboard/settings");
  return result;
}
