import { z } from "zod";

// API Key Scopes
export const API_KEY_SCOPES_LIST = ["read", "write"] as const;

export const createApiKeySchema = z.object({
  name: z.string().trim().min(3, "Name must have at least 3 characters.").max(60, "Name cannot exceed 60 characters."),
  scopes: z.array(z.enum(API_KEY_SCOPES_LIST)).min(1, "Select at least one scope."),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// Webhooks
export const WEBHOOK_EVENT_LIST = [
  "project.created",
  "project.updated",
  "project.status_changed",
  "project.completed",
  "task.created",
  "task.status_changed",
  "task.assigned",
  "comment.created",
  "file.uploaded",
  "milestone.completed",
  "client.created",
] as const;

export const createWebhookSchema = z.object({
  name: z.string().trim().min(3, "Name must have at least 3 characters.").max(60, "Name cannot exceed 60 characters."),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .refine((val) => val.startsWith("https://"), "Webhook URLs must use HTTPS."),
  events: z.array(z.enum(WEBHOOK_EVENT_LIST)).min(1, "Subscribe to at least one event."),
});

export const updateWebhookSchema = createWebhookSchema.extend({
  id: z.string().trim().min(1, "Webhook ID is required."),
  active: z.boolean().optional(),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;

// Automations (Historia 17.6)
export const AUTOMATION_EVENTS_LIST = [
  "project.created",
  "project.status_changed",
  "project.completed",
  "task.created",
  "task.status_changed",
  "task.assigned",
  "comment.created",
  "file.uploaded",
  "milestone.completed",
] as const;

export const AUTOMATION_ACTIONS_LIST = ["notify_project_audience", "webhook_forward"] as const;

export const automationConditionsSchema = z.object({
  status: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  filterField: z.string().trim().optional(),
  filterValue: z.string().trim().optional(),
});

export const automationActionConfigSchema = z.object({
  titleTemplate: z.string().trim().max(100).optional(),
  messageTemplate: z.string().trim().max(250).optional(),
  severity: z.enum(["info", "reminder", "alert"]).optional(),
  webhookId: z.string().trim().optional(),
});

export const automationRuleConfigSchema = z.object({
  conditions: automationConditionsSchema.optional().default({}),
  actionConfig: automationActionConfigSchema.optional().default({}),
});

export const createAutomationSchema = z.object({
  name: z.string().trim().min(3, "Name must have at least 3 characters.").max(80, "Name cannot exceed 80 characters."),
  event: z.enum(AUTOMATION_EVENTS_LIST, {
    errorMap: () => ({ message: "Select a valid trigger event." }),
  }),
  action: z.enum(AUTOMATION_ACTIONS_LIST, {
    errorMap: () => ({ message: "Select a valid action." }),
  }),
  config: automationRuleConfigSchema.optional().default({}),
});

export const updateAutomationSchema = createAutomationSchema.extend({
  id: z.string().trim().min(1, "Rule ID is required."),
  active: z.boolean().optional(),
});

export type AutomationConditions = z.infer<typeof automationConditionsSchema>;
export type AutomationActionConfig = z.infer<typeof automationActionConfigSchema>;
export type AutomationRuleConfig = z.infer<typeof automationRuleConfigSchema>;
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
