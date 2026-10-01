"use client";

import { useState } from "react";
import { Input } from "@/components/forms/input";
import { Button } from "@/components/ui/button";
import { TAG_COLOR_OPTIONS } from "@/constants";
import type { CatalogItem } from "@/features/settings/settings.definition";

interface CatalogEditorProps {
  name: string;
  value: CatalogItem[];
  onChange: (value: CatalogItem[]) => void;
  withColor?: boolean;
}

// Editable list of catalog items (statuses, priorities, categories, types).
// Each row edits the item value, label and an optional color; items can be
// added or removed. Stored as a controlled value by the parent settings form.
export function CatalogEditor({ name, value, onChange, withColor = false }: CatalogEditorProps) {
  const [draft, setDraft] = useState({ value: "", label: "", color: TAG_COLOR_OPTIONS[0] });

  function addItem() {
    const trimmedValue = draft.value.trim();
    const trimmedLabel = draft.label.trim();
    if (!trimmedValue || !trimmedLabel) return;
    onChange([...value, { value: trimmedValue, label: trimmedLabel, ...(withColor ? { color: draft.color } : {}) }]);
    setDraft({ value: "", label: "", color: TAG_COLOR_OPTIONS[0] });
  }

  function updateItem(index: number, patch: Partial<CatalogItem>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3" aria-label={name}>
      <ul className="flex flex-col gap-2">
        {value.map((item, index) => (
          <li key={`${item.value}-${index}`} className="flex items-center gap-2 rounded-md border border-hairline bg-surface-card p-2">
            {withColor && (
              <input
                type="color"
                value={item.color || TAG_COLOR_OPTIONS[0]}
                onChange={(e) => updateItem(index, { color: e.target.value })}
                className="h-8 w-8 shrink-0 cursor-pointer rounded border border-hairline"
                aria-label={`Color for ${item.label}`}
              />
            )}
            <Input
              value={item.value}
              onChange={(e) => updateItem(index, { value: e.target.value })}
              placeholder="Value"
              className="h-8 flex-1"
            />
            <Input
              value={item.label}
              onChange={(e) => updateItem(index, { label: e.target.value })}
              placeholder="Label"
              className="h-8 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              aria-label={`Remove ${item.label || item.value}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-end gap-2">
        <div className="flex flex-1 gap-2">
          <Input
            value={draft.value}
            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
            placeholder="Value"
            className="flex-1"
          />
          <Input
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Label"
            className="flex-1"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          Add
        </Button>
      </div>
    </div>
  );
}