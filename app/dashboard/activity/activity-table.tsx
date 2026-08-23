"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";

interface ActivityLogRow {
  id: string;
  action: string;
  entity: string;
  created_at: string;
  users?: { first_name: string; last_name: string } | null;
}

const columns: ColumnDef<ActivityLogRow>[] = [
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
    cell: ({ row }) => {
      const u = row.original.users;
      return u ? `${u.first_name} ${u.last_name}` : "—";
    },
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
  },
];

export function ActivityTable({ logs }: { logs: Record<string, unknown>[] }) {
  return (
    <DataTable
      columns={columns}
      data={logs as unknown as ActivityLogRow[]}
      searchColumn="action"
      searchPlaceholder="Search actions..."
    />
  );
}
