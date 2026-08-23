"use client";

import { useActionState } from "react";
import { updateSetting } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";

const SETTINGS_FIELDS = [
  { key: "company_name", label: "Company Name", placeholder: "My Company" },
  { key: "company_email", label: "Company Email", type: "email", placeholder: "contact@company.com" },
  { key: "default_language", label: "Default Language", placeholder: "en" },
  { key: "default_timezone", label: "Default Timezone", placeholder: "America/New_York" },
  { key: "date_format", label: "Date Format", placeholder: "MM/DD/YYYY" },
];

interface SettingsFormProps {
  initialValues: Record<string, string>;
}

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(handleSubmit, undefined);

  async function handleSubmit(_prev: unknown, formData: FormData) {
    try {
      for (const field of SETTINGS_FIELDS) {
        const value = formData.get(field.key);
        if (value) {
          try {
            const parsed = JSON.parse(value as string);
            await updateSetting(field.key, typeof parsed === "object" ? parsed : { value: parsed }, field.label);
          } catch {
            await updateSetting(field.key, { value: value as string }, field.label);
          }
        }
      }
      return { success: "Settings saved successfully." };
    } catch {
      return { error: "Failed to save settings. Please try again." };
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {SETTINGS_FIELDS.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          name={field.key}
          type={field.type || "text"}
          placeholder={field.placeholder}
          defaultValue={initialValues[field.key] || ""}
        />
      ))}
      {state && "success" in state && (
        <p className="rounded-md bg-success/10 px-4 py-3 text-body-sm text-success">
          {state.success}
        </p>
      )}
      {state && "error" in state && (
        <p className="text-body-sm text-error">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
