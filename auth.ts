import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { queryOne, query } from "@/lib/turso/client";
import { verifyPassword } from "@/lib/auth/password";
import { SettingsService } from "@/features/settings/service";
import { ActivityService } from "@/services/activity.service";

interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
  is_active: number;
  role_name: string;
  first_name: string;
  last_name: string;
  failed_login_attempts: number;
  locked_until: string | null;
}

// Historia 16.13 — brute-force lockout. Settings drive the thresholds;
// failed attempts are counted per user and a temporary lock is enforced
// inside the credentials provider so every client of `signIn` is covered.
// The login action surfaces the friendly message via its own pre-check.
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCK_MINUTES = 15;

async function getLockoutPolicy(): Promise<{ maxAttempts: number; lockMinutes: number }> {
  const [maxAttemptsRaw, lockMinutesRaw] = await Promise.all([
    SettingsService.getValue("login_max_attempts").catch(() => null),
    SettingsService.getValue("auto_lock_minutes").catch(() => null),
  ]);

  return {
    maxAttempts:
      typeof maxAttemptsRaw === "number" && maxAttemptsRaw > 0
        ? Math.floor(maxAttemptsRaw)
        : DEFAULT_MAX_ATTEMPTS,
    lockMinutes:
      typeof lockMinutesRaw === "number" && lockMinutesRaw > 0
        ? Math.floor(lockMinutesRaw)
        : DEFAULT_LOCK_MINUTES,
  };
}

async function registerFailedAttempt(
  user: Pick<AuthUserRow, "id" | "failed_login_attempts">,
  maxAttempts: number,
  lockMinutes: number,
): Promise<void> {
  const attempts = user.failed_login_attempts + 1;
  const now = new Date();

  if (attempts >= maxAttempts) {
    const lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);
    // The counter resets with the lock so the next cycle starts clean.
    await query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = ? WHERE id = ?`,
      [lockedUntil.toISOString(), user.id],
    );
    await ActivityService.log({
      user_id: user.id,
      action: "account_locked",
      entity: "User",
      entity_id: user.id,
      new_value: { locked_until: lockedUntil.toISOString(), attempts },
    }).catch(() => undefined);
    return;
  }

  await query(`UPDATE users SET failed_login_attempts = ? WHERE id = ?`, [attempts, user.id]);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const user = await queryOne<AuthUserRow>(
          `SELECT u.id, u.email, u.password_hash, u.is_active, u.first_name, u.last_name,
                  u.failed_login_attempts, u.locked_until, r.name AS role_name
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE lower(u.email) = lower(?) AND u.deleted_at IS NULL
           LIMIT 1`,
          [email],
        );

        if (!user || user.is_active !== 1) return null;

        // A pending lockout blocks authentication regardless of credentials.
        if (user.locked_until && user.locked_until > new Date().toISOString()) {
          return null;
        }

        if (!verifyPassword(password, user.password_hash)) {
          const policy = await getLockoutPolicy();
          await registerFailedAttempt(user, policy.maxAttempts, policy.lockMinutes);
          return null;
        }

        if (user.failed_login_attempts > 0 || user.locked_until) {
          await query(
            `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`,
            [user.id],
          );
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
          role: user.role_name,
        };
      },
    }),
  ],
});
