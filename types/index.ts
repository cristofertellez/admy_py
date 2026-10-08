export type Role = "Developer" | "Client" | "Intermediary";

export type ProjectStatus =
  | "Proposed"
  | "Pending"
  | "Planning"
  | "Design"
  | "Development"
  | "QA"
  | "In Review"
  | "Corrections"
  | "Ready for Delivery"
  | "Delivered"
  | "Completed"
  | "Suspended"
  | "Cancelled"
  | "Archived";

export type TaskStatus =
  | "Pending"
  | "Planned"
  | "In Progress"
  | "Blocked"
  | "In Review"
  | "QA"
  | "Completed"
  | "Cancelled";

export type MilestoneStatus =
  | "Pending"
  | "In Progress"
  | "In Review"
  | "Completed"
  | "Cancelled";

export type Priority = "Very Low" | "Low" | "Medium" | "High" | "Critical" | "Urgent";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role_id: string;
  last_login: string | null;
  timezone: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Client {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  notes: string | null;
  logo: string | null;
  status: string;
  intermediary_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
}

export interface Project {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  client_id: string;
  intermediary_id: string | null;
  status: string;
  priority: string;
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  real_start_date: string | null;
  real_end_date: string | null;
  estimated_hours: number;
  worked_hours: number;
  completion_percentage: number;
  budget: number | null;
  visibility: string;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  milestone_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  estimated_hours: number;
  worked_hours: number;
  estimated_start: string | null;
  estimated_end: string | null;
  real_start: string | null;
  real_end: string | null;
  completion_percentage: number;
  position: number;
  weight: number;
  task_type: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  estimated_date: string | null;
  completed_date: string | null;
  status: string;
  completion_percentage: number;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  parent_comment_id: string | null;
  message: string;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: boolean;
}

export interface Notification {
  id: string;
  receiver_id: string;
  sender_id: string | null;
  title: string;
  message: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Tag taxonomy (PRD §35): classifies projects and tasks.
export interface Tag {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}
