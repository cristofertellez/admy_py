import { SettingsService } from "./service";
import type { CatalogItem } from "./settings.definition";

export interface Option {
  value: string;
  label: string;
}

// Returns the configured catalog for a settings key as { value, label } options,
// falling back to the provided defaults when the setting is not set or empty.
export async function getCatalogOptions(
  key: string,
  fallback: readonly { value: string; label: string }[],
): Promise<Option[]> {
  const raw = await SettingsService.getValue(key);
  if (!Array.isArray(raw)) {
    return [...fallback];
  }
  const options: Option[] = (raw as CatalogItem[])
    .filter((item) => item && typeof item.value === "string" && item.value.length > 0)
    .map((item) => ({ value: item.value, label: item.label || item.value }));
  return options.length > 0 ? options : [...fallback];
}

// Same as getCatalogOptions but returns plain string values.
export async function getCatalogValues(
  key: string,
  fallback: readonly string[],
): Promise<string[]> {
  const options = await getCatalogOptions(
    key,
    fallback.map((value) => ({ value, label: value })),
  );
  return options.map((option) => option.value);
}

// Server-side guard used by actions: returns true when the value is present in
// the configured catalog (falling back to the built-in allowed values).
export async function isValidCatalogValue(
  key: string,
  value: unknown,
  fallback: readonly string[],
): Promise<boolean> {
  if (typeof value !== "string") return false;
  const allowed = await getCatalogValues(key, fallback);
  return allowed.includes(value);
}