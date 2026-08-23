"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All events" },
  { value: "client", label: "Client management" },
  { value: "projects", label: "Projects" },
  { value: "files", label: "Files" },
  { value: "comments", label: "Comments" },
  { value: "intermediaries", label: "Intermediaries" },
];

const controlClasses =
  "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

interface HistoryFiltersProps {
  initialSearch: string;
  category: string;
  onNavigate: (overrides: Record<string, string | undefined>) => void;
}

export function HistoryFilters({ initialSearch, category, onNavigate }: HistoryFiltersProps) {
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch === initialSearch) return;
    onNavigate({ q: debouncedSearch.trim() || undefined, page: undefined });
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label
          htmlFor="client-history-search"
          className="mb-1.5 block text-body-sm font-medium text-body-strong"
        >
          Search
        </label>
        <input
          id="client-history-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by event, user, or details"
          className={controlClasses}
        />
      </div>
      <div className="w-full sm:w-52">
        <label
          htmlFor="client-history-category"
          className="mb-1.5 block text-body-sm font-medium text-body-strong"
        >
          Event type
        </label>
        <select
          id="client-history-category"
          value={category}
          onChange={(event) => onNavigate({ category: event.target.value || undefined, page: undefined })}
          className={controlClasses}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
