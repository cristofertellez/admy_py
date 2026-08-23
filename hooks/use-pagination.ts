"use client";

import { useState, useCallback } from "react";

interface UsePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  total?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { defaultPage = 1, defaultPageSize = 20, total = 0 } = options;

  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const goToPage = useCallback((targetPage: number) => {
    setPage(Math.max(1, Math.min(targetPage, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) setPage((p) => p - 1);
  }, [hasPrevious]);

  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    totalPages,
    hasPrevious,
    hasNext,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
  };
}
