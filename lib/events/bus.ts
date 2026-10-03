import { after } from "next/server";
import { newId, query } from "@/lib/turso/client";
import { dispatchWebhookEvent, retryPendingWebhookDeliveries } from "@/features/webhooks";
import { AutomationsService } from "@/features/automations";

// Épica 17 (17.7) — internal event engine. `publish` persists the event to
// the durable system_events log and schedules the side channels (webhooks
// and automation rules) with `after()`, so slow outbound deliveries never
// delay the primary mutation. Publishing never throws.

export interface SystemEvent {
  type: string;
  payload?: Record<string, unknown>;
}

type EventHandler = (event: SystemEvent) => Promise<void>;

const handlers = new Map<string, Set<EventHandler>>();

export function subscribe(eventType: string, handler: EventHandler): () => void {
  const set = handlers.get(eventType) ?? new Set<EventHandler>();
  set.add(handler);
  handlers.set(eventType, set);
  return () => {
    set.delete(handler);
  };
}

async function persistEvent(event: SystemEvent): Promise<void> {
  try {
    await query(
      `INSERT INTO system_events (id, type, payload) VALUES (?, ?, ?)`,
      [newId(), event.type, event.payload ? JSON.stringify(event.payload) : null],
    );
  } catch (err) {
    console.error("[events] persist failed:", err instanceof Error ? err.message : err);
  }
}

async function runSideChannels(event: SystemEvent): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  const subscribers = handlers.get(event.type);
  if (subscribers) {
    for (const handler of subscribers) {
      tasks.push(handler(event).catch((err) => {
        console.error("[events] handler failed:", err instanceof Error ? err.message : err);
      }));
    }
  }

  // Webhooks subscribed to the event type receive a signed delivery (17.3);
  // previously failed deliveries are retried with bounded attempts.
  tasks.push(dispatchWebhookEvent(event).catch(() => undefined));

  // Automation rules matching the event type execute their actions (17.6).
  tasks.push(AutomationsService.executeForEvent(event).catch(() => undefined));

  await Promise.all(tasks);
  await retryPendingWebhookDeliveries().catch(() => undefined);
}

export async function publish(event: SystemEvent): Promise<void> {
  await persistEvent(event);
  after(async () => {
    await runSideChannels(event);
  });
}
