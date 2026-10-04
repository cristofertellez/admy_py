import { withActor } from "@/lib/api/actor-context";
import {
  apiError,
  auditApiUsage,
  authenticateApiKey,
  isAuthFailure,
  paginatedEnvelope,
  parsePagination,
  withApiMetrics,
} from "@/lib/api/public-api";
import { TasksService } from "@/features/tasks";
import type { NextRequest } from "next/server";

// Épica 17 (17.1) — GET /api/v1/tasks. Filters: status, priority, assignee,
// project and free search; standard pagination envelope.
async function handle(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (isAuthFailure(auth)) return auth;

  if (!auth.scopes.includes("read")) {
    return apiError(403, "This API key does not include the read scope.");
  }

  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);

  try {
    return await withActor(auth.profile, async () => {
      const result = await TasksService.list({
        status: url.searchParams.get("status") || undefined,
        priority: url.searchParams.get("priority") || undefined,
        assignedTo: url.searchParams.get("assignee") || undefined,
        projectId: url.searchParams.get("project") || undefined,
        search: url.searchParams.get("search") || undefined,
        page,
        pageSize,
      });

      await auditApiUsage({
        keyId: auth.keyId,
        userId: auth.profile.id,
        endpoint: "/api/v1/tasks",
      });

      return paginatedEnvelope(result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    });
  } catch (err) {
    console.error("[api/v1/tasks]", err instanceof Error ? err.message : err);
    return apiError(500, "Failed to list tasks.");
  }
}

export const GET = withApiMetrics("/api/v1/tasks", handle);
