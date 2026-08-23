import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["en", "es"] as const;
export const SUPPORTED_THEMES = ["system", "light", "dark"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number];

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Timezone is required")
  .max(64, "Invalid timezone")
  .refine(isValidTimezone, "Invalid timezone");

export const dashboardPreferencesSchema = z.record(z.unknown());

export const updatePreferencesSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES, { message: "Invalid language" }),
  timezone: timezoneSchema,
  theme: z.enum(SUPPORTED_THEMES, { message: "Invalid theme" }),
  dashboard_preferences: dashboardPreferencesSchema.default({}),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
