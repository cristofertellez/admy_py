import { z } from "zod";
import {
  getSettingsForCategory,
  getSettingDefinition,
  type SettingCategoryId,
  type SettingDefinition,
} from "@/features/settings/settings.definition";

const catalogItemSchema = z.object({
  value: z.string().trim().min(1, "Value is required."),
  label: z.string().trim().min(1, "Label is required."),
  color: z.string().optional(),
});

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color.");

function fieldSchema(definition: SettingDefinition): z.ZodTypeAny {
  const { type, min, max } = definition;

  switch (type) {
    case "boolean":
      return z.boolean();
    case "number": {
      let schema = z.number();
      if (min !== undefined) schema = schema.min(min);
      if (max !== undefined) schema = schema.max(max);
      return schema;
    }
    case "email":
      return z.string().email("Enter a valid email.").or(z.literal(""));
    case "url":
      return z.string().url("Enter a valid URL.").or(z.literal(""));
    case "color":
      return hexColorSchema;
    case "catalog":
      return z.array(catalogItemSchema);
    case "select": {
      const options = definition.options?.map((option) => option.value) ?? [];
      return z.enum(options as [string, ...string[]]).or(z.literal(""));
    }
    case "textarea":
    case "text":
    default:
      return z.string();
  }
}

export function settingsCategorySchema(categoryId: SettingCategoryId) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const setting of getSettingsForCategory(categoryId)) {
    shape[setting.key] = fieldSchema(setting);
  }
  return z.object(shape);
}

// Validates a single known setting value. Used by backup/import flows where
// payload keys are not known statically.
export function validateSettingValue(
  key: string,
  value: unknown,
): { ok: true; value: unknown } | { ok: false; message: string } {
  const definition = getSettingDefinition(key);
  if (!definition) {
    return { ok: false, message: `Unknown setting "${key}".` };
  }
  const result = fieldSchema(definition).safeParse(value);
  if (!result.success) {
    return { ok: false, message: `${key}: ${result.error.issues[0]?.message ?? "Invalid value."}` };
  }
  return { ok: true, value: result.data };
}

export const settingsUpdateResponse = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), message: z.string() }),
  z.object({ ok: z.literal(false), message: z.string() }),
]);

export type SettingsUpdateResult = z.infer<typeof settingsUpdateResponse>;