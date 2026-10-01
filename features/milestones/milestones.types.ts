import type { Milestone } from "@/types";

/** Task aggregates resolved in the same query as the milestone row (Historia 8.6). */
export interface MilestoneTaskStats {
  task_count: number;
  completed_tasks: number;
  estimated_hours_sum: number;
  worked_hours_sum: number;
}

export interface MilestoneWithStats extends Milestone, MilestoneTaskStats {}

/** Quick indicators for the milestones page header (Historia 8.1). */
export interface MilestoneSummary {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

/** Upcoming milestone across visible projects, consumed by role dashboards. */
export interface UpcomingMilestone {
  id: string;
  title: string;
  status: string;
  estimated_date: string;
  completion_percentage: number;
  project_id: string;
  project_name: string;
  client_name: string;
}

/** Project tasks with their current milestone, for the assignment UI (Historia 8.5). */
export interface MilestoneProjectTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  milestone_id: string | null;
  milestone_title: string | null;
}

export interface MilestoneListFilters {
  search?: string;
  status?: string;
}
