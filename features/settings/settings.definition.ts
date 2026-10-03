import {
  LANGUAGE_OPTIONS,
  THEME_OPTIONS,
  TIMEZONE_OPTIONS,
  PROJECT_STATUSES,
  TASK_STATUSES,
  PRIORITIES,
  FILE_TYPES_ALLOWED,
} from "@/constants";

export type SettingFieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "catalog";

export interface SettingOption {
  value: string;
  label: string;
}

export interface CatalogItem {
  value: string;
  label: string;
  color?: string;
}

export interface SettingDefinition {
  key: string;
  label: string;
  type: SettingFieldType;
  description?: string;
  defaultValue: unknown;
  options?: readonly SettingOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export type SettingCategoryId =
  | "organization"
  | "preferences"
  | "projects"
  | "tasks"
  | "milestones"
  | "notifications"
  | "catalogs"
  | "audit"
  | "security"
  | "personalization"
  | "pwa";

export interface SettingCategory {
  id: SettingCategoryId;
  label: string;
  description: string;
  settings: SettingDefinition[];
}

const DATE_FORMAT_OPTIONS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
] as const;

const TIME_FORMAT_OPTIONS = [
  { value: "12h", label: "12-hour (hh:mm AM/PM)" },
  { value: "24h", label: "24-hour (HH:mm)" },
] as const;

