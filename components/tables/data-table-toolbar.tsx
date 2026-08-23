"use client";

import { Input } from "@/components/forms/input";
import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";
import { useState, useRef, useEffect } from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchColumn?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  searchColumn = "name",
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
}: DataTableToolbarProps<TData>) {
  const [showColumns, setShowColumns] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumns(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        placeholder={searchPlaceholder}
        value={
          onSearchChange
            ? (searchValue ?? "")
            : ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? "")
        }
        onChange={(event) => {
          if (onSearchChange) {
            onSearchChange(event.target.value);
          } else {
            table.getColumn(searchColumn)?.setFilterValue(event.target.value);
          }
        }}
        className="max-w-xs"
      />
      <div className="flex items-center gap-2">
        {table.getIsSomeRowsSelected() && (
          <p className="text-body-sm text-muted">
            {table.getFilteredSelectedRowModel().rows.length} selected
          </p>
        )}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumns(!showColumns)}
          >
            Columns
          </Button>
          {showColumns && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-hairline bg-surface-strong p-2 shadow-lg">
              {table.getAllColumns().map((column) => {
                if (!column.getCanHide()) return null;
                return (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-body-sm hover:bg-surface-card-elevated"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="rounded accent-primary"
                    />
                    {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
