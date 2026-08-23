"use client";

import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { useActionState } from "react";

interface ProfileInfoFormProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export function ProfileInfoForm({ firstName, lastName, email, phone }: ProfileInfoFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.success && (
        <p className="rounded-md bg-success/10 px-4 py-3 text-body-sm text-success">
          {state.success}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="First Name"
          name="first_name"
          defaultValue={firstName}
          placeholder="John"
          required
          autoComplete="given-name"
        />
        <FormField
          label="Last Name"
          name="last_name"
          defaultValue={lastName}
          placeholder="Doe"
          required
          autoComplete="family-name"
        />
      </div>
      <FormField
        label="Email"
        name="email"
        type="email"
        defaultValue={email}
        disabled
        hint="Contact an administrator to change your email."
      />
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={phone ?? undefined}
        placeholder="+1 (555) 000-0000"
        autoComplete="tel"
      />
      {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