const NOTIFICATION_FREQUENCY_OPTIONS = [
  { value: "realtime", label: "Realtime" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
] as const;

function fromRecord(record: Record<string, string>): CatalogItem[] {
  return Object.values(record).map((value) => ({ value, label: value }));
}

function fromList(values: readonly string[]): CatalogItem[] {
  return values.map((value) => ({ value, label: value }));
}

export const SETTING_CATEGORIES: SettingCategory[] = [
  {
    id: "organization",
    label: "Organization",
    description: "Organization identity and regional defaults.",
    settings: [
      {
        key: "organization_name",
        label: "Organization Name",
        type: "text",
        description: "The display name of your organization.",
        defaultValue: "",
        placeholder: "Acme Inc.",
      },
      {
        key: "organization_logo",
        label: "Organization Logo",
        type: "url",
        description: "URL of the organization logo image.",
        defaultValue: "",
        placeholder: "https://example.com/logo.png",
      },
      {
        key: "organization_description",
        label: "Description",
        type: "textarea",
        description: "Short description of the organization.",
        defaultValue: "",
      },
      {
        key: "organization_email",
        label: "Primary Email",
        type: "email",
        description: "Main contact email of the organization.",
        defaultValue: "",
        placeholder: "contact@company.com",
      },
      {
        key: "organization_phone",
        label: "Phone",
        type: "text",
        defaultValue: "",
        placeholder: "+1 555 000 0000",
      },
      {
        key: "organization_address",
        label: "Address",
        type: "textarea",
        defaultValue: "",
      },
      {
        key: "default_timezone",
        label: "Default Timezone",
        type: "select",
        description: "Fallback timezone used across the platform.",
        defaultValue: "UTC",
        options: TIMEZONE_OPTIONS,
      },
      {
        key: "default_language",
        label: "Default Language",
        type: "select",
        defaultValue: "en",
        options: LANGUAGE_OPTIONS,
      },
      {
        key: "date_format",
        label: "Date Format",
        type: "select",
        defaultValue: "MM/DD/YYYY",
        options: DATE_FORMAT_OPTIONS,
      },
    ],
  },
  {
    id: "preferences",
    label: "Global Preferences",
    description: "Platform-wide appearance and behavior defaults.",
    settings: [
      {
        key: "default_theme",
        label: "Default Theme",
        type: "select",
        defaultValue: "system",
        options: THEME_OPTIONS,
      },
      {
        key: "dark_mode_enabled",
        label: "Dark Mode",
        type: "boolean",
        description: "Enforce dark mode regardless of the system preference.",
        defaultValue: false,
      },
      {
        key: "time_format",
        label: "Time Format",
        type: "select",
        defaultValue: "24h",
        options: TIME_FORMAT_OPTIONS,
      },
      {
        key: "records_per_page",
        label: "Records per Page",
        type: "number",
        description: "Default number of rows shown in tables.",
        defaultValue: 20,
        min: 5,
        max: 100,
      },
      {
        key: "system_language",
        label: "System Language",
        type: "select",
        defaultValue: "en",
        options: LANGUAGE_OPTIONS,
      },
      {
        key: "default_page",
        label: "Initial Page",
        type: "text",
        description: "Route users land on after sign-in.",
        defaultValue: "/dashboard",
        placeholder: "/dashboard",
      },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    description: "Catalogs used by the projects module.",
    settings: [
      {
        key: "project_statuses",
        label: "Project Statuses",
        type: "catalog",
        description: "Manage the available project statuses and their colors.",
        defaultValue: fromRecord(PROJECT_STATUSES),
      },
      {
        key: "project_priorities",
        label: "Project Priorities",
        type: "catalog",
        description: "Manage the available project priorities.",
        defaultValue: fromRecord(PRIORITIES),
      },
      {
        key: "project_categories",
        label: "Project Categories",
        type: "catalog",
        description: "Optional categories to group projects.",
        defaultValue: [],
      },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Catalogs used by the tasks module.",
    settings: [
      {
        key: "task_statuses",
        label: "Task Statuses",
        type: "catalog",
        description: "Manage the available task statuses and their colors.",
        defaultValue: fromRecord(TASK_STATUSES),
      },
      {
        key: "task_priorities",
        label: "Task Priorities",
        type: "catalog",
        description: "Manage the available task priorities.",
        defaultValue: fromRecord(PRIORITIES),
      },
      {
        key: "task_types",
        label: "Task Types",
        type: "catalog",
        description: "Manage the available task types.",
        defaultValue: fromList(["Feature", "Bug", "Improvement", "Epic"]),
      },
      {
        key: "task_default_hours",
        label: "Default Hours",
        type: "number",
        description: "Default estimated hours assigned to new tasks.",
        defaultValue: 8,
        min: 0,
        max: 1000,
      },
    ],
  },
  {
    id: "milestones",
    label: "Milestones",
    description: "Catalogs used by the milestones module.",
    settings: [
      {
        key: "milestone_statuses",
        label: "Milestone Statuses",
        type: "catalog",
        description: "Manage the available milestone statuses and their colors.",
        defaultValue: fromList(["Pending", "In Progress", "Completed", "Cancelled"]),
      },
      {
        key: "milestone_types",
        label: "Milestone Types",
        type: "catalog",
        description: "Optional types to categorize milestones.",
        defaultValue: [],
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Control how the platform notifies its users.",
    settings: [
      {
        key: "notification_frequency",
        label: "Notification Frequency",
        type: "select",
        description: "How often notification digests are delivered.",
        defaultValue: "realtime",
        options: NOTIFICATION_FREQUENCY_OPTIONS,
      },
      {
        key: "auto_emails_enabled",
        label: "Automatic Emails",
        type: "boolean",
        description: "Send automatic email notifications for events.",
        defaultValue: true,
      },
      {
        key: "reminder_enabled",
        label: "Reminders",
        type: "boolean",
        description: "Enable upcoming-deadline reminders.",
        defaultValue: true,
      },
      {
        key: "reminder_days",
        label: "Reminder Lead (days)",
        type: "number",
        description: "How many days before a deadline a reminder is sent.",
        defaultValue: 3,
        min: 0,
        max: 30,
      },
      {
        key: "notification_events",
        label: "Notification Events",
        type: "catalog",
        description: "List of event types that generate notifications.",
        defaultValue: fromList([
          "project.created",
          "project.updated",
          "task.created",
          "task.assigned",
          "task.completed",
          "comment.created",
          "milestone.completed",
        ]),
      },
    ],
  },
  {
    id: "catalogs",
    label: "Catalogs",
    description: "System-wide catalogs reused across modules.",
    settings: [
      {
        key: "allowed_file_types",
        label: "Allowed File Types",
        type: "catalog",
        description: "MIME types accepted when uploading files.",
        defaultValue: FILE_TYPES_ALLOWED.map((mime) => ({ value: mime, label: mime })),
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    description: "Session and password policies.",
    settings: [
      {
        key: "session_timeout_minutes",
        label: "Session Timeout (minutes)",
        type: "number",
        description: "Maximum idle session duration in minutes.",
        defaultValue: 60,
        min: 5,
        max: 1440,
      },
      {
        key: "password_min_length",
        label: "Minimum Password Length",
        type: "number",
        defaultValue: 8,
        min: 6,
        max: 64,
      },
      {
        key: "password_require_uppercase",
        label: "Require Uppercase",
        type: "boolean",
        description: "Passwords must contain at least one uppercase letter.",
        defaultValue: true,
      },
      {
        key: "password_require_number",
        label: "Require Number",
        type: "boolean",
        description: "Passwords must contain at least one digit.",
        defaultValue: true,
      },
      {
        key: "password_require_symbol",
        label: "Require Symbol",
        type: "boolean",
        description: "Passwords must contain at least one special character.",
        defaultValue: false,
      },
      {
        key: "login_max_attempts",
        label: "Max Login Attempts",
        type: "number",
        description: "Failed login attempts allowed before a lockout.",
        defaultValue: 5,
        min: 1,
        max: 20,
      },
      {
        key: "auto_lock_minutes",
        label: "Auto Lock (minutes)",
        type: "number",
        description: "Minutes to lock an account after exceeding failed attempts.",
        defaultValue: 15,
        min: 1,
        max: 1440,
      },
    ],
  },
  {
    id: "audit",
    label: "Audit",
    description: "Activity log retention (Historia 16.12).",
    settings: [
      {
        key: "audit_retention_days",
        label: "Retention (days)",
        type: "number",
        description: "Delete activity logs older than this many days. 0 keeps everything.",
        defaultValue: 0,
        min: 0,
        max: 3650,
      },
    ],
  },
  {
    id: "pwa",
    label: "Progressive Web App",
    description: "Offline and installation behavior (Historia 14.13).",
    settings: [
      {
        key: "pwa_auto_updates",
        label: "Automatic updates",
        type: "boolean",
        description: "Install new app versions automatically when available.",
        defaultValue: true,
      },
      {
        key: "pwa_offline_cache",
        label: "Offline cache",
        type: "boolean",
        description: "Cache visited pages for read-only access without connection.",
        defaultValue: true,
      },
      {
        key: "pwa_background_sync",
        label: "Background sync",
        type: "boolean",
        description: "Synchronize queued changes automatically when back online.",
        defaultValue: true,
      },
    ],
  },
  {
    id: "personalization",
    label: "Personalization",
    description: "Branding and system-wide appearance.",
    settings: [
      {
        key: "primary_color",
        label: "Primary Color",
        type: "color",
        description: "Institutional accent color (hex).",
        defaultValue: "#6D28D9",
      },
      {
        key: "favicon_url",
        label: "Favicon",
        type: "url",
        description: "URL of the favicon image.",
        defaultValue: "",
      },
      {
        key: "system_message",
        label: "System Message",
        type: "textarea",
        description: "Short announcement shown across the platform.",
        defaultValue: "",
      },
    ],
  },
];

export function getSettingDefinitions(): SettingDefinition[] {
  return SETTING_CATEGORIES.flatMap((category) => category.settings);
}

export function getSettingsByCategory(): SettingCategory[] {
  return SETTING_CATEGORIES;
}

export function getSettingsForCategory(categoryId: SettingCategoryId): SettingDefinition[] {
  const category = SETTING_CATEGORIES.find((c) => c.id === categoryId);
  return category ? category.settings : [];
}

export function getSettingDefinition(key: string): SettingDefinition | undefined {
  return getSettingDefinitions().find((setting) => setting.key === key);
}

export function getSettingDefault(key: string): unknown {
  return getSettingDefinition(key)?.defaultValue;
}

export function getCategoryDefaults(categoryId: SettingCategoryId): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const setting of getSettingsForCategory(categoryId)) {
    defaults[setting.key] = setting.defaultValue;
  }
  return defaults;
}