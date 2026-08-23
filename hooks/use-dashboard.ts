"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/features/dashboard";

export function useDeveloperDashboard() {
  return useQuery({
    queryKey: ["dashboard", "developer", "stats"],
    queryFn: () => DashboardService.getDeveloperStats(),
    refetchInterval: 60 * 1000,
  });
}
