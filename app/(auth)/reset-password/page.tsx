"use client";

import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { useActionState } from "react";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField
            label="New Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
          <FormField
            label="Confirm Password"
            name="confirm_password"
            type="password"
            placeholder="••••••••"
            required
          />
          {state?.error && (
            <p className="text-body-sm text-error">{state.error}</p>
          )}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
