export const APP_NAME = "AdmiPy";
export const APP_DESCRIPTION =
  "Professional platform for project planning, tracking, collaboration and visualization.";
export const APP_VERSION = "0.1.0";

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
};

export const ROLES = {
  DEVELOPER: "Developer",
  CLIENT: "Client",
  INTERMEDIARY: "Intermediary",
} as const;

export const PROJECT_STATUSES = {
  PROPOSED: "Proposed",
  PENDING: "Pending",
  PLANNING: "Planning",
  DESIGN: "Design",
  DEVELOPMENT: "Development",
  QA: "QA",
  IN_REVIEW: "In Review",
  CORRECTIONS: "Corrections",
  READY_FOR_DELIVERY: "Ready for Delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
} as const;

export const TASK_STATUSES = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In Review",
  QA: "QA",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const PRIORITIES = {
  VERY_LOW: "Very Low",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
  URGENT: "Urgent",
} as const;

export const FILE_TYPES_ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/vnd.rar",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/json",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
