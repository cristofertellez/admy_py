import { createHmac, randomBytes } from "node:crypto";
import { newId, query } from "@/lib/turso/client";
import type { SystemEvent } from "@/lib/events/bus";

// Épica 17 (17.3) — Webhooks: signed deliveries with a retry queue.
// The HMAC-SHA256 signature (x-admipy-signature header) lets receivers
// verify authenticity; failed deliveries stay pending and are retried with
// a bounded attempt count.

export interface WebhookRow {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string;
  active: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WebhookDeliveryView {
  id: string;
  webhook_id: string;
  webhook_name?: string;
  webhook_url?: string;
  event: string;
  payload: string;
  status_code: number | null;
  attempt: number;
  max_attempts: number;
  error: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface WebhookView {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export const WEBHOOK_EVENT_TYPES = [
  "project.created",
  "project.updated",
  "project.status_changed",
  "project.completed",
  "task.created",
  "task.status_changed",
  "task.assigned",
  "comment.created",
  "file.uploaded",
  "milestone.completed",
  "client.created",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

const DELIVERY_TIMEOUT_MS = 8000;

function parseEvents(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export class WebhooksService {
  static generateSecret(): string {
    return randomBytes(24).toString("hex");
  }

  static async create(input: {
    name: string;
    url: string;
    events: string[];
    createdBy: string;
  }): Promise<{ id: string; secret: string }> {
    const id = newId();
    const secret = WebhooksService.generateSecret();

    await query(
      `INSERT INTO webhooks (id, name, url, secret, events, active, created_by)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [id, input.name, input.url, secret, JSON.stringify(input.events), input.createdBy],
    );

    return { id, secret };
  }

  static async update(
    id: string,
    input: {
      name: string;
      url: string;
      events: string[];
      active?: boolean;
    },
  ): Promise<void> {
    const params: (string | number)[] = [
      input.name,
      input.url,
      JSON.stringify(input.events),
      new Date().toISOString(),
    ];

    let sql = `UPDATE webhooks SET name = ?, url = ?, events = ?, updated_at = ?`;
    if (input.active !== undefined) {
      sql += `, active = ?`;
      params.push(input.active ? 1 : 0);
    }
    sql += ` WHERE id = ? AND deleted_at IS NULL`;
    params.push(id);

    await query(sql, params);
  }

  static async list(): Promise<WebhookView[]> {
    const rows = await query<WebhookRow>(
      `SELECT * FROM webhooks WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      events: parseEvents(row.events),
      active: row.active === 1,
    }));
  }

  static async getById(id: string): Promise<WebhookRow | null> {
    const rows = await query<WebhookRow>(
      `SELECT * FROM webhooks WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  static async remove(id: string): Promise<void> {
    await query(`UPDATE webhooks SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      new Date().toISOString(),
      id,
    ]);
  }

  static async setActive(id: string, active: boolean): Promise<void> {
    await query(`UPDATE webhooks SET active = ?, updated_at = ? WHERE id = ?`, [
      active ? 1 : 0,
      new Date().toISOString(),
      id,
    ]);
  }

  static async listDeliveries(limit = 40, webhookId?: string): Promise<WebhookDeliveryView[]> {
    if (webhookId) {
      return query<WebhookDeliveryView>(
        `SELECT d.id, d.webhook_id, d.event, d.payload, d.status_code, d.attempt, d.max_attempts, d.error, d.delivered_at, d.created_at,
                w.name as webhook_name, w.url as webhook_url
         FROM webhook_deliveries d
         LEFT JOIN webhooks w ON w.id = d.webhook_id
         WHERE d.webhook_id = ?
         ORDER BY d.created_at DESC
         LIMIT ?`,
        [webhookId, limit],
      );
    }

    return query<WebhookDeliveryView>(
      `SELECT d.id, d.webhook_id, d.event, d.payload, d.status_code, d.attempt, d.max_attempts, d.error, d.delivered_at, d.created_at,
              w.name as webhook_name, w.url as webhook_url
       FROM webhook_deliveries d
       LEFT JOIN webhooks w ON w.id = d.webhook_id
       ORDER BY d.created_at DESC
       LIMIT ?`,
      [limit],
    );
  }

  static sign(secret: string, payload: string): string {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }

  /** Delivers one event to every active webhook subscribed to its type. */
  static async dispatchEvent(event: SystemEvent): Promise<void> {
    const hooks = await query<WebhookRow>(
      `SELECT * FROM webhooks WHERE deleted_at IS NULL AND active = 1`,
    );

    const body = JSON.stringify({
      type: event.type,
      payload: event.payload ?? {},
      sentAt: new Date().toISOString(),
    });

    for (const hook of hooks) {
      const events = parseEvents(hook.events);
      if (events.length > 0 && !events.includes(event.type)) continue;

      await query(
        `INSERT INTO webhook_deliveries (id, webhook_id, event, payload, attempt)
         VALUES (?, ?, ?, ?, 0)`,
        [newId(), hook.id, event.type, body],
      );
    }
  }

  /**
   * Tests a specific webhook immediately by sending a test payload,
   * recording the delivery, and measuring the HTTP roundtrip latency.
   */
  static async testWebhook(id: string): Promise<{
    success: boolean;
    statusCode: number | null;
    latencyMs: number;
    error?: string;
  }> {
    const hook = await WebhooksService.getById(id);
    if (!hook) {
      throw new Error("Webhook not found.");
    }

    const deliveryId = newId();
    const eventType = "webhook.test";
    const body = JSON.stringify({
      event: eventType,
      webhookId: hook.id,
      timestamp: new Date().toISOString(),
      testMessage: "Prueba de conectividad desde AdmiPy",
    });

    await query(
      `INSERT INTO webhook_deliveries (id, webhook_id, event, payload, attempt)
       VALUES (?, ?, ?, ?, 1)`,
      [deliveryId, hook.id, eventType, body],
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
    const startTime = Date.now();

    try {
      const response = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admipy-event": eventType,
          "x-admipy-signature": WebhooksService.sign(hook.secret, body),
        },
        body,
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;
      const status = response.status;
      const ok = response.ok;

      await query(
        `UPDATE webhook_deliveries SET status_code = ?, delivered_at = ?, error = ? WHERE id = ?`,
        [status, ok ? new Date().toISOString() : null, ok ? null : `HTTP ${status}`, deliveryId],
      );

      return {
        success: ok,
        statusCode: status,
        latencyMs,
        error: ok ? undefined : `HTTP ${status}`,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : "Error de red al conectar";

      await query(
        `UPDATE webhook_deliveries SET error = ? WHERE id = ?`,
        [errorMsg, deliveryId],
      );

      return {
        success: false,
        statusCode: null,
        latencyMs,
        error: errorMsg,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Retries an individual delivery immediately.
   */
  static async retrySingleDelivery(deliveryId: string): Promise<{
    success: boolean;
    statusCode: number | null;
    error?: string;
  }> {
    const rows = await query<{
      id: string;
      webhook_id: string;
      event: string;
      payload: string;
      attempt: number;
      max_attempts: number;
      url: string;
      secret: string;
    }>(
      `SELECT d.id, d.webhook_id, d.event, d.payload, d.attempt, d.max_attempts, w.url, w.secret
       FROM webhook_deliveries d
       JOIN webhooks w ON w.id = d.webhook_id
       WHERE d.id = ? LIMIT 1`,
      [deliveryId],
    );

    const delivery = rows[0];
    if (!delivery) {
      throw new Error("Entrega no encontrada.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    try {
      const response = await fetch(delivery.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admipy-event": delivery.event,
          "x-admipy-signature": WebhooksService.sign(delivery.secret, delivery.payload),
        },
        body: delivery.payload,
        signal: controller.signal,
      });

      const ok = response.ok;
      await query(
        `UPDATE webhook_deliveries
         SET status_code = ?, attempt = attempt + 1, delivered_at = ?, error = ?
         WHERE id = ?`,
        [
          response.status,
          ok ? new Date().toISOString() : null,
          ok ? null : `HTTP ${response.status}`,
          delivery.id,
        ],
      );

      return {
        success: ok,
        statusCode: response.status,
        error: ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error de conexión";
      await query(
        `UPDATE webhook_deliveries
         SET attempt = attempt + 1, error = ?
         WHERE id = ?`,
        [errorMsg, delivery.id],
      );

      return {
        success: false,
        statusCode: null,
        error: errorMsg,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Processes pending deliveries.
   */
  static async retryPendingDeliveries(): Promise<void> {
    const pending = await query<{
      id: string;
      webhook_id: string;
      event: string;
      payload: string;
      attempt: number;
      max_attempts: number;
      url: string;
      secret: string;
    }>(
      `SELECT d.id, d.webhook_id, d.event, d.payload, d.attempt, d.max_attempts, w.url, w.secret
       FROM webhook_deliveries d
       JOIN webhooks w ON w.id = d.webhook_id
       WHERE d.delivered_at IS NULL AND d.attempt < d.max_attempts
       ORDER BY d.created_at ASC
       LIMIT 10`,
    );

    for (const delivery of pending) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
      try {
        const response = await fetch(delivery.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admipy-event": delivery.event,
            "x-admipy-signature": WebhooksService.sign(delivery.secret, delivery.payload),
          },
          body: delivery.payload,
          signal: controller.signal,
        });

        if (response.ok) {
          await query(
            `UPDATE webhook_deliveries SET status_code = ?, attempt = attempt + 1, delivered_at = ?, error = NULL WHERE id = ?`,
            [response.status, new Date().toISOString(), delivery.id],
          );
        } else {
          await query(
            `UPDATE webhook_deliveries SET status_code = ?, attempt = attempt + 1, error = ? WHERE id = ?`,
            [response.status, `HTTP ${response.status}`, delivery.id],
          );
        }
      } catch (err) {
        await query(
          `UPDATE webhook_deliveries SET attempt = attempt + 1, error = ? WHERE id = ?`,
          [err instanceof Error ? err.message : "Network error", delivery.id],
        );
      } finally {
        clearTimeout(timeout);
      }
    }
  }
}

export async function dispatchWebhookEvent(event: SystemEvent): Promise<void> {
  await WebhooksService.dispatchEvent(event);
}

export async function retryPendingWebhookDeliveries(): Promise<void> {
  await WebhooksService.retryPendingDeliveries();
}
