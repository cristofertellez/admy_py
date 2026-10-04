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
import { ClientsService } from "@/features/clients";
import type { NextRequest } from "next/server";

// Épica 17 (17.1) — GET /api/v1/clients. The key owner only receives the
// clients allowed by their role scope (auth-scope.ts).
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
      const result = await ClientsService.list({
        search: url.searchParams.get("search") || undefined,
        status: url.searchParams.get("status") || undefined,
        page,
        pageSize,
      });

      await auditApiUsage({
        keyId: auth.keyId,
        userId: auth.profile.id,
        endpoint: "/api/v1/clients",
      });

      return paginatedEnvelope(result.data, {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    });
  } catch (err) {
    console.error("[api/v1/clients]", err instanceof Error ? err.message : err);
    return apiError(500, "Failed to list clients.");
  }
}

export const GET = withApiMetrics("/api/v1/clients", handle);
