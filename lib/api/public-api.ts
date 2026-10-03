import { NextResponse } from "next/server";
import { ApiKeysService } from "@/features/api-keys";
import { ActivityService } from "@/services/activity.service";
import type { SessionProfile } from "@/lib/auth";
import type { ApiKeyScope } from "@/features/api-keys";

// Épica 17 (17.1/17.2) — shared helpers for the versioned public API:
// Bearer key authentication, per-key rate limiting and the standard JSON
// envelope with pagination metadata.

export const API_RATE_LIMIT_PER_MINUTE = 60;

interface RateWindow {
  count: number;
  resetAt: number;
}

const rateWindows = new Map<string, RateWindow>();

export function isRateLimited(keyId: string, limit = API_RATE_LIMIT_PER_MINUTE): boolean {
  const now = Date.now();
  const window = rateWindows.get(keyId);

  if (!window || window.resetAt <= now) {
    rateWindows.set(keyId, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  window.count += 1;
  return window.count > limit;
}

export function apiError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export interface ApiAuthResult {
  profile: SessionProfile;
  scopes: ApiKeyScope[];
  keyId: string;
}

export async function authenticateApiKey(request: Request): Promise<ApiAuthResult | NextResponse> {
  const authorization = request.headers.get("authorization") ?? "";
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key");
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  const key = bearer || queryKey;

  if (!key) {
    return apiError(401, "Missing API key. Use the Authorization: Bearer <key> header.");
  }

  const result = await ApiKeysService.authenticate(key);
  if (!result) {
    return apiError(401, "Invalid, expired or revoked API key.");
  }

  if (isRateLimited(result.keyId)) {
    return apiError(429, "Rate limit exceeded. Try again in a minute.");
  }

  return result;
}

export function isAuthFailure(result: ApiAuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

export async function auditApiUsage(input: {
  keyId: string;
  userId: string;
  endpoint: string;
}): Promise<void> {
  await ActivityService.logAccessOnce({
    user_id: input.userId,
    action: "used_api",
    entity: "ApiKey",
    entity_id: input.keyId,
    new_value: { endpoint: input.endpoint },
  }).catch(() => undefined);
}

export function paginatedEnvelope<T>(
  data: T[],
  args: { page: number; pageSize: number; total: number },
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      page: args.page,
      pageSize: args.pageSize,
      total: args.total,
      totalPages: Math.max(1, Math.ceil(args.total / args.pageSize)),
    },
    version: "v1",
  });
}

export function parsePagination(url: URL): { page: number; pageSize: number } {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSizeRaw = Number.parseInt(url.searchParams.get("pageSize") || "20", 10) || 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  return { page, pageSize };
}
