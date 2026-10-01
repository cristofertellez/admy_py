import { z } from "zod";
import { MAX_TAGS_PER_PROJECT } from "@/constants";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (typeof value === "string" && value.trim() ? value.trim() : null))
  .refine((value) => value === null || DATE_PATTERN.test(value), {
    message: "Invalid date format.",
  });

const projectBaseSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(150, "Project name is too long"),
  code: z
    .string()
    .trim()
    .max(50, "Code is too long")
    .optional()
    .nullable()
    .transform((value) => value || null),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional()
    .nullable()
    .transform((value) => value || null),
  client_id: z.string().uuid("Client is required"),
  intermediary_id: z
    .string()
    .uuid("Invalid intermediary.")
    .optional()
    .nullable()
    .transform((value) => value || null),
  // Status/priority are validated at the action layer against the configured
  // catalogs (Historia 15.15), so custom statuses added in settings are accepted.
  status: z.string().min(1, "Status is required.").default("Proposed"),
  priority: z.string().min(1, "Priority is required.").default("Medium"),
  estimated_start_date: optionalDate,
  estimated_end_date: optionalDate,
  estimated_hours: z.coerce
    .number({ invalid_type_error: "Estimated hours must be a number." })
    .min(0, "Estimated hours cannot be negative.")
    .max(100000, "Estimated hours are too high.")
    .default(0),
  // Tag assignments travel with the project form (Historia 6.10); the ids are
  // re-validated against the tags table at the data layer.
  tags: z.array(z.string().uuid("Invalid tag.")).max(MAX_TAGS_PER_PROJECT, "Too many tags.").default([]),
});

function assertDateOrder(data: {
  estimated_start_date: string | null;
  estimated_end_date: string | null;
}) {
  return (
    !data.estimated_start_date ||
    !data.estimated_end_date ||
    data.estimated_end_date >= data.estimated_start_date
  );
}

export const projectSchema = projectBaseSchema.refine(assertDateOrder, {
  message: "The end date must be after the start date.",
  path: ["estimated_end_date"],
});

// The client of an existing project never changes through the edit form;
// structural client changes are out of scope for Historia 6.3.
export const projectUpdateSchema = projectBaseSchema.omit({ client_id: true }).refine(assertDateOrder, {
  message: "The end date must be after the start date.",
  path: ["estimated_end_date"],
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

// Historia 6.7 — Asignación de Responsables: multi-select member assignment.
export const assignProjectMembersSchema = z.object({
  project_id: z.string().uuid("Invalid project."),
  user_ids: z
    .array(z.string().uuid("Invalid member."))
    .min(1, "Select at least one member.")
    .max(50, "Too many members selected."),
});

export type AssignProjectMembersInput = z.infer<typeof assignProjectMembersSchema>;

// Fields tracked by the audit diff (Historia 6.17): edits, date changes and
// estimate changes are all recorded through this field list.
export const PROJECT_AUDIT_FIELDS = [
  "name",
  "code",
  "description",
  "intermediary_id",
  "priority",
  "estimated_start_date",
  "estimated_end_date",
  "estimated_hours",
] as const;
