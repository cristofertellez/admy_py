import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .or(z.literal(""));

export const clientStatusSchema = z.enum(["active", "inactive"]);

export const clientSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Company name must be 200 characters or fewer"),
  contact_name: optionalText(150),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .max(200, "Email must be 200 characters or fewer")
    .optional()
    .or(z.literal("")),
  phone: optionalText(50),
  address: optionalText(300),
  country: optionalText(100),
  city: optionalText(100),
  website: z
    .string()
    .trim()
    .url("Invalid URL")
    .max(300, "Website must be 300 characters or fewer")
    .optional()
    .or(z.literal("")),
  notes: optionalText(5000),
  status: clientStatusSchema.default("active"),
  intermediary_id: z.string().uuid("Invalid intermediary").optional().nullable(),
});

export type ClientInput = z.infer<typeof clientSchema>;
