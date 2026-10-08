"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import { createHash } from "node:crypto";
import { query, queryOne, newId } from "@/lib/turso/client";
import { hashPassword, generateResetToken } from "@/lib/auth/password";
import { ActivityService } from "@/services/activity.service";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth";
import { SettingsService } from "@/features/settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function login(_prevState: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  // Historia 16.13 — friendly feedback for locked accounts (the provider
  // rejects them anyway, but with a generic message).
  const lockedUser = await queryOne<{ locked_until: string | null }>(
    "SELECT locked_until FROM users WHERE lower(email) = lower(?) AND deleted_at IS NULL LIMIT 1",
    [parsed.data.email],
  ).catch(() => null);
  if (lockedUser?.locked_until && lockedUser.locked_until > new Date().toISOString()) {
    return {
      error: `Account temporarily locked due to failed attempts. Try again after ${new Date(lockedUser.locked_until).toLocaleTimeString()}.`,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Historia 16.13 — failed sign-in attempts are registered as security
      // events (email only; credentials are never logged).
      const knownUser = await queryOne<{ id: string }>(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [parsed.data.email.toLowerCase()],
      );
      await ActivityService.log({
        user_id: knownUser?.id ?? "00000000-0000-0000-0000-000000000000",
        action: "login_failed",
        entity: "User",
        new_value: { email: parsed.data.email.toLowerCase() },
      }).catch(() => undefined);
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  const session = await auth();

  if (session?.user?.id) {
    const profileId = session.user.id;

    await query(
      `UPDATE users SET last_login = ? WHERE id = ?`,
      [new Date().toISOString(), profileId],
    );

    await ActivityService.log({
      user_id: profileId,
      action: "logged_in",
      entity: "User",
      entity_id: profileId,
    });
  }

  revalidatePath("/", "layout");

  const defaultPage = await SettingsService.getValue("default_page");
  const target = typeof defaultPage === "string" && defaultPage.startsWith("/") ? defaultPage : "/dashboard";
  redirect(target);
}

export async function logout() {
  const session = await auth();

  if (session?.user?.id) {
    const profileId = session.user.id;

    await ActivityService.log({
      user_id: profileId,
      action: "logged_out",
      entity: "User",
      entity_id: profileId,
    });
  }

  await signOut({ redirect: false });
  redirect("/login");
}

export async function forgotPassword(_prevState: unknown, formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Invalid email address." };
  }

  const userProfile = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = lower(?) AND deleted_at IS NULL AND is_active = 1 LIMIT 1`,
    [parsed.data.email],
  );

  if (userProfile) {
    await ActivityService.log({
      user_id: userProfile.id,
      action: "requested_password_reset",
      entity: "User",
      entity_id: userProfile.id,
    });
  }

  let devResetUrl: string | undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (userProfile && process.env.NODE_ENV !== "production") {
    // Email delivery is not configured yet; expose the link in development only.
    const token = generateResetToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

    await query(
      `UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL`,
      [new Date().toISOString(), userProfile.id],
    );
    await query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [newId(), userProfile.id, tokenHash, expiresAt],
    );

    devResetUrl = `${appUrl}/reset-password?token=${token}`;
  }

  return { success: "Check your email for the password reset link.", devResetUrl };
}

export async function resetPassword(_prevState: unknown, formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!parsed.success) {
    return { error: "Passwords do not match or are too short." };
  }

  const token = formData.get("token");
  let userId: string | null = null;

  if (typeof token === "string" && token.length > 0) {
    const resetToken = await queryOne<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [hashToken(token)],
    );

    if (
      !resetToken ||
      resetToken.used_at ||
      new Date(resetToken.expires_at).getTime() < Date.now()
    ) {
      return { error: "This password reset link is invalid or has expired." };
    }

    userId = resetToken.user_id;
  } else {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }

  if (!userId) {
    return { error: "Not authenticated." };
  }

  await query(
    `UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`,
    [hashPassword(parsed.data.password), new Date().toISOString(), userId],
  );

  if (typeof token === "string" && token.length > 0) {
    await query(
      `UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?`,
      [new Date().toISOString(), hashToken(token)],
    );
  }

  await ActivityService.log({
    user_id: userId,
    action: "reset_password",
    entity: "User",
    entity_id: userId,
  });

  redirect("/login?reset=true");
}
