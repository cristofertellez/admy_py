// System roles with unrestricted data visibility (Historia 6.18).
// Developer = full access; Administrator = complete management;
// Super Administrator = total access. Client/Intermediary are scoped
// stakeholders and must go through lib/auth-scope filters.
export const FULL_ACCESS_ROLES = [
  "Developer",
  "Administrator",
  "Super Administrator",
] as const;

export function hasFullAccess(role?: string | null): boolean {
  return !!role && (FULL_ACCESS_ROLES as readonly string[]).includes(role);
}
