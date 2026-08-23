"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import { createHash } from "node:crypto";
import { query, queryOne, newId } from "@/lib/turso/client";
import { hashPassword, generateResetToken } from "@/lib/auth/password";
import { ActivityService } from "@/services/activity.service";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/schemas/auth";
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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
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
  redirect("/dashboard");
}

export async function signup(_prevState: unknown, formData: FormData) {
  const parsed = registerSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] || "Invalid data." };
  }

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1`,
    [parsed.data.email],
  );

  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const role = await queryOne<{ id: string }>(
    `SELECT id FROM roles WHERE name = 'Client' LIMIT 1`,
  );

  if (!role) {
    return { error: "Default role not configured. Contact an administrator." };
  }

  try {
    await query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        parsed.data.first_name,
        parsed.data.last_name,
        parsed.data.email,
        hashPassword(parsed.data.password),
        role.id,
      ],
    );
  } catch (error) {
    console.error("signup failed", error);
    return { error: "Failed to create user." };
  }

  redirect("/login?registered=true");
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

export async function updateProfile(_prevState: unknown, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  const userId = session.user.id;

  const oldProfile = await queryOne<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  }>(
    `SELECT id, first_name, last_name, phone FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const phone = (formData.get("phone") as string) || null;

  await query(
    `UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = ? WHERE id = ?`,
    [firstName, lastName, phone, new Date().toISOString(), userId],
  );

  if (oldProfile) {
    const oldValue = { first_name: oldProfile.first_name, last_name: oldProfile.last_name, phone: oldProfile.phone };
    const newValue = { first_name: firstName, last_name: lastName, phone };

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      await ActivityService.log({
        user_id: oldProfile.id,
        action: "updated_profile",
        entity: "User",
        entity_id: oldProfile.id,
        old_value: oldValue as Record<string, unknown>,
        new_value: newValue as Record<string, unknown>,
      });
    }
  }

  revalidatePath("/dashboard/profile");
  return { success: "Profile updated." };
}
