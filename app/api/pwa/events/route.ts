import { getUser } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { NextResponse } from "next/server";

const PWA_EVENT_TYPES = new Set([
  "installed",
  "updated",
  "sync_completed",
  "offline_error",
  "reconnected",
]);

// Historia 14.14 — PWA lifecycle events (installation, updates,
// synchronization, offline errors and reconnection) are audited in the
// activity log like every other platform action.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { type, detail } = (payload ?? {}) as { type?: string; detail?: unknown };
  if (typeof type !== "string" || !PWA_EVENT_TYPES.has(type)) {
    return NextResponse.json({ error: "Unknown event type." }, { status: 400 });
  }

  await ActivityService.logAccessOnce({
    user_id: user.id,
    action: `pwa_${type}`,
    entity: "Pwa",
    new_value:
      typeof detail === "object" && detail !== null
        ? (detail as Record<string, unknown>)
        : undefined,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
