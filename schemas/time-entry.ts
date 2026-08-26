import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.");

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the HH:MM format.");

// Manual time tracking (Historia 7.11) and timer finalize (Historia 7.12)
// share this shape: a work date, optional start/end times and total hours.
export const timeEntrySchema = z
  .object({
    task_id: z.string().min(1, "Missing task."),
    date: dateString,
    start_time: timeString.optional().or(z.literal("")),
    end_time: timeString.optional().or(z.literal("")),
    total_hours: z.coerce
      .number({ invalid_type_error: "Logged hours must be a number." })
      .positive("Logged hours must be greater than zero.")
      .max(24, "A single entry cannot exceed 24 hours."),
    description: z.string().trim().max(500, "Description is too long").optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.start_time || !data.end_time || data.end_time > data.start_time,
    { message: "End time must be after start time.", path: ["end_time"] },
  );

export type TimeEntryInput = z.input<typeof timeEntrySchema>;
