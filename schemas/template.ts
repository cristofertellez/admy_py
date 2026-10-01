import { z } from "zod";
import { TEMPLATE_ENTITY_TYPES } from "@/features/templates/templates.constants";
import type { TemplateEntityType } from "@/features/templates/templates.types";

export const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  description: z.string().trim().max(500, "Description is too long.").optional().or(z.literal("")),
  entity_type: z.enum(
    TEMPLATE_ENTITY_TYPES.map((type) => type.value) as [TemplateEntityType, ...TemplateEntityType[]],
  ),
  payload: z.record(z.string(), z.unknown()).refine(
    (value) => Object.keys(value).length > 0,
    "Template payload cannot be empty.",
  ),
});

export type TemplateInput = z.infer<typeof templateSchema>;
export type TemplateActionState = { success?: string; error?: string } | undefined;