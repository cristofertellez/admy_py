import type { Task, TaskStatus, Priority } from "@/types";

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
  status?: TaskStatus;
  priority?: Priority;
  parentTaskId?: string;
  // When true, lists soft-deleted (archived) tasks instead of active ones.
  archived?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
