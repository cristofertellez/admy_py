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

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
] as const;

export const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

// Curated list of common IANA timezones shown in user preferences.
export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/La_Paz", label: "La Paz (GMT-4)" },
  { value: "America/Asuncion", label: "Asunción (GMT-4)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Caracas", label: "Caracas (GMT-4)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Havana", label: "Havana (GMT-5)" },
  { value: "America/Lima", label: "Lima (GMT-5)" },
  { value: "America/Mexico_City", label: "Mexico City (GMT-6)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "Europe/Lisbon", label: "Lisbon (GMT+0)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
  { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
  { value: "Europe/Rome", label: "Rome (GMT+1)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (GMT+1)" },
  { value: "Europe/Moscow", label: "Moscow (GMT+3)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Asia/Karachi", label: "Karachi (GMT+5)" },
  { value: "Asia/Kolkata", label: "Mumbai (GMT+5:30)" },
  { value: "Asia/Shanghai", label: "Shanghai (GMT+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "Asia/Seoul", label: "Seoul (GMT+9)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+10)" },
] as const;
