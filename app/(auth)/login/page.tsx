"use client";

import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { useSearchParams } from "next/navigation";
import { useActionState, Suspense } from "react";
import Link from "next/link";

function StatusMessages() {
  const searchParams = useSearchParams();

  return (
    <>
      {searchParams.get("registered") && (
        <p className="mb-4 rounded-md bg-success/10 px-4 py-3 text-body-sm text-success">
          Account created. Please sign in.
        </p>
      )}
      {searchParams.get("reset") && (
        <p className="mb-4 rounded-md bg-success/10 px-4 py-3 text-body-sm text-success">
          Password reset successful. Please sign in.
        </p>
      )}
    </>
  );
}

function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        required
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        placeholder="••••••••"
        required
      />
      {state?.error && (
        <p className="text-body-sm text-error">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense>
          <StatusMessages />
        </Suspense>
        <LoginForm />
        <p className="mt-4 text-center text-body-sm text-muted">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
