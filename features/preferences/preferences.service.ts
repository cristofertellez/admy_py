import { query, queryOne } from "@/lib/turso/client";
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_THEMES,
  type SupportedLanguage,
  type SupportedTheme,
  type UpdatePreferencesInput,
} from "@/schemas/preferences";
import type { UserPreferences } from "./preferences.types";

interface UserPreferencesRow {
  language: string | null;
  timezone: string | null;
  theme: string | null;
  dashboard_preferences: string | null;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: "en",
  timezone: "UTC",
  theme: "dark",
  dashboard_preferences: {},
};

function toSupportedLanguage(value: string | null): SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage) ? (value as SupportedLanguage) : DEFAULT_PREFERENCES.language;
}

function toSupportedTheme(value: string | null): SupportedTheme {
  return SUPPORTED_THEMES.includes(value as SupportedTheme) ? (value as SupportedTheme) : DEFAULT_PREFERENCES.theme;
}

function parseDashboardPreferences(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function toUserPreferences(row: UserPreferencesRow): UserPreferences {
  return {
    language: toSupportedLanguage(row.language),
    timezone: row.timezone?.trim() || DEFAULT_PREFERENCES.timezone,
    theme: toSupportedTheme(row.theme),
    dashboard_preferences: parseDashboardPreferences(row.dashboard_preferences),
  };
}

export class PreferencesService {
  static async get(userId: string): Promise<UserPreferences> {
    const row = await queryOne<UserPreferencesRow>(
      "SELECT language, timezone, theme, dashboard_preferences FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    if (!row) {
      return DEFAULT_PREFERENCES;
    }

    return toUserPreferences(row);
  }

  static async update(userId: string, input: UpdatePreferencesInput): Promise<UserPreferences> {
    await query(
      `UPDATE users
       SET language = ?, timezone = ?, theme = ?, dashboard_preferences = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.language,
        input.timezone,
        input.theme,
        JSON.stringify(input.dashboard_preferences),
        new Date().toISOString(),
        userId,
      ],
    );

    return this.get(userId);
  }
}
