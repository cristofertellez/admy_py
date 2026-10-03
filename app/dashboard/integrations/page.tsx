import { requirePermission } from "@/lib/auth";
import { ApiKeysService } from "@/features/api-keys";
import { WebhooksService, WEBHOOK_EVENT_TYPES } from "@/features/webhooks";
import { AutomationsService, AUTOMATION_ACTIONS, AUTOMATION_EVENTS } from "@/features/automations";
import { retryPendingWebhookDeliveries } from "@/features/webhooks/webhooks.service";
import { IntegrationsView } from "./integrations-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Integrations" };

// Épica 17 (17.1-17.7) — Integrations center: public API keys (17.2),
// webhooks with delivery history (17.3) and automation rules (17.6).
// Management requires settings.update (Developer / Super Administrator).
export default async function IntegrationsPage() {
  await requirePermission("settings.update");

  // Pending deliveries get a retry opportunity on every visit (17.3).
  await retryPendingWebhookDeliveries().catch(() => undefined);

  const [apiKeys, webhooks, deliveries, automations] = await Promise.all([
    ApiKeysService.list(),
    WebhooksService.list(),
    WebhooksService.listDeliveries(20),
    AutomationsService.list(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Integrations</h1>
        <p className="mt-1 text-body-sm text-muted">
          Public API keys, webhooks and automation rules. See{" "}
          <a href="/api/v1/openapi" className="text-primary hover:underline">
            /api/v1/openapi
          </a>{" "}
          for the API documentation.
        </p>
      </div>
      <IntegrationsView
        apiKeys={apiKeys}
        webhooks={webhooks}
        deliveries={deliveries}
        automations={automations}
        webhookEventTypes={[...WEBHOOK_EVENT_TYPES]}
        automationEvents={[...AUTOMATION_EVENTS]}
        automationActions={AUTOMATION_ACTIONS}
      />
    </div>
  );
}
