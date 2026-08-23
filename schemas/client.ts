import { z } from "zod";

export const clientSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  contact_name: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.string().default("active"),
  intermediary_id: z.string().uuid().optional().nullable(),
});

export type ClientInput = z.infer<typeof clientSchema>;
