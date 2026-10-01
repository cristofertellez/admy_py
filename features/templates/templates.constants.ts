import type { TemplateEntityType } from "./templates.types";

export const TEMPLATE_ENTITY_TYPES: { value: TemplateEntityType; label: string }[] = [
  { value: "project", label: "Project" },
  { value: "task", label: "Task" },
  { value: "milestone", label: "Milestone" },
  { value: "report", label: "Report" },
];