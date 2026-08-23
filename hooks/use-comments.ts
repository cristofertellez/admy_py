"use client";

import { useQuery } from "@tanstack/react-query";
import { CommentsService } from "@/features/comments";
import { queryKeys } from "./query-keys";

export function useProjectComments(projectId: string) {
  return useQuery({
    queryKey: queryKeys.comments.byProject(projectId),
    queryFn: () => CommentsService.listByProject(projectId),
    enabled: !!projectId,
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: queryKeys.comments.byTask(taskId),
    queryFn: () => CommentsService.listByTask(taskId),
    enabled: !!taskId,
  });
}
