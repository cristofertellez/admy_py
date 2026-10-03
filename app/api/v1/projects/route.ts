import { withActor } from "@/lib/api/actor-context";
import {
  apiError,
  auditApiUsage,
  authenticateApiKey,
  isAuthFailure,
  paginatedEnvelope,
  parsePagination,
} from "@/lib/api/public-api";
import { ProjectsService } from "@/features/projects";
import type { NextRequest } from "next/server";

// Épica 17 (17.1) — GET /api/v1/projects. Read-only, paginated, filtered by
// status. Data-layer scopes resolve to the API key owner's visibility.
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (isAuthFailure(auth)) return auth;

  if (!auth.scopes.includes("read")) {
    return apiError(403, "This API key does not include the read scope.");
  }

  const url = new URL(request.url);
  const { page, pageSize } = parsePagination(url);
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  try {
    return await withActor(auth.profile, async () => {
      const result = await ProjectsService.list({
        status,
        search,
        page,
        pageSize,
      });

      await auditApiUsage({
        keyId: auth.keyId,
        userId: auth.profile.id,
        endpoint: "/api/v1/projects",
      });

      return paginatedEnvelope(result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    });
  } catch (err) {
    console.error("[api/v1/projects]", err instanceof Error ? err.message : err);
    return apiError(500, "Failed to list projects.");
  }
}
