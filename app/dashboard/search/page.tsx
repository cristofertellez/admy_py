"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/shared/badge";
import { Card } from "@/components/shared/card";
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const debouncedQuery = useDebounce(query, 300);

  function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("query", q);
      const { globalSearch } = await import("@/actions/search");
      const res = await globalSearch(null, formData);
      if (res.results) setResults(res.results);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Search</h1>
        <p className="mt-1 text-body-sm text-muted">
          Search across projects, tasks, clients, and milestones.
        </p>
      </div>

      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search projects, tasks, clients..."
          className="pl-10 h-12 text-body-md"
        />
      </div>

      {isPending && (
        <p className="text-body-sm text-muted">Searching...</p>
      )}

      {!isPending && hasSearched && results.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-body-sm text-muted-soft">
            No results found for &quot;{debouncedQuery}&quot;.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-body-sm text-muted">
            {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{debouncedQuery}&quot;
          </p>

          <div className="space-y-2">
            {results.map((result) => {
              const config = TYPE_CONFIG[result.type] || { label: result.type, icon: "?" };
              return (
                <Link key={`${result.type}-${result.id}`} href={result.url}>
                  <Card className="hover:bg-surface-hover transition-colors cursor-pointer p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-card-elevated text-caption-uppercase font-semibold text-muted">
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                        <p className="mt-1 text-caption text-muted">{result.subtitle}</p>
                      </div>
                      <svg
                        className="h-4 w-4 text-muted-soft shrink-0 mt-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
