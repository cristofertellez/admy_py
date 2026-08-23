import type { ActivityLog } from "@/features/activity";
import type { Client } from "@/types";

export interface ClientWithRelations extends Client {
  projects_count?: number;
  active_projects_count?: number;
  intermediary_name?: string;
}

export interface AssignedIntermediary {
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

export interface ClientProjectSummary {
  id: string;
  name: string;
  status: string;
  completion_percentage: number;
  estimated_end_date: string | null;
  worked_hours: number;
}

export interface ClientFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ClientProjectSummary {
  id: string;
  name: string;
  status: string;
  priority: string;
  completion_percentage: number;
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  worked_hours: number;
  estimated_hours: number;
}

export interface AssignedIntermediary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  is_active: boolean;
}

export interface ClientDetailData {
  client: Client;
  intermediary: AssignedIntermediary | null;
  projects: ClientProjectSummary[];
  activity: ActivityLog[];
}

export const CLIENT_HISTORY_ACTIONS = {
  client: ["created_client", "updated_client", "archived_client", "restored_client"],
  projects: ["created_project"],
  files: ["uploaded_file", "deleted_file"],
  comments: [
    "created_comment",
    "created_client_comment",
    "replied_client_comment",
    "updated_client_comment",
    "deleted_client_comment",
  ],
  intermediaries: ["assigned_intermediary", "removed_intermediary"],
} as const;

export type ClientHistoryCategory = keyof typeof CLIENT_HISTORY_ACTIONS;

export function isClientHistoryCategory(value: string | undefined): value is ClientHistoryCategory {
  return !!value && value in CLIENT_HISTORY_ACTIONS;
}

export interface ClientHistoryFilters {
  search?: string;
  category?: ClientHistoryCategory | null;
  page?: number;
  pageSize?: number;
}

export interface ClientHistoryResult {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}
