import { auth } from "@/auth";
import { queryOne } from "@/lib/turso/client";
import { redirect } from "next/navigation";

const PERMISSION_HIERARCHY: Record<string, string[]> = {
  Developer: ["projects.*", "clients.*", "tasks.*", "comments.*", "files.*", "reports.*", "settings.*", "intermediaries.*"],
  Client: ["projects.read", "tasks.read", "comments.create", "comments.read", "files.download"],
  Intermediary: ["projects.read", "clients.read", "tasks.read", "comments.create", "comments.read", "files.download", "reports.view"],
};

export interface SessionProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role_id: string;
  role: string;
  last_login: string | null;
  timezone: string | null;
  language: string | null;
  created_at: string;
}

export async function getUser(): Promise<SessionProfile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const profile = await queryOne<SessionProfile>(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar,
            u.role_id, r.name AS role, u.last_login, u.timezone, u.language, u.created_at
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND u.deleted_at IS NULL AND u.is_active = 1
     LIMIT 1`,
    [session.user.id],
  );

  return profile ?? null;
}

export async function requireAuth(): Promise<SessionProfile> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: string): Promise<SessionProfile> {
  const user = await requireAuth();
  const roleName = user.role as string;
  const allowed = PERMISSION_HIERARCHY[roleName] || [];

  const hasPermission = allowed.some((p) => {
    if (p.endsWith(".*")) {
      const module = p.replace(".*", "");
      return permission.startsWith(module);
    }
    return p === permission;
  });

  if (!hasPermission) {
    redirect("/unauthorized");
  }

  return user;
}

export async function getCurrentRole(): Promise<string | null> {
  const user = await getUser();
  return user?.role || null;
}
