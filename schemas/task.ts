import { z } from "zod";
import { optionalDate, optionalUuid } from "./shared";

// PRD §80: every task needs an assignee unless it is still "Pending" or "Planned".
function assertAssigneeByStatus(data: { assigned_to: string | null; status: string }) {
  return Boolean(data.assigned_to) || data.status === "Pending" || data.status === "Planned";
}

function assertDateOrder(data: { estimated_start: string | null; estimated_end: string | null }) {
  return (
    !data.estimated_start ||
    !data.estimated_end ||
    data.estimated_end >= data.estimated_start
  );
}

function refineTask<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(assertAssigneeByStatus, {
      message: "An assignee is required unless the task is Pending or Planned.",
      path: ["assigned_to"],
    })
    .refine(assertDateOrder, {
      message: "The end date must be after the start date.",
      path: ["estimated_end"],
    });
}

const taskBaseSchema = z.object({
  project_id: z.string().uuid("Project is required."),
  parent_task_id: optionalUuid("Invalid task."),
  title: z.string().trim().min(1, "Task title is required.").max(200, "Task title is too long."),
  description: z
    .string()
    .trim()
    .max(4000, "Description is too long.")
    .optional()
    .nullable()
    .transform((value) => value || null),
  assigned_to: optionalUuid("Invalid user."),
  // Status/priority are validated at the action layer against the configured
  // catalogs (Historia 15.15), so custom statuses added in settings are accepted.
  status: z.string().min(1, "Status is required.").default("Pending"),
  priority: z.string().min(1, "Priority is required.").default("Medium"),
  estimated_hours: z.coerce
    .number({ invalid_type_error: "Estimated hours must be a number." })
    .min(0, "Estimated hours cannot be negative.")
    .max(100000, "Estimated hours are too high.")
    .default(0),
  estimated_start: optionalDate,
  estimated_end: optionalDate,
});

export const taskSchema = refineTask(taskBaseSchema);

// The project of an existing task never changes through the edit form;
// structural project changes are out of scope for Historia 7.3.
const taskUpdateBaseSchema = taskBaseSchema.omit({ project_id: true }).extend({
  completion_percentage: z.coerce
    .number({ invalid_type_error: "Progress must be a number." })
    .min(0, "Progress cannot be negative.")
    .max(100, "Progress cannot exceed 100.")
    .optional(),
});

export const taskUpdateSchema = refineTask(taskUpdateBaseSchema);

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// Fields tracked by the edit audit diff (Historia 7.3); status gets its own
// dedicated event because it follows the transition workflow (Historia 7.5).
export const TASK_AUDIT_FIELDS = [
  "title",
  "description",
  "priority",
  "assigned_to",
  "estimated_hours",
  "estimated_start",
  "estimated_end",
] as const;

// Historia 7.1 — Acciones masivas: cambio de estado por lote. Visibility is
// re-checked per task at the data layer, so out-of-scope ids fail gracefully.
export const bulkUpdateTaskStatusSchema = z.object({
  ids: z
    .array(z.string().uuid("Invalid task."))
    .min(1, "Select at least one task.")
    .max(100, "Too many tasks selected."),
  status: z.string().min(1, "Status is required."),
});

export type BulkUpdateTaskStatusInput = z.infer<typeof bulkUpdateTaskStatusSchema>;
