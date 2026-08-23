"use client";

import { updateMyPreferences } from "@/actions/preferences";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms/form-select";
import { LANGUAGE_OPTIONS, THEME_OPTIONS, TIMEZONE_OPTIONS } from "@/constants";
import { useActionState, useMemo } from "react";

interface PreferencesFormProps {
  initialPreferences: {
    language: string;
    timezone: string;
    theme: string;
  };
}

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const [state, formAction, isPending] = useActionState(updateMyPreferences, null);

  const timezoneOptions = useMemo(() => {
    if (TIMEZONE_OPTIONS.some((option) => option.value === initialPreferences.timezone)) {
      return [...TIMEZONE_OPTIONS];
    }
    return [
      ...TIMEZONE_OPTIONS,
      { value: initialPreferences.timezone, label: initialPreferences.timezone },
    ];
  }, [initialPreferences.timezone]);

  return (
    <>
      {state?.success && (
        <p className="mb-4 rounded-md bg-success/10 px-4 py-3 text-body-sm text-success">
          {state.success}
        </p>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <FormSelect
          label="Language"
          name="language"
          defaultValue={initialPreferences.language}
          options={[...LANGUAGE_OPTIONS]}
          hint="More languages will be available soon."
        />
        <FormSelect
          label="Timezone"
          name="timezone"
          defaultValue={initialPreferences.timezone}
          options={timezoneOptions}
        />
        <FormSelect
          label="Theme"
          name="theme"
          defaultValue={initialPreferences.theme}
          options={[...THEME_OPTIONS]}
          hint="Additional themes will be available soon."
        />
        {state?.error && (
          <p className="text-body-sm text-error" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </form>
    </>
  );
}
