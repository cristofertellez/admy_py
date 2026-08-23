"use client";

import { useQuery } from "@tanstack/react-query";
import { TasksService } from "@/features/tasks";
import { queryKeys } from "./query-keys";
import type { TaskFilters } from "@/features/tasks/tasks.types";

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters as Record<string, unknown>),
    queryFn: () => TasksService.list(filters),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => TasksService.getById(id),
    enabled: !!id,
  });
}
