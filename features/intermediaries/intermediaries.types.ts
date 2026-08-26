import type { Client } from "@/types";
import type { ActivityLog } from "@/features/activity";
import type { ClientHistoryCategory } from "@/features/clients";

export interface IntermediaryRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role_id: string;
  role_name: string;
  last_login: string | null;
  timezone: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
}

export interface IntermediaryWithRelations {
  id: string;
  company: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  status: string;
  clients_count?: number;
  projects_count?: number;
  clients?: Client[];
}

export interface IntermediaryHistoryFilters {
  search?: string;
  category?: ClientHistoryCategory | null;
  page?: number;
  pageSize?: number;
}

export interface IntermediaryHistoryResult {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}
