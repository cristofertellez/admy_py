import type { Task } from "@/types";

export interface TaskWithRelations extends Task {
  project_name?: string;
  assignee_name?: string;
  parent_task_title?: string;
  subtasks?: TaskWithRelations[];
}

export interface TaskWithFullRelations extends TaskWithRelations {
  projects?: Record<string, unknown>;
  users?: Record<string, unknown>;
  milestones?: Record<string, unknown>;
}

export interface TaskFilters {
  search?: string;
  projectId?: string;
  assignedTo?: string;
  // Status and priority are catalog-driven (Historia 15.15), so they accept
  // arbitrary configured strings rather than a closed enum.
  status?: string;
  priority?: string;
  parentTaskId?: string;
  // When true, lists soft-deleted (archived) tasks instead of active ones.
  archived?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TaskDependencyItem {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
}
