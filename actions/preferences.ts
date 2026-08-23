"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { PreferencesService } from "@/features/preferences";
import { ActivityService } from "@/services/activity.service";
import { updatePreferencesSchema } from "@/schemas/preferences";

export async function getMyPreferences() {
  const user = await requireAuth();
  return PreferencesService.get(user.id);
}

function parseDashboardPreferences(raw: FormDataEntryValue | null): { ok: true; value: unknown } | { ok: false } {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: true, value: {} };
  }
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

export async function updateMyPreferences(_prevState: unknown, formData: FormData) {
  const user = await requireAuth();

  const dashboard = parseDashboardPreferences(formData.get("dashboard_preferences"));
  if (!dashboard.ok) {
    return { error: "Invalid dashboard preferences format." };
  }

  const parsed = updatePreferencesSchema.safeParse({
    language: formData.get("language"),
    timezone: formData.get("timezone"),
    theme: formData.get("theme"),
    dashboard_preferences: dashboard.value,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid preferences." };
  }

  const previous = await PreferencesService.get(user.id);
  const updated = await PreferencesService.update(user.id, parsed.data);

  if (JSON.stringify(previous) !== JSON.stringify(updated)) {
    await ActivityService.log({
      user_id: user.id,
      action: "updated_preferences",
      entity: "User",
      entity_id: user.id,
      old_value: {
        language: previous.language,
        timezone: previous.timezone,
        theme: previous.theme,
        dashboard_preferences: previous.dashboard_preferences,
      },
      new_value: {
        language: updated.language,
        timezone: updated.timezone,
        theme: updated.theme,
        dashboard_preferences: updated.dashboard_preferences,
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: "Preferences updated." };
}
