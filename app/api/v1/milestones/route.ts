import { withActor } from "@/lib/api/actor-context";
import {
  apiError,
  auditApiUsage,
  authenticateApiKey,
  isAuthFailure,
  withApiMetrics,
} from "@/lib/api/public-api";
import { MilestonesService } from "@/features/milestones";
import type { NextRequest } from "next/server";

// Épica 17 (17.1) — GET /api/v1/milestones?project={id} (project is
// required so the response stays bounded and scope-verifiable).
async function handle(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (isAuthFailure(auth)) return auth;

  if (!auth.scopes.includes("read")) {
    return apiError(403, "This API key does not include the read scope.");
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("project");
  if (!projectId) {
    return apiError(400, "The `project` query parameter is required.");
  }

  try {
    return await withActor(auth.profile, async () => {
      const [milestones, summary] = await Promise.all([
        MilestonesService.listByProject(projectId, {
          search: url.searchParams.get("search") || undefined,
          status: url.searchParams.get("status") || undefined,
        }),
        MilestonesService.getProjectSummary(projectId),
      ]);

      await auditApiUsage({
        keyId: auth.keyId,
        userId: auth.profile.id,
        endpoint: "/api/v1/milestones",
      });

      return Response.json({ data: milestones, summary, version: "v1" });
    });
  } catch (err) {
    console.error("[api/v1/milestones]", err instanceof Error ? err.message : err);
    return apiError(500, "Failed to list milestones.");
  }
}

export const GET = withApiMetrics("/api/v1/milestones", handle);
