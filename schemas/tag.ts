import { z } from "zod";
import { DEFAULT_TAG_COLOR, TAG_COLOR_OPTIONS } from "@/constants";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

// Colors are restricted to the shared tag palette so every chip stays inside
// the design system (Historia 6.10).
const paletteColor = z
  .string()
  .trim()
  .regex(HEX_COLOR_PATTERN, "Invalid color format.")
  .refine((value) => (TAG_COLOR_OPTIONS as readonly string[]).includes(value.toUpperCase()), {
    message: "Color must be selected from the tag palette.",
  })
  .transform((value) => value.toUpperCase());

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(50, "Tag name is too long"),
  color: paletteColor.default(DEFAULT_TAG_COLOR),
});

export type TagInput = z.infer<typeof tagSchema>;

export const projectIdSchema = z.string().uuid("Invalid project.");

// Tags arrive from forms as repeated "tags" fields; anything that is not a
// non-empty string is ignored instead of failing the whole submission.
export function parseTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}
