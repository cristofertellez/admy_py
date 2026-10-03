"use client";

import { useActionState, useState } from "react";
import { updateNotificationPreferences } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { FormSelect } from "@/components/forms/form-select";
import type { NotificationPreferences } from "@/features/notifications";

interface NotificationPreferencesCardProps {
  preferences: NotificationPreferences;
  typeLabels: Record<string, string>;
}

export function NotificationPreferencesCard({
  preferences,
  typeLabels,
}: NotificationPreferencesCardProps) {
  const [state, formAction, isPending] = useActionState(updateNotificationPreferences, null);
  const [showEvents, setShowEvents] = useState(preferences.event_types !== null);

  const allTypes = Object.entries(typeLabels);
  const enabledTypes = new Set(preferences.event_types ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <p className="mt-1 text-body-sm text-muted">
          Choose how and when you want to be notified. In-app is always recommended.
        </p>
      </CardHeader>
      <CardContent>
        {state?.success && (
          <p className="mb-4 rounded-md bg-success/10 px-4 py-3 text-body-sm text-success" role="status">
            {state.success}
          </p>
        )}
        {state?.error && (
          <p className="mb-4 text-body-sm text-error" role="alert">
            {state.error}
          </p>
        )}

        <form action={formAction} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-body-sm font-medium text-body-strong">Channels</legend>
            <label className="flex items-center gap-2 text-body-sm text-body-strong">
              <input
                type="checkbox"
                name="in_app_enabled"
                defaultChecked={preferences.in_app_enabled}
                className="h-4 w-4 rounded border-hairline"
              />
              In-app notifications
            </label>
            <label className="flex items-center gap-2 text-body-sm text-body-strong">
              <input
                type="checkbox"
                name="email_enabled"
                defaultChecked={preferences.email_enabled}
                className="h-4 w-4 rounded border-hairline"
              />
              E-mail notifications
            </label>
            <label className="flex items-center gap-2 text-body-sm text-body-strong">
              <input
                type="checkbox"
                name="push_enabled"
                defaultChecked={preferences.push_enabled}
                className="h-4 w-4 rounded border-hairline"
              />
              Push notifications (coming soon)
            </label>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormSelect
              label="E-mail frequency"
              name="email_frequency"
              defaultValue={preferences.email_frequency}
              options={[
                { value: "instant", label: "Instant" },
                { value: "daily", label: "Daily digest" },
                { value: "weekly", label: "Weekly digest" },
              ]}
            />
            <div>
              <label htmlFor="quiet-hours-start" className="mb-1.5 block text-body-sm font-medium text-body-strong">
                Quiet hours start
              </label>
              <input
                id="quiet-hours-start"
                type="time"
                name="quiet_hours_start"
                defaultValue={preferences.quiet_hours_start ?? ""}
                className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="quiet-hours-end" className="mb-1.5 block text-body-sm font-medium text-body-strong">
                Quiet hours end
              </label>
              <input
                id="quiet-hours-end"
                type="time"
                name="quiet_hours_end"
                defaultValue={preferences.quiet_hours_end ?? ""}
                className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-body-sm font-medium text-body-strong">Event types</legend>
            <label className="flex items-center gap-2 text-body-sm text-muted">
              <input
                type="checkbox"
                checked={!showEvents}
                onChange={(e) => setShowEvents(!e.target.checked)}
                className="h-4 w-4 rounded border-hairline"
              />
              All events (recommended)
            </label>
            {showEvents && (
              <div className="grid grid-cols-1 gap-2 rounded-md border border-hairline p-3 sm:grid-cols-2 lg:grid-cols-3">
                {allTypes.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-body-sm text-body-strong">
                    <input
                      type="checkbox"
                      name="event_types"
                      value={value}
                      defaultChecked={enabledTypes.size === 0 || enabledTypes.has(value as never)}
                      className="h-4 w-4 rounded border-hairline"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
