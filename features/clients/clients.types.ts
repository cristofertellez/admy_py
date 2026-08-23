import type { Client } from "@/types";

export interface ClientWithRelations extends Client {
  projects_count?: number;
  active_projects_count?: number;
  intermediary_name?: string;
}

export interface ClientFilters {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
