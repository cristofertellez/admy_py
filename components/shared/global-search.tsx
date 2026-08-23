"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/shared/badge";
import { Input } from "@/components/forms/input";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import type { SearchResult } from "@/actions/search";

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  project: { label: "Project", icon: "P" },
  task: { label: "Task", icon: "T" },
  client: { label: "Client", icon: "C" },
  milestone: { label: "Milestone", icon: "M" },
};

const STATUS_COLORS: Record<string, "success" | "error" | "warning" | "default"> = {
  Completed: "success",
  Active: "success",
  Blocked: "error",
  Archived: "default",
  Suspended: "warning",
  Cancelled: "error",
};

export function GlobalSearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const latestTermRef = useRef("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term.length < 2) {
      latestTermRef.current = "";
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    latestTermRef.current = term;
    setHasSearched(true);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("query", term);
      const { globalSearch } = await import("@/actions/search");
      const res = await globalSearch(null, formData);
      if (latestTermRef.current !== term) return;
      if (res.error) {
        setError(res.error);
        setResults([]);
        return;
      }
      setError(null);
      if (res.results) setResults(res.results);
    });
  }, [debouncedQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-hairline-strong bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, clients..."
            className="pl-11 h-14 text-body-md border-0 border-b border-hairline rounded-b-none"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {isPending && (
            <p className="px-3 py-6 text-body-sm text-muted text-center">Searching...</p>
          )}

          {!isPending && error && (
            <p role="alert" className="px-3 py-6 text-body-sm text-error text-center">
              {error}
            </p>
          )}

          {!isPending && !error && hasSearched && results.length === 0 && (
            <p className="px-3 py-6 text-body-sm text-muted-soft text-center">
              No results for &quot;{query}&quot;.
            </p>
          )}

          {!isPending && !error && results.length > 0 && (
            <div className="space-y-1">
              {results.map((result) => {
                const config = TYPE_CONFIG[result.type] || { label: result.type, icon: "?" };
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.url}
                    onClick={onClose}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-card transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-card-elevated text-caption-uppercase font-semibold text-muted">
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-body-sm font-medium text-body-strong truncate">
                          {result.title}
                        </span>
                        <Badge>{config.label}</Badge>
                        {result.status && (
                          <Badge variant={STATUS_COLORS[result.status] || "default"}>
                            {result.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-caption text-muted">{result.subtitle}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!hasSearched && (
            <p className="px-3 py-6 text-body-sm text-muted-soft text-center">
              Start typing to search across all projects, tasks, clients, and milestones.
            </p>
          )}
        </div>

        <div className="border-t border-hairline px-4 py-2.5 flex items-center justify-between">
          <span className="text-caption text-muted-soft">Press Esc to close</span>
          <Link
            href="/dashboard/search"
            onClick={onClose}
            className="text-caption text-primary hover:underline"
          >
            Advanced search →
          </Link>
        </div>
      </div>
    </div>
  );
}
