import { z } from "zod";
import { optionalDate } from "./shared";

const milestoneBaseSchema = z.object({
  project_id: z.string().uuid("Project is required."),
  title: z.string().trim().min(1, "Milestone title is required.").max(200, "Milestone title is too long."),
  description: z
    .string()
    .trim()
    .max(4000, "Description is too long.")
    .optional()
    .nullable()
    .transform((value) => value || null),
  estimated_date: optionalDate,
  // Status is validated at the action layer against the configured catalog
  // (Historia 15.15), so custom statuses added in settings are accepted.
  status: z.string().min(1, "Status is required.").default("Pending"),
});

export const milestoneSchema = milestoneBaseSchema;

// The project of an existing milestone never changes through the edit form.
const milestoneUpdateBaseSchema = milestoneBaseSchema.omit({ project_id: true }).extend({
  completion_percentage: z.coerce
    .number({ invalid_type_error: "Progress must be a number." })
    .min(0, "Progress cannot be negative.")
    .max(100, "Progress cannot exceed 100.")
    .optional(),
});

export const milestoneUpdateSchema = milestoneUpdateBaseSchema;

export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type MilestoneUpdateInput = z.infer<typeof milestoneUpdateSchema>;

// Fields tracked by the edit audit diff (Historia 8.13); status gets its own
// dedicated event because it follows the transition workflow (Historia 8.4).
export const MILESTONE_AUDIT_FIELDS = ["title", "description", "estimated_date"] as const;

// Historia 8.5 — Asignación de tareas: one task is linked to one milestone at
// a time; moving between milestones is a reassignment, not a list operation.
export const assignTaskToMilestoneSchema = z.object({
  milestone_id: z.string().uuid("Invalid milestone."),
  task_id: z.string().uuid("Invalid task."),
});

export type AssignTaskToMilestoneInput = z.infer<typeof assignTaskToMilestoneSchema>;
