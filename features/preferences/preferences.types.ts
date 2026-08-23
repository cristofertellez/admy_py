import type { SupportedLanguage, SupportedTheme } from "@/schemas/preferences";

export interface UserPreferences {
  language: SupportedLanguage;
  timezone: string;
  theme: SupportedTheme;
  dashboard_preferences: Record<string, unknown>;
}

export interface EditableUserPreferences {
  language: SupportedLanguage;
  timezone: string;
  theme: SupportedTheme;
}
