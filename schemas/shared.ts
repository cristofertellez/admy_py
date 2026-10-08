import { z } from "zod";

// Shared Zod primitives used across domain schemas. Keep this file free of
// framework imports so it stays safe for both client and server validation.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Optional date (`YYYY-MM-DD` string or null/empty). Empty values normalize
 * to null so optional date columns always receive null instead of "".
 */
export const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (typeof value === "string" && value.trim() ? value.trim() : null))
  .refine((value) => value === null || DATE_PATTERN.test(value), {
    message: "Invalid date format.",
  });

/** Required calendar date in `YYYY-MM-DD` format. */
export const dateString = z.string().regex(DATE_PATTERN, "Use the YYYY-MM-DD format.");

/**
 * Optional UUID (or null/empty, normalized to null). The message should name
 * the entity, e.g. `optionalUuid("Invalid user.")`.
 */
export const optionalUuid = (message: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (typeof value === "string" && value.trim() ? value.trim() : null))
    .refine((value) => value === null || z.string().uuid().safeParse(value).success, {
      message,
    });

/**
 * Optional text bounded by `max` characters. Empty values stay as "" so
 * optional free-text columns are not required but never exceed the limit.
 */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .or(z.literal(""));

/** Time of day in 24h `HH:MM` format. */
export const timeString = z.string().regex(TIME_PATTERN, "Use the HH:MM format.");

/** Six-digit hex color (`#RRGGBB`). */
export const hexColor = z.string().trim().regex(HEX_COLOR_PATTERN, "Enter a valid hex color.");
