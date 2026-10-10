"use client";

import { useState } from "react";
import { AutomationsTab } from "./automations-tab";
import { WebhooksTab } from "./webhooks-tab";
import { ApiKeysTab } from "./api-keys-tab";
import type { ApiKeyView } from "@/features/api-keys";
import type { WebhookView, WebhookDeliveryView } from "@/features/webhooks";
import type { AutomationRuleView } from "@/features/automations";

interface IntegrationsViewProps {
  apiKeys: ApiKeyView[];
  webhooks: WebhookView[];
  deliveries: WebhookDeliveryView[];
  automations: AutomationRuleView[];
  webhookEventTypes: string[];
}

export function IntegrationsView({
  apiKeys,
  webhooks,
  deliveries,
  automations,
  webhookEventTypes,
}: IntegrationsViewProps) {
  const [tab, setTab] = useState<"automations" | "webhooks" | "api">("automations");

  const tabs = [
    {
      id: "automations" as const,
      label: `Automatizaciones y Reglas (${automations.length})`,
      badge: automations.length,
    },
    {
      id: "webhooks" as const,
      label: `Webhooks (${webhooks.length})`,
      badge: webhooks.length,
    },
    {
      id: "api" as const,
      label: `Claves API (${apiKeys.length})`,
      badge: apiKeys.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Secciones de integraciones"
        className="flex flex-wrap gap-1.5 rounded-lg border border-hairline bg-surface-card p-1.5"
      >
        {tabs.map((option) => {
          const isActive = tab === option.id;
          return (
            <button
              key={option.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(option.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-body-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:bg-surface-card-elevated hover:text-body-strong"
              }`}
            >
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {tab === "automations" && (
        <AutomationsTab automations={automations} webhooks={webhooks} />
      )}

      {tab === "webhooks" && (
        <WebhooksTab
          webhooks={webhooks}
          deliveries={deliveries}
          webhookEventTypes={webhookEventTypes}
        />
      )}

      {tab === "api" && <ApiKeysTab apiKeys={apiKeys} />}
    </div>
  );
}
