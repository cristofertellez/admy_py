"use client";

import { changePassword } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { useActionState } from "react";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.success && (
        <p className="rounded-md bg-success/10 px-4 py-3 text-body-sm text-success">
          {state.success}
        </p>
      )}
      <FormField
        label="Current Password"
        name="current_password"
        type="password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="New Password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          hint="At least 6 characters."
          autoComplete="new-password"
        />
        <FormField
          label="Confirm New Password"
          name="confirm_password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}
