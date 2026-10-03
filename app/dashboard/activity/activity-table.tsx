"use client";

import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import type { ActivityLog } from "@/features/activity";

function renderChangeSummary(log: ActivityLog): string {
  const parse = (raw: string | null) => {
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.entries(parsed as Record<string, unknown>)
          .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
          .join("; ");
      }
      return String(parsed);
    } catch {
      return raw;
    }
  };

  const oldValue = parse(log.old_value);
  const newValue = parse(log.new_value);

  if (!oldValue && !newValue) return "—";
  if (oldValue && newValue) return `${oldValue} → ${newValue}`;
  return newValue ?? oldValue ?? "—";
}

// Historia 16.8 — each row can disclose the recorded old/new values, the
// responsible user, date and time of the change.
const columns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ getValue }) => <span className="text-body-strong">{getValue() as string}</span>,
  },
  {
    accessorKey: "entity",
    header: "Entity",
    cell: ({ getValue }) => <Badge>{getValue() as string}</Badge>,
  },
  {
    id: "user",
    header: "User",
    cell: ({ row }) =>
      row.original.user_first_name && row.original.user_last_name
        ? `${row.original.user_first_name} ${row.original.user_last_name}`
        : "—",
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
  },
  {
    id: "changes",
    header: "Changes",
    cell: ({ row }) => {
      const summary = renderChangeSummary(row.original);
      if (summary === "—") return <span className="text-muted-soft">—</span>;
      return (
        <details className="max-w-md">
          <summary className="cursor-pointer truncate text-caption text-primary">
            View change details
          </summary>
          <p className="mt-1 whitespace-pre-wrap break-words text-caption text-muted">{summary}</p>
        </details>
      );
    },
  },
];

interface ActivityTableProps {
  logs: ActivityLog[];
  total: number;
  pageIndex: number;
  pageSize: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (pagination: PaginationState) => void;
}

export function ActivityTable({
  logs,
  total,
  pageIndex,
  pageSize,
  searchValue,
  onSearchChange,
  onPaginationChange,
}: ActivityTableProps) {
  return (
    <DataTable
      columns={columns}
      data={logs}
      totalCount={total}
      searchColumn="action"
      searchPlaceholder="Search actions..."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      onPaginationChange={onPaginationChange}
      pageIndex={pageIndex}
      pageSize={pageSize}
    />
  );
}
