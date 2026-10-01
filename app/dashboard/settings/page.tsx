import { requirePermission } from "@/lib/auth";
import { SettingsService } from "@/features/settings";
import { SETTING_CATEGORIES, getSettingDefault } from "@/features/settings/settings.definition";
import { SettingsPanel } from "./settings-panel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePermission("settings.read");

  const stored = await SettingsService.getMap();

  const initialValues: Record<string, unknown> = {};
  for (const category of SETTING_CATEGORIES) {
    for (const setting of category.settings) {
      initialValues[setting.key] =
        stored[setting.key] !== undefined ? stored[setting.key] : getSettingDefault(setting.key);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Settings</h1>
        <p className="mt-1 text-body-sm text-muted">
          Configure platform-wide settings, preferences and catalogs.
        </p>
      </div>

      <SettingsPanel initialValues={initialValues} />
    </div>
  );
}