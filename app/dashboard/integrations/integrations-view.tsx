"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import {
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  createWebhook,
  toggleWebhook,
  deleteWebhook,
  retryWebhookDeliveries,
  createAutomation,
  toggleAutomation,
  deleteAutomation,
} from "@/actions/integrations";
import type { ApiKeyView } from "@/features/api-keys";
import type { WebhookDeliveryView } from "@/features/webhooks";
import type { AutomationAction, AutomationRuleRow } from "@/features/automations";

interface WebhookView {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

interface IntegrationsViewProps {
  apiKeys: ApiKeyView[];
  webhooks: WebhookView[];
  deliveries: WebhookDeliveryView[];
  automations: AutomationRuleRow[];
  webhookEventTypes: string[];
  automationEvents: string[];
  automationActions: { value: AutomationAction; label: string }[];
}

const inputClasses =
  "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

function CopyOnce({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 rounded-md border border-success/40 bg-success/10 p-3">
      <p className="break-all font-mono text-caption text-success">{secret}</p>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(secret);
          setCopied(true);
        }}
        className="mt-2 text-caption text-primary hover:underline"
      >
        {copied ? "Copied!" : "Copy to clipboard"}
      </button>
    </div>
  );
}

export function IntegrationsView({
  apiKeys,
  webhooks,
  deliveries,
  automations,
  webhookEventTypes,
  automationEvents,
  automationActions,
}: IntegrationsViewProps) {
  const [keyState, keyAction, keyPending] = useActionState(createApiKey, null);
  const [webhookState, webhookAction, webhookPending] = useActionState(createWebhook, null);
  const [automationState, automationAction, automationPending] = useActionState(createAutomation, null);
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<"api" | "webhooks" | "automations">("api");

  function runAction(action: () => Promise<{ success?: string; error?: string }>) {
    startTransition(async () => {
      await action();
    });
  }

  const tabs = [
    { id: "api" as const, label: `API Keys (${apiKeys.length})` },
    { id: "webhooks" as const, label: `Webhooks (${webhooks.length})` },
    { id: "automations" as const, label: `Automations (${automations.length})` },
  ];

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Integration sections" className="flex gap-1 rounded-lg border border-hairline p-1">
        {tabs.map((option) => (
          <button
            key={option.id}
            role="tab"
            aria-selected={tab === option.id}
            onClick={() => setTab(option.id)}
            className={`rounded-md px-3 py-1.5 text-body-sm transition-colors ${
              tab === option.id ? "bg-primary text-white" : "text-muted hover:text-body-strong"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "api" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card>
            <CardHeader><CardTitle>API keys</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {apiKeys.length === 0 && (
                <p className="text-body-sm text-muted-soft">No API keys yet. Create one to use the public API.</p>
              )}
              {apiKeys.map((key) => (
                <div key={key.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-3">
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-body-strong">{key.name}</p>
                    <p className="font-mono text-caption text-muted">{key.prefix}......</p>
                    <p className="text-caption text-muted">
                      Scopes: {key.scopes.join(", ")} - Last used:{" "}
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "never"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {key.revoked ? (
                      <Badge variant="error">Revoked</Badge>
                    ) : (
                      <>
                        <Badge variant="success">Active</Badge>
                        <button
                          onClick={() => runAction(() => revokeApiKey(key.id))}
                          className="text-caption text-primary hover:underline"
                        >
                          Revoke
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => runAction(() => deleteApiKey(key.id))}
                      className="text-caption text-muted hover:text-error"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>New API key</CardTitle></CardHeader>
            <CardContent>
              <form action={keyAction} className="space-y-3">
                <div>
                  <label htmlFor="api-key-name" className="mb-1 block text-caption text-muted">
                    Name
                  </label>
                  <input id="api-key-name" name="name" required className={inputClasses} placeholder="Zapier integration" />
                </div>
                <fieldset>
                  <legend className="mb-1 text-caption text-muted">Scopes</legend>
                  <label className="flex items-center gap-2 text-body-sm text-body-strong">
                    <input type="checkbox" name="scopes" value="read" defaultChecked className="h-4 w-4 rounded border-hairline" />
                    read (list/detail endpoints)
                  </label>
                  <label className="flex items-center gap-2 text-body-sm text-body-strong">
                    <input type="checkbox" name="scopes" value="write" className="h-4 w-4 rounded border-hairline" />
                    write (reserved for future endpoints)
                  </label>
                </fieldset>
                <Button type="submit" disabled={keyPending} className="w-full">
                  {keyPending ? "Creating..." : "Create key"}
                </Button>
                {keyState?.error && <p className="text-caption text-error" role="alert">{keyState.error}</p>}
                {keyState?.secret && <CopyOnce secret={keyState.secret} />}
              </form>
              <p className="mt-3 text-caption text-muted">
                Requests use the header <code>{"Authorization: Bearer <key>"}</code>. Rate limit: 60 requests per minute per key.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "webhooks" && (
        <div className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <Card>
              <CardHeader><CardTitle>Webhooks</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {webhooks.length === 0 && (
                  <p className="text-body-sm text-muted-soft">
                    No webhooks yet. Platform events will be POSTed with an HMAC-SHA256 signature.
                  </p>
                )}
                {webhooks.map((hook) => (
                  <div key={hook.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-3">
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-body-strong">{hook.name}</p>
                      <p className="truncate text-caption text-muted">{hook.url}</p>
                      <p className="text-caption text-muted">Events: {hook.events.join(", ") || "all"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={hook.active ? "success" : "default"}>{hook.active ? "Active" : "Paused"}</Badge>
                      <button
                        onClick={() => runAction(() => toggleWebhook(hook.id, !hook.active))}
                        className="text-caption text-primary hover:underline"
                      >
                        {hook.active ? "Pause" : "Activate"}
                      </button>
                      <button
                        onClick={() => runAction(() => deleteWebhook(hook.id))}
                        className="text-caption text-muted hover:text-error"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>New webhook</CardTitle></CardHeader>
              <CardContent>
                <form action={webhookAction} className="space-y-3">
                  <div>
                    <label htmlFor="webhook-name" className="mb-1 block text-caption text-muted">
                      Name
                    </label>
                    <input id="webhook-name" name="name" required className={inputClasses} placeholder="Slack relay" />
                  </div>
                  <div>
                    <label htmlFor="webhook-url" className="mb-1 block text-caption text-muted">
                      Target URL (https)
                    </label>
                    <input id="webhook-url" name="url" type="url" required className={inputClasses} placeholder="https://example.com/hooks/admipy" />
                  </div>
                  <fieldset>
                    <legend className="mb-1 text-caption text-muted">Events</legend>
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-hairline p-2">
                      {webhookEventTypes.map((event) => (
                        <label key={event} className="flex items-center gap-2 text-caption text-body-strong">
                          <input type="checkbox" name="events" value={event} className="h-4 w-4 rounded border-hairline" />
                          {event}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Button type="submit" disabled={webhookPending} className="w-full">
                    {webhookPending ? "Creating..." : "Create webhook"}
                  </Button>
                  {webhookState?.error && <p className="text-caption text-error" role="alert">{webhookState.error}</p>}
                  {webhookState?.secret && <CopyOnce secret={webhookState.secret} />}
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Delivery history</CardTitle>
              <Button variant="outline" size="sm" onClick={() => runAction(() => retryWebhookDeliveries())}>
                Retry pending
              </Button>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <p className="text-body-sm text-muted-soft">No deliveries recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {deliveries.map((delivery) => (
                    <li key={delivery.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-2">
                      <span className="font-mono text-caption text-body-strong">{delivery.event}</span>
                      <span className="flex items-center gap-2 text-caption text-muted">
                        <Badge variant={delivery.delivered_at ? "success" : delivery.attempt >= 5 ? "error" : "warning"}>
                          {delivery.delivered_at
                            ? `Delivered (${delivery.status_code})`
                            : `Attempt ${delivery.attempt}/5`}
                        </Badge>
                        {delivery.error && <span>{delivery.error}</span>}
                        <time dateTime={delivery.created_at}>{new Date(delivery.created_at).toLocaleString()}</time>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "automations" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card>
            <CardHeader><CardTitle>Automation rules</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {automations.length === 0 && (
                <p className="text-body-sm text-muted-soft">
                  No automation rules yet. Rules react to internal events, e.g. when a task completes, notify the project audience.
                </p>
              )}
              {automations.map((rule) => (
                <div key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline p-3">
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-body-strong">{rule.name}</p>
                    <p className="text-caption text-muted">
                      <span className="font-mono">{rule.event}</span> then {rule.action}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.active === 1 ? "success" : "default"}>
                      {rule.active === 1 ? "Active" : "Paused"}
                    </Badge>
                    <button
                      onClick={() => runAction(() => toggleAutomation(rule.id, rule.active !== 1))}
                      className="text-caption text-primary hover:underline"
                    >
                      {rule.active === 1 ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => runAction(() => deleteAutomation(rule.id))}
                      className="text-caption text-muted hover:text-error"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>New automation</CardTitle></CardHeader>
            <CardContent>
              <form action={automationAction} className="space-y-3">
                <div>
                  <label htmlFor="automation-name" className="mb-1 block text-caption text-muted">
                    Name
                  </label>
                  <input id="automation-name" name="name" required className={inputClasses} placeholder="Notify on completion" />
                </div>
                <div>
                  <label htmlFor="automation-event" className="mb-1 block text-caption text-muted">
                    When
                  </label>
                  <select id="automation-event" name="event" required className={inputClasses}>
                    {automationEvents.map((event) => (
                      <option key={event} value={event}>
                        {event}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="automation-action" className="mb-1 block text-caption text-muted">
                    Then
                  </label>
                  <select id="automation-action" name="action" required className={inputClasses}>
                    {automationActions.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={automationPending} className="w-full">
                  {automationPending ? "Creating..." : "Create automation"}
                </Button>
                {automationState?.error && (
                  <p className="text-caption text-error" role="alert">{automationState.error}</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
