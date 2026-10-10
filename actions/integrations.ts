"use server";

import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { ApiKeysService, type ApiKeyScope } from "@/features/api-keys";
import { WebhooksService } from "@/features/webhooks";
import {
  AutomationsService,
  type AutomationAction,
  type AutomationRuleConfig,
  type AutomationTestResult,
} from "@/features/automations";
import {
  createApiKeySchema,
  createWebhookSchema,
  updateWebhookSchema,
  createAutomationSchema,
  updateAutomationSchema,
} from "@/schemas/integrations";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success?: string;
  error?: string;
  secret?: string;
  data?: unknown;
};

function revalidateIntegrations() {
  revalidatePath("/dashboard/integrations");
}

// ============================================================
// Historia 17.2 — API keys
// ============================================================

export async function createApiKey(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const parsed = createApiKeySchema.safeParse({
    name: formData.get("name") ?? "",
    scopes: formData.getAll("scopes").map(String).filter(Boolean),
  });
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Datos inválidos." };
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
    return { success: "API key creada exitosamente. Cópiala ahora, no volverá a mostrarse.", secret: key };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear la API key." };
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
    return { success: "API key revocada." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al revocar la API key." };
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
    return { success: "API key eliminada." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al eliminar la API key." };
  }
}

// ============================================================
// Historia 17.3 — Webhooks
// ============================================================

export async function createWebhook(_prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const events = formData.getAll("events").map(String).filter(Boolean);
  const parsed = createWebhookSchema.safeParse({
    name: formData.get("name") ?? "",
    url: formData.get("url") ?? "",
    events: events.length > 0 ? events : undefined,
  });
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Datos inválidos." };
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
    return { success: "Webhook creado. Guarda el secreto de firma mostrado abajo.", secret };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear webhook." };
  }
}

export async function updateWebhook(input: {
  id: string;
  name: string;
  url: string;
  events: string[];
  active?: boolean;
}): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const parsed = updateWebhookSchema.safeParse(input);
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Datos inválidos." };
  }

  try {
    await WebhooksService.update(parsed.data.id, {
      name: parsed.data.name,
      url: parsed.data.url,
      events: parsed.data.events,
      active: parsed.data.active,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "updated_webhook",
      entity: "Webhook",
      entity_id: parsed.data.id,
      new_value: { name: parsed.data.name, url: parsed.data.url, events: parsed.data.events },
    });

    revalidateIntegrations();
    return { success: "Webhook actualizado correctamente." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al actualizar el webhook." };
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
    return { success: active ? "Webhook activado." : "Webhook pausado." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cambiar estado del webhook." };
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
    return { success: "Webhook eliminado." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al eliminar el webhook." };
  }
}

export async function testWebhookAction(id: string): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    const result = await WebhooksService.testWebhook(id);
    await ActivityService.log({
      user_id: actor.id,
      action: "tested_webhook",
      entity: "Webhook",
      entity_id: id,
      new_value: { success: result.success, statusCode: result.statusCode, latencyMs: result.latencyMs },
    });

    revalidateIntegrations();
    if (result.success) {
      return {
        success: `Prueba exitosa (HTTP ${result.statusCode}, latencia ${result.latencyMs}ms).`,
        data: result,
      };
    }
    return {
      error: `Fallo en prueba: ${result.error || `HTTP ${result.statusCode}`} (${result.latencyMs}ms).`,
      data: result,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al probar webhook." };
  }
}

export async function retryWebhookDeliveries(): Promise<ActionState> {
  await requirePermission("settings.update");

  try {
    await WebhooksService.retryPendingDeliveries();
    revalidateIntegrations();
    return { success: "Entregas pendientes reintentadas." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al reintentar entregas." };
  }
}

export async function retrySingleWebhookDelivery(deliveryId: string): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  try {
    const result = await WebhooksService.retrySingleDelivery(deliveryId);
    await ActivityService.log({
      user_id: actor.id,
      action: "retried_webhook_delivery",
      entity: "WebhookDelivery",
      entity_id: deliveryId,
      new_value: { success: result.success, statusCode: result.statusCode },
    });

    revalidateIntegrations();
    if (result.success) {
      return { success: `Entrega completada exitosamente (HTTP ${result.statusCode}).`, data: result };
    }
    return { error: `Reintento fallido: ${result.error || `HTTP ${result.statusCode}`}`, data: result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al reintentar la entrega." };
  }
}

// ============================================================
// Historia 17.6 — Automation rules (Editor de reglas: Disparador → Acción)
// ============================================================

export async function createAutomation(
  input: {
    name: string;
    event: string;
    action: AutomationAction;
    config?: AutomationRuleConfig;
  },
): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const parsed = createAutomationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Datos inválidos." };
  }

  try {
    const id = await AutomationsService.create({
      name: parsed.data.name,
      event: parsed.data.event,
      action: parsed.data.action as AutomationAction,
      config: parsed.data.config,
      createdBy: actor.id,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "created_automation",
      entity: "Automation",
      entity_id: id,
      new_value: {
        name: parsed.data.name,
        event: parsed.data.event,
        action: parsed.data.action,
        config: parsed.data.config,
      },
    });

    revalidateIntegrations();
    return { success: "Regla de automatización creada exitosamente." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear la automatización." };
  }
}

export async function updateAutomation(
  input: {
    id: string;
    name: string;
    event: string;
    action: AutomationAction;
    config?: AutomationRuleConfig;
    active?: boolean;
  },
): Promise<ActionState> {
  const actor = await requirePermission("settings.update");

  const parsed = updateAutomationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Datos inválidos." };
  }

  try {
    await AutomationsService.update(parsed.data.id, {
      name: parsed.data.name,
      event: parsed.data.event,
      action: parsed.data.action as AutomationAction,
      config: parsed.data.config,
      active: parsed.data.active,
    });

    await ActivityService.log({
      user_id: actor.id,
      action: "updated_automation",
      entity: "Automation",
      entity_id: parsed.data.id,
      new_value: {
        name: parsed.data.name,
        event: parsed.data.event,
        action: parsed.data.action,
        config: parsed.data.config,
      },
    });

    revalidateIntegrations();
    return { success: "Regla de automatización actualizada exitosamente." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al actualizar la automatización." };
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
    return { success: active ? "Automatización activada." : "Automatización pausada." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cambiar estado de la automatización." };
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
    return { success: "Regla de automatización eliminada." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al eliminar la automatización." };
  }
}

export async function testAutomationRule(id: string): Promise<ActionState & { testResult?: AutomationTestResult }> {
  const actor = await requirePermission("settings.update");

  try {
    const testResult = await AutomationsService.testRule(id, actor.id);
    return {
      success: `Prueba completada: ${testResult.conditionDetails}`,
      testResult,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al probar la automatización.",
    };
  }
}
