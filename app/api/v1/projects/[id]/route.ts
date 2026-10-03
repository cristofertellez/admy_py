import { isAccessDeniedError } from "@/lib/auth-scope";
import { withActor } from "@/lib/api/actor-context";
import {
  apiError,
  auditApiUsage,
  authenticateApiKey,
  isAuthFailure,
} from "@/lib/api/public-api";
import { ProjectsService } from "@/features/projects";
import { TasksService } from "@/features/tasks";
import { MilestonesService } from "@/features/milestones";
import type { NextRequest } from "next/server";

// Épica 17 (17.1) — GET /api/v1/projects/{id}: project detail with its
// latest tasks and milestones. Visibility follows the key owner's scope.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(request);
  if (isAuthFailure(auth)) return auth;

  if (!auth.scopes.includes("read")) {
    return apiError(403, "This API key does not include the read scope.");
  }

  const { id } = await context.params;

  try {
    return await withActor(auth.profile, async () => {
      const project = await ProjectsService.getById(id);
      const [tasks, milestones] = await Promise.all([
        TasksService.list({ projectId: id, page: 1, pageSize: 20 }),
        MilestonesService.listByProject(id),
      ]);

      await auditApiUsage({
        keyId: auth.keyId,
        userId: auth.profile.id,
        endpoint: "/api/v1/projects/{id}",
      });

      return Response.json({
        data: {
          project,
          tasks: tasks.data,
          taskPagination: { page: tasks.page, pageSize: tasks.pageSize, total: tasks.total },
          milestones,
        },
        version: "v1",
      });
    });
  } catch (err) {
    if (isAccessDeniedError(err)) return apiError(404, "Project not found.");
    console.error("[api/v1/projects/{id}]", err instanceof Error ? err.message : err);
    return apiError(500, "Failed to load project.");
  }
}
