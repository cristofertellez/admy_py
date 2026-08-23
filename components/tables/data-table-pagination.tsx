"use client";

import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount?: number;
}

export function DataTablePagination<TData>({ table, totalCount }: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const rowCount = totalCount ?? table.getFilteredRowModel().rows.length;
  const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, rowCount);

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="text-body-sm text-muted">
        Showing {from}–{to} of {rowCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(table.getPageCount(), 7) }).map((_, i) => {
            const currentPage = pageIndex;
            const totalPages = table.getPageCount();

            let pageNumber: number;
            if (totalPages <= 7) {
              pageNumber = i;
            } else if (currentPage <= 3) {
              pageNumber = i;
            } else if (currentPage >= totalPages - 4) {
              pageNumber = totalPages - 7 + i;
            } else {
              pageNumber = currentPage - 3 + i;
            }

            if (pageNumber < 0 || pageNumber >= totalPages) return null;

            return (
              <button
                key={pageNumber}
                onClick={() => table.setPageIndex(pageNumber)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-body-sm transition-colors ${
                  pageNumber === currentPage
                    ? "bg-primary text-on-primary"
                    : "text-muted hover:bg-surface-card"
                }`}
              >
                {pageNumber + 1}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
