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
  created_at: string;
}

export interface ActivityLogFilters {
  search?: string;
  userId?: string;
  entity?: string;
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
