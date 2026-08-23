"use client";

import { forgotPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { useActionState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
      </CardHeader>
      <CardContent>
        {state?.success ? (
          <div>
            <p className="text-body-sm text-success">{state.success}</p>
            <Link href="/login" className="mt-4 inline-block text-body-sm text-primary hover:underline">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
            {state?.error && (
              <p className="text-body-sm text-error">{state.error}</p>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Sending..." : "Send Reset Link"}
            </Button>
            <p className="text-center text-body-sm text-muted">
              <Link href="/login" className="text-primary hover:underline">
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
