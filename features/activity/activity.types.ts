export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_first_name: string | null;
  user_last_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityLogFilters {
  search?: string;
  userId?: string;
  entity?: string;
  entityId?: string;
  projectId?: string;
  actions?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "action" | "entity";
  sortOrder?: "asc" | "desc";
}

export interface ActivityLogListResult {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivityUserOption {
  id: string;
  first_name: string;
  last_name: string;
}

export type ActivityView = "table" | "timeline";

export function formatActivityUserName(log: Pick<ActivityLog, "user_first_name" | "user_last_name">): string {
  const name = [log.user_first_name, log.user_last_name].filter(Boolean).join(" ").trim();
  return name || "System";
}

export function getActivityUserInitials(log: Pick<ActivityLog, "user_first_name" | "user_last_name">): string {
  return `${log.user_first_name?.charAt(0) ?? ""}${log.user_last_name?.charAt(0) ?? ""}`.toUpperCase() || "?";
}

function parseActivityValue(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

const DETAIL_VALUE_KEYS = [
  "name",
  "title",
  "filename",
  "intermediary_name",
  "company_name",
  "comment_preview",
  "member",
] as const;

// Extracts the audit subject (project name, file, intermediary, etc.) so timeline
// entries identify what was affected instead of showing only the action verb.
export function getActivityEventDetail(log: Pick<ActivityLog, "action" | "old_value" | "new_value">): string | null {
  const newValue = parseActivityValue(log.new_value);
  const oldValue = parseActivityValue(log.old_value);

  // Member assignments store the affected people as a list (Historia 6.7).
  const members = newValue?.members;
  if (Array.isArray(members) && members.length > 0) {
    const names = members.filter((member): member is string => typeof member === "string");
    if (names.length > 0) return names.join(", ");
  }

  for (const key of DETAIL_VALUE_KEYS) {
    const detail = newValue?.[key] ?? oldValue?.[key];
    if (typeof detail === "string" && detail.trim()) return detail;
  }

  // Status workflow events (Historias 6.4 / 7.5) read best as a transition.
  if (typeof oldValue?.status === "string" && typeof newValue?.status === "string") {
    return `${oldValue.status} → ${newValue.status}`;
  }

  if (log.action.startsWith("updated_") && newValue) {
    const fields = Object.keys(newValue);
    if (fields.length > 0) return `Changed: ${fields.join(", ")}`;
  }

  return null;
}

export function getActivityEntityHref(entity: string, entityId: string | null): string | null {
  if (!entityId) return null;
  if (entity === "Project") return `/dashboard/projects/${entityId}`;
  if (entity === "Client") return `/dashboard/clients/${entityId}`;
  if (entity === "Task") return `/dashboard/tasks/${entityId}`;
  return null;
}

// Access-level audit events (Historia 5.13) are tracked globally in the audit
// log and excluded from entity history timelines, whose scope is limited to
// business events per BACKLOG (4.7 / 5.5).
export const ACCESS_AUDIT_ACTIONS = ["viewed_project", "downloaded_file"] as const;

// Historia 16.13 — security events: denials, authentication failures,
// permission/role changes and other critical account mutations. Used by the
// activity page to offer a dedicated security filter.
export const SECURITY_AUDIT_ACTIONS = [
  "access_denied",
  "login_failed",
  "logged_in",
  "logged_out",
  "requested_password_reset",
  "reset_password",
  "changed_password",
  "changed_role",
  "updated_permissions",
  "updated_settings",
  "restored_settings",
  "imported_settings",
  "exported_settings",
  "purged_activity_logs",
] as const;
