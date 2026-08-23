import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { queryOne } from "@/lib/turso/client";
import { verifyPassword } from "@/lib/auth/password";

interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
  is_active: number;
  role_name: string;
  first_name: string;
  last_name: string;
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
          `SELECT u.id, u.email, u.password_hash, u.is_active, u.first_name, u.last_name, r.name AS role_name
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE lower(u.email) = lower(?) AND u.deleted_at IS NULL
           LIMIT 1`,
          [email],
        );

        if (!user || user.is_active !== 1) return null;
        if (!verifyPassword(password, user.password_hash)) return null;

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
