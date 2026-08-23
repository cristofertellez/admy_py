"use client";

import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import type { ActivityLog } from "@/features/activity";

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
