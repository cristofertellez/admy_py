export const ADMIN_ONLY_ROUTES = [
  "/dashboard/admin",
  "/dashboard/users",
  "/dashboard/roles",
  "/dashboard/activity",
  "/dashboard/settings",
] as const;

export const ADMIN_ROLES = [
  "Developer",
  "Administrator",
  "Super Administrator",
] as const;

export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canAccessRoute(pathname: string, role?: string): boolean {
  if (!isAdminRoute(pathname)) return true;
  if (!role) return false;
  return (ADMIN_ROLES as readonly string[]).includes(role);
}
