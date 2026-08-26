import type { ActivityLog } from "@/features/activity";
import type { Project, Tag } from "@/types";

export interface ProjectWithRelations extends Project {
  clients: { company_name: string } | null;
  users: { first_name: string; last_name: string } | null;
  tags?: Pick<Tag, "id" | "name" | "color">[];
}

// Historia 6.7 — Asignación de Responsables. Members are staff users
// (Developers and Intermediaries); the client is the project's client_id.
export interface ProjectMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface ProjectMemberCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  clientId?: string;
  intermediaryId?: string;
  priority?: string;
  isActive?: boolean;
  tagId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Historia 6.14 — Actividad del Proyecto. Categories map the automatic events
// recorded for a project (creation, edits, status changes, assignments,
// comments and files) to their activity_logs actions.
export const PROJECT_HISTORY_ACTIONS = {
  project: [
    "created_project",
    "updated_project",
    "changed_project_status",
    "archived_project",
    "restored_project",
    "assigned_project_member",
    "removed_project_member",
    "updated_project_tags",
  ],
  files: ["uploaded_file", "deleted_file"],
  comments: ["created_comment", "replied_comment", "updated_comment", "deleted_comment"],
} as const;

export type ProjectHistoryCategory = keyof typeof PROJECT_HISTORY_ACTIONS;

export function isProjectHistoryCategory(
  value: string | undefined,
): value is ProjectHistoryCategory {
  return !!value && value in PROJECT_HISTORY_ACTIONS;
}

export interface ProjectHistoryFilters {
  search?: string;
  category?: ProjectHistoryCategory | null;
  page?: number;
  pageSize?: number;
}

export interface ProjectHistoryResult {
  data: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}
