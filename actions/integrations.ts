"use server";

import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { ApiKeysService, API_KEY_SCOPES, type ApiKeyScope } from "@/features/api-keys";
import { WebhooksService, WEBHOOK_EVENT_TYPES } from "@/features/webhooks";
import {
  AutomationsService,
  AUTOMATION_ACTIONS,
  AUTOMATION_EVENTS,
  type AutomationAction,
} from "@/features/automations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionState = { success?: string; error?: string; secret?: string };

function revalidateIntegrations() {
  revalidatePath("/dashboard/integrations");
}

// ============================================================
// Historia 17.2 — API keys
// ============================================================

const createApiKeySchema = z.object({
  name: z.string().min(3, "Name must have at least 3 characters.").max(60),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1, "Select at least one scope."),
});

export async function createApiKey(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const parsed = createApiKeySchema.safeParse({
    name: formData.get("name") ?? "",
    scopes: formData.getAll("scopes").map(String).filter(Boolean),
  });
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const { id, key } = await ApiKeysService.create({
      name: parsed.data.name,
      scopes: parsed.data.scopes as ApiKeyScope[],
      createdBy: actor.id,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "created_api_key",
      entity: "ApiKey",
      entity_id: id,
      new_value: { name: parsed.data.name, scopes: parsed.data.scopes },
    });

    revalidateIntegrations();
    // The plaintext key is returned exactly once.
    return { success: "API key created. Copy it now — it will not be shown again.", secret: key };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create API key." };
  }
}

export async function revokeApiKey(id: string): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    await ApiKeysService.revoke(id);
    await ActivityService.log({
      user_id: actor.id,
      action: "revoked_api_key",
      entity: "ApiKey",
      entity_id: id,
    });
    revalidateIntegrations();
    return { success: "API key revoked." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to revoke API key." };
  }
}

export async function deleteApiKey(id: string): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    await ApiKeysService.remove(id);
    await ActivityService.log({
      user_id: actor.id,
      action: "deleted_api_key",
      entity: "ApiKey",
      entity_id: id,
    });
    revalidateIntegrations();
    return { success: "API key deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete API key." };
  }
}

// ============================================================
// Historia 17.3 — Webhooks
// ============================================================

const createWebhookSchema = z.object({
  name: z.string().min(3, "Name must have at least 3 characters.").max(60),
  url: z.string().url("Enter a valid https:// URL.").refine(
    (value) => value.startsWith("https://"),
    "Webhook URLs must use HTTPS.",
  ),
  events: z
    .array(z.enum(WEBHOOK_EVENT_TYPES))
    .min(1, "Subscribe to at least one event."),
});

export async function createWebhook(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const events = formData.getAll("events").map(String).filter(Boolean);
  const parsed = createWebhookSchema.safeParse({
    name: formData.get("name") ?? "",
    url: formData.get("url") ?? "",
    events: events.length > 0 ? events : undefined,
  });
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const { id, secret } = await WebhooksService.create({
      name: parsed.data.name,
      url: parsed.data.url,
      events: parsed.data.events,
      createdBy: actor.id,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "created_webhook",
      entity: "Webhook",
      entity_id: id,
      new_value: { name: parsed.data.name, url: parsed.data.url, events: parsed.data.events },
    });

    revalidateIntegrations();
    return { success: "Webhook created. Save the signing secret shown below.", secret };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create webhook." };
  }
}

export async function toggleWebhook(id: string, active: boolean): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    await WebhooksService.setActive(id, active);
    await ActivityService.log({
      user_id: actor.id,
      action: active ? "activated_webhook" : "deactivated_webhook",
      entity: "Webhook",
      entity_id: id,
    });
    revalidateIntegrations();
    return { success: active ? "Webhook activated." : "Webhook deactivated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update webhook." };
  }
}

export async function deleteWebhook(id: string): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    await WebhooksService.remove(id);
    await ActivityService.log({
      user_id: actor.id,
      action: "deleted_webhook",
      entity: "Webhook",
      entity_id: id,
    });
    revalidateIntegrations();
    return { success: "Webhook deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete webhook." };
  }
}

export async function retryWebhookDeliveries(): Promise<ActionState> {
  await requirePermission("settings.update");

  try {
    await WebhooksService.retryPendingDeliveries();
    revalidateIntegrations();
    return { success: "Pending deliveries retried." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to retry deliveries." };
  }
}

// ============================================================
// Historia 17.6 — Automation rules
// ============================================================

const createAutomationSchema = z.object({
  name: z.string().min(3, "Name must have at least 3 characters.").max(60),
  event: z.enum(AUTOMATION_EVENTS),
  action: z.enum(AUTOMATION_ACTIONS.map((option) => option.value) as [AutomationAction, ...AutomationAction[]]),
});

export async function createAutomation(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const parsed = createAutomationSchema.safeParse({
    name: formData.get("name") ?? "",
    event: formData.get("event") ?? "",
    action: formData.get("action") ?? "",
  });
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const id = await AutomationsService.create({
      name: parsed.data.name,
      event: parsed.data.event,
      action: parsed.data.action,
      createdBy: actor.id,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "created_automation",
      entity: "Automation",
      entity_id: id,
      new_value: { name: parsed.data.name, event: parsed.data.event, action: parsed.data.action },
    });

    revalidateIntegrations();
    return { success: "Automation rule created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create automation." };
  }
}

export async function toggleAutomation(id: string, active: boolean): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    await AutomationsService.setActive(id, active);
    await ActivityService.log({
      user_id: actor.id,
      action: active ? "activated_automation" : "deactivated_automation",
      entity: "Automation",
      entity_id: id,
    });
    revalidateIntegrations();
    return { success: active ? "Automation activated." : "Automation deactivated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update automation." };
  }
}

export async function deleteAutomation(id: string): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    await AutomationsService.remove(id);
    await ActivityService.log({
      user_id: actor.id,
      action: "deleted_automation",
      entity: "Automation",
      entity_id: id,
    });
    revalidateIntegrations();
    return { success: "Automation deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete automation." };
  }
}
