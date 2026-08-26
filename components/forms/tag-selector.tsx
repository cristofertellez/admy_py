"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_TAG_COLOR } from "@/constants";

export interface TagSelectorOption {
  id: string;
  name: string;
  color: string | null;
}

interface TagSelectorProps {
  tags: TagSelectorOption[];
  defaultSelected?: string[];
  name?: string;
  label?: string;
  hint?: string;
}

// Multi-select for tag assignments (Historia 6.10). Selected ids are submitted
// as repeated hidden inputs so plain FormData server actions receive them.
export function TagSelector({
  tags,
  defaultSelected = [],
  name = "tags",
  label = "Tags",
  hint,
}: TagSelectorProps) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  function toggle(tagId: string) {
    setSelected((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-body-sm font-medium text-body-strong">{label}</legend>
      {tags.length === 0 ? (
        <p className="text-caption text-muted">
          No tags defined yet. Create them in Dashboard &rarr; Tags.
        </p>
      ) : (
        <>
          <div
            role="group"
            aria-label={label}
            className="flex flex-wrap gap-2"
          >
            {tags.map((tag) => {
              const isSelected = selected.includes(tag.id);
              const color = tag.color || DEFAULT_TAG_COLOR;
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(tag.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-body-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "font-semibold"
                      : "border-hairline bg-transparent text-muted hover:bg-surface-card-elevated hover:text-body-strong",
                  )}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${color}20`,
                          borderColor: color,
                          color,
                        }
                      : undefined
                  }
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {tag.name}
                </button>
              );
            })}
          </div>
          {selected.map((tagId) => (
            <input key={tagId} type="hidden" name={name} value={tagId} />
          ))}
        </>
      )}
      {hint && <p className="text-caption text-muted-soft">{hint}</p>}
    </fieldset>
  );
}
