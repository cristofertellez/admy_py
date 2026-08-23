"use client";

import { useQuery } from "@tanstack/react-query";
import { ProjectsService } from "@/features/projects";
import { queryKeys } from "./query-keys";
import type { ProjectFilters } from "@/features/projects/projects.types";

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters as Record<string, unknown>),
    queryFn: () => ProjectsService.list(filters),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => ProjectsService.getById(id),
    enabled: !!id,
  });
}
