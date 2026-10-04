import { queryOne } from "@/lib/turso/client";
import { getApiMetrics } from "@/lib/monitoring";

// Épica 17 (17.12) — lightweight health endpoint for uptime monitoring and
// load balancers. Never exposes internal details; the database round-trip
// is the core signal and the public API metrics add latency/error context.
export async function GET() {
  const startedAt = Date.now();
  let database = "ok";

  try {
    await queryOne<{ ok: number }>(`SELECT 1 AS ok`);
  } catch {
    database = "unavailable";
  }

  const healthy = database === "ok";
  const apiMetrics = getApiMetrics();

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: { database },
      latencyMs: Date.now() - startedAt,
      api: {
        sampledRequests: apiMetrics.totalSamples,
        recentErrors: apiMetrics.errors,
        averageLatencyMs: apiMetrics.averageLatencyMs,
        maxLatencyMs: apiMetrics.maxLatencyMs,
        uptimeSeconds: apiMetrics.uptimeSeconds,
      },
      version: "v1",
    },
    { status: healthy ? 200 : 503 },
  );
}
