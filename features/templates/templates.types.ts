export type TemplateEntityType = "project" | "task" | "milestone" | "report";

export interface Template {
  id: string;
  name: string;
  description: string | null;
  entity_type: TemplateEntityType;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TemplateInput {
  name: string;
  description?: string;
  entity_type: TemplateEntityType;
  payload: Record<string, unknown>;
}