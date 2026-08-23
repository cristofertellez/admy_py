"use client";

import { updateProfile } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { useActionState } from "react";

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Profile</h1>
        <p className="mt-1 text-body-sm text-muted">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {state?.success && (
            <p className="mb-4 rounded-md bg-success/10 px-4 py-3 text-body-sm text-success">
              {state.success}
            </p>
          )}
          <form action={formAction} className="flex flex-col gap-4">
            <FormField label="First Name" name="first_name" placeholder="John" required />
            <FormField label="Last Name" name="last_name" placeholder="Doe" required />
            <FormField label="Phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
            {state?.error && (
              <p className="text-body-sm text-error">{state.error}</p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
