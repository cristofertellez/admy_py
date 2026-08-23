import { requirePermission } from "@/lib/auth";
import { query } from "@/lib/turso/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { SettingsForm } from "./settings-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePermission("settings.read");

  const settings = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings ORDER BY key",
  );

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Settings</h1>
        <p className="mt-1 text-body-sm text-muted">
          Configure platform-wide settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm initialValues={settingsMap} />
        </CardContent>
      </Card>
    </div>
  );
}
