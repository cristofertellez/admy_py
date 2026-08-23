"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActivityTable } from "./activity-table";
import { ActivityTimeline } from "./activity-timeline";
import { useDebounce } from "@/hooks/use-debounce";
import type { ActivityLog, ActivityUserOption, ActivityView as ViewMode } from "@/features/activity";

interface ActivityViewProps {
  logs: ActivityLog[];
  total: number;
  users: ActivityUserOption[];
  entities: string[];
  initialFilters: { search: string; user: string; entity: string };
  view: ViewMode;
  pageIndex: number;
  pageSize: number;
}

export function ActivityView({
  logs,
  total,
  users,
  entities,
  initialFilters,
  view,
  pageIndex,
  pageSize,
}: ActivityViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [, startTransition] = useTransition();
  const debouncedSearch = useDebounce(searchInput, 400);

  function navigate(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  useEffect(() => {
    if (debouncedSearch === initialFilters.search) return;
    navigate({ search: debouncedSearch || undefined, page: undefined });
  }, [debouncedSearch]);

  const selectClasses =
    "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <label htmlFor="activity-user-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
              User
            </label>
            <select
              id="activity-user-filter"
              value={initialFilters.user}
              onChange={(e) => navigate({ user: e.target.value || undefined, page: undefined })}
              className={selectClasses}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {formatUserName(u.first_name, u.last_name)}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label htmlFor="activity-entity-filter" className="mb-1.5 block text-body-sm font-medium text-body-strong">
              Entity
            </label>
            <select
              id="activity-entity-filter"
              value={initialFilters.entity}
              onChange={(e) => navigate({ entity: e.target.value || undefined, page: undefined })}
              className={selectClasses}
            >
              <option value="">All entities</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          role="tablist"
          aria-label="View mode"
          className="flex w-fit rounded-md border border-hairline bg-surface-card p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "table"}
            onClick={() => navigate({ view: undefined })}
            className={`rounded-md px-3 py-1.5 text-caption transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
              view === "table" ? "bg-surface-card-elevated text-body-strong font-medium" : "text-muted hover:text-body-strong"
            }`}
          >
            Table
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "timeline"}
            onClick={() => navigate({ view: "timeline", page: undefined })}
            className={`rounded-md px-3 py-1.5 text-caption transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
              view === "timeline" ? "bg-surface-card-elevated text-body-strong font-medium" : "text-muted hover:text-body-strong"
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {view === "timeline" ? (
        <ActivityTimeline
          logs={logs}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={(nextPageIndex) =>
            navigate({ page: nextPageIndex === 0 ? undefined : String(nextPageIndex + 1) })
          }
        />
      ) : (
        <ActivityTable
          logs={logs}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onPaginationChange={(pagination) =>
            navigate({ page: pagination.pageIndex === 0 ? undefined : String(pagination.pageIndex + 1) })
          }
        />
      )}
    </div>
  );
}

function formatUserName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}
