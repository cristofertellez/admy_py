import { queryOne } from "@/lib/turso/client";

// Épica 17 (17.12) — lightweight health endpoint for uptime monitoring and
// load balancers. Never exposes internal details; the database round-trip
// is the core signal.
export async function GET() {
  const startedAt = Date.now();
  let database = "ok";

  try {
    await queryOne<{ ok: number }>(`SELECT 1 AS ok`);
  } catch {
    database = "unavailable";
  }

  const healthy = database === "ok";

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: { database },
      latencyMs: Date.now() - startedAt,
      version: "v1",
    },
    { status: healthy ? 200 : 503 },
  );
}
