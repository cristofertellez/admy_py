import type { Project, ProjectStatus, Priority } from "@/types";

export interface ProjectWithRelations extends Project {
  client_name?: string;
  intermediary_name?: string;
  tasks_count?: number;
  completed_tasks_count?: number;
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus;
  clientId?: string;
  intermediaryId?: string;
  priority?: Priority;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
