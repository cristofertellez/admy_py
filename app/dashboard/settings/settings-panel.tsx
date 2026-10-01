"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { updateSettings, exportSettings, importSettings, restoreSettings } from "@/actions/settings";
import {
  SETTING_CATEGORIES,
  type SettingCategoryId,
  type SettingDefinition,
} from "@/features/settings/settings.definition";
import type { CatalogItem } from "@/features/settings/settings.definition";
import { CatalogEditor } from "@/components/forms/catalog-editor";
import { FormSelect } from "@/components/forms/form-select";
import { Input } from "@/components/forms/input";
import { Textarea } from "@/components/forms/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  initialValues: Record<string, unknown>;
}

interface SettingsUpdateState {
  type: "success" | "error";
  message: string;
}

export function SettingsPanel({ initialValues }: SettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<SettingCategoryId>("organization");
  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const merged: Record<string, unknown> = {};
    for (const category of SETTING_CATEGORIES) {
      for (const setting of category.settings) {
        merged[setting.key] =
          initialValues[setting.key] !== undefined ? initialValues[setting.key] : setting.defaultValue;
      }
    }
    return merged;
  });
  const [feedback, setFeedback] = useState<SettingsUpdateState | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const query = search.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!query) return [];
    const results: { category: (typeof SETTING_CATEGORIES)[number]; setting: SettingDefinition }[] = [];
    for (const category of SETTING_CATEGORIES) {
      for (const setting of category.settings) {
        if (
          setting.label.toLowerCase().includes(query) ||
          setting.key.toLowerCase().includes(query)
        ) {
          results.push({ category, setting });
        }
      }
    }
    return results;
  }, [query]);

  const activeSettings =
    SETTING_CATEGORIES.find((c) => c.id === activeCategory)?.settings ?? [];

  function setValue(key: string, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  }

  function handleSave(categoryId: SettingCategoryId) {
    const category = SETTING_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;

    const payload: Record<string, unknown> = {};
    for (const setting of category.settings) {
      payload[setting.key] = values[setting.key] ?? setting.defaultValue;
    }

    startTransition(async () => {
      const result = await updateSettings(categoryId, payload);
      setFeedback({
        type: result.ok ? "success" : "error",
        message: result.message,
      });
    });
  }

  async function handleExport() {
    try {
      const data = await exportSettings();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "settings-backup.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setFeedback({ type: "success", message: "Configuration exported." });
    } catch {
      setFeedback({ type: "error", message: "Failed to export configuration." });
    }
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        const result = await importSettings(parsed);
        setFeedback({ type: result.ok ? "success" : "error", message: result.message });
        if (result.ok) {
          window.location.reload();
        }
      } catch {
        setFeedback({ type: "error", message: "Invalid backup file." });
      }
    };
    reader.readAsText(file);
  }

  function handleRestoreDefaults(categoryId: SettingCategoryId) {
    const category = SETTING_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;
    const confirmed = window.confirm(
      `Restore "${category.label}" settings to their defaults? This cannot be undone.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      const result = await restoreSettings(categoryId);
      setFeedback({ type: result.ok ? "success" : "error", message: result.message });
      if (result.ok) {
        window.location.reload();
      }
    });
  }

  function renderField(setting: SettingDefinition) {
    const value = values[setting.key];
    const key = setting.key;
    const isCatalog = setting.type === "catalog";
    const catalogValue = (Array.isArray(value) ? value : []) as CatalogItem[];

    switch (setting.type) {
      case "textarea":
        return (
          <Textarea
            name={key}
            value={(value as string) ?? ""}
            onChange={(e) => setValue(key, e.target.value)}
            rows={3}
          />
        );
      case "boolean":
        return (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => setValue(key, e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="text-body-sm text-body-strong">Enabled</span>
          </label>
        );
      case "select":
        return (
          <FormSelect
            name={key}
            label=""
            value={(value as string) ?? ""}
            onChange={(e) => setValue(key, e.target.value)}
            options={setting.options?.map((o) => ({ value: o.value, label: o.label })) ?? []}
          />
        );
      case "color":
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={(value as string) || "#000000"}
              onChange={(e) => setValue(key, e.target.value)}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-hairline bg-surface-card"
            />
            <Input
              name={key}
              type="text"
              value={(value as string) ?? ""}
              onChange={(e) => setValue(key, e.target.value)}
              className="max-w-[8rem] font-mono text-body-sm uppercase"
              placeholder="#000000"
            />
          </div>
        );
      case "catalog":
        return (
          <CatalogEditor
            name={key}
            value={catalogValue}
            onChange={(items) => setValue(key, items)}
            withColor={isCatalog}
          />
        );
      case "number":
        return (
          <Input
            name={key}
            type="number"
            value={value as number}
            min={setting.min}
            max={setting.max}
            onChange={(e) => setValue(key, e.target.value === "" ? 0 : Number(e.target.value))}
          />
        );
      default:
        return (
          <Input
            name={key}
            type={setting.type === "email" ? "email" : setting.type === "url" ? "url" : "text"}
            value={(value as string) ?? ""}
            placeholder={setting.placeholder}
            onChange={(e) => setValue(key, e.target.value)}
          />
        );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search settings..."
          className="mb-2 h-10 w-full rounded-md border border-hairline bg-surface-card px-3 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search settings"
        />
        {SETTING_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              setActiveCategory(category.id);
              setSearch("");
              setFeedback(null);
            }}
            className={cn(
              "rounded-md px-3 py-2 text-left text-body-sm font-medium transition-colors",
              activeCategory === category.id && !query
                ? "bg-surface-card text-body-strong"
                : "text-muted hover:bg-surface-card hover:text-body-strong",
            )}
          >
            {category.label}
          </button>
        ))}
      </aside>

      <div className="space-y-6">
        {query ? (
          searchResults.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-body-sm text-muted">No settings match “{search}”.</p>
              </CardContent>
            </Card>
          ) : (
            searchResults.map(({ category, setting }) => (
              <Card key={setting.key}>
                <CardHeader>
                  <CardTitle>{setting.label}</CardTitle>
                  <span className="text-caption text-muted-soft">{category.label}</span>
                </CardHeader>
                <CardContent className="space-y-2">
                  {setting.description && (
                    <p className="text-body-sm text-muted">{setting.description}</p>
                  )}
                  {renderField(setting)}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleSave(category.id)}
                    >
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        ) : (
          <>
          <Card>
            <CardHeader>
              <CardTitle>
                {SETTING_CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleRestoreDefaults(activeCategory)}
              >
                Restore Defaults
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {activeSettings.map((setting) => (
                <div key={setting.key} className="flex flex-col gap-1.5">
                  <label className="text-body-sm font-medium text-body-strong">
                    {setting.label}
                  </label>
                  {setting.description && (
                    <p className="text-body-sm text-muted-soft">{setting.description}</p>
                  )}
                  {renderField(setting)}
                </div>
              ))}

              {feedback && (
                <p
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "rounded-md px-4 py-3 text-body-sm",
                    feedback.type === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error",
                  )}
                >
                  {feedback.message}
                </p>
              )}

              <div className="pt-2">
                <Button disabled={isPending} onClick={() => handleSave(activeCategory)}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-sm text-muted">
                Export the full configuration as a JSON backup, or import a previous backup to restore it.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleExport}>
                  Export
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </div>
  );
}