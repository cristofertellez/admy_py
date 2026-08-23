import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  client_id: z.string().uuid("Client is required"),
  intermediary_id: z.string().uuid().optional().nullable(),
  status: z.string().default("Proposed"),
  priority: z.string().default("Medium"),
  estimated_start_date: z.string().optional().nullable(),
  estimated_end_date: z.string().optional().nullable(),
  estimated_hours: z.coerce.number().min(0).default(0),
  visibility: z.string().default("Internal"),
  notes: z.string().optional(),
});

export const taskSchema = z.object({
  project_id: z.string().uuid("Project is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  status: z.string().default("Pending"),
  priority: z.string().default("Medium"),
  estimated_hours: z.coerce.number().min(0).default(0),
  estimated_start: z.string().optional().nullable(),
  estimated_end: z.string().optional().nullable(),
  weight: z.coerce.number().min(1).default(1),
  task_type: z.string().default("Feature"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
