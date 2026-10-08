import { auth } from "@/auth";
import { queryOne } from "@/lib/turso/client";
import { redirect } from "next/navigation";
import { cache } from "react";

// Historia 6.18 — Permisos del módulo de proyectos por rol.
// Developer: acceso completo. Administrator: gestión completa (módulos
// operativos; la configuración del sistema queda en Developer/Super
// Administrator). Super Administrator: acceso total.
const PERMISSION_HIERARCHY: Record<string, string[]> = {
  Developer: ["projects.*", "clients.*", "tasks.*", "comments.*", "files.*", "reports.*", "settings.*", "intermediaries.*", "users.*", "roles.*", "time-entries.*"],
  "Super Administrator": ["projects.*", "clients.*", "tasks.*", "comments.*", "files.*", "reports.*", "settings.*", "intermediaries.*", "users.*", "roles.*", "time-entries.*"],
  Administrator: ["projects.*", "clients.*", "tasks.*", "comments.*", "files.*", "reports.*", "intermediaries.*", "time-entries.*"],
  Client: ["projects.read", "tasks.read", "comments.create", "comments.read", "files.download", "reports.view"],
  Intermediary: ["projects.read", "clients.read", "tasks.read", "comments.create", "comments.read", "files.upload", "files.download", "reports.view", "reports.export"],
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
  theme: string | null;
  created_at: string;
}

export const getUser = cache(async (): Promise<SessionProfile | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const profile = await queryOne<SessionProfile>(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar,
            u.role_id, r.name AS role, u.last_login, u.timezone, u.language, u.theme, u.created_at
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND u.deleted_at IS NULL AND u.is_active = 1
     LIMIT 1`,
    [session.user.id],
  );

  return profile ?? null;
});

export async function requireAuth(): Promise<SessionProfile> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export function hasPermission(user: SessionProfile, permission: string): boolean {
  const allowed = PERMISSION_HIERARCHY[user.role as string] || [];

  return allowed.some((p) => {
    if (p.endsWith(".*")) {
      const module = p.replace(".*", "");
      return permission.startsWith(module);
    }
    return p === permission;
  });
}

export async function requirePermission(permission: string): Promise<SessionProfile> {
  const user = await requireAuth();

  if (!hasPermission(user, permission)) {
    redirect("/unauthorized");
  }

  return user;
}
