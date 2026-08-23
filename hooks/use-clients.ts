"use client";

import { useQuery } from "@tanstack/react-query";
import { ClientsService } from "@/features/clients";
import { queryKeys } from "./query-keys";
import type { ClientFilters } from "@/features/clients/clients.types";

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters as Record<string, unknown>),
    queryFn: () => ClientsService.list(filters),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => ClientsService.getById(id),
    enabled: !!id,
  });
}
