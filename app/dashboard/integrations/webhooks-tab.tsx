"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import {
  createWebhook,
  toggleWebhook,
  deleteWebhook,
  testWebhookAction,
  retryWebhookDeliveries,
} from "@/actions/integrations";
import {
  WebhookEditorModal,
  DeliveryDetailsModal,
  type WebhookView,
  type WebhookDeliveryView,
} from "@/features/webhooks";

interface WebhooksTabProps {
  webhooks: WebhookView[];
  deliveries: WebhookDeliveryView[];
  webhookEventTypes: string[];
}

const inputClasses =
  "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

function CopySecretCard({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-success">
          SECRETO DE FIRMA (HMAC-SHA256)
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-caption font-medium text-primary hover:underline"
        >
          {copied ? "¡Copiado!" : "Copiar secreto"}
        </button>
      </div>
      <p className="break-all font-mono text-caption text-body-strong bg-surface-card p-2 rounded border border-hairline">
        {secret}
      </p>
      <p className="text-[11px] text-muted">
        Guarda este secreto en un lugar seguro. Se utiliza para verificar la autenticidad de las solicitudes en la cabecera <code>x-admipy-signature</code>.
      </p>
    </div>
  );
}

export function WebhooksTab({
  webhooks,
  deliveries,
  webhookEventTypes,
}: WebhooksTabProps) {
  const [webhookState, webhookAction, webhookPending] = useActionState(createWebhook, null);
  const [, startTransition] = useTransition();

  const [editingWebhook, setEditingWebhook] = useState<WebhookView | null>(null);
  const [inspectingDelivery, setInspectingDelivery] = useState<WebhookDeliveryView | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{ id: string; message: string; ok: boolean } | null>(null);

  // Filters for deliveries
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | "delivered" | "pending" | "failed">("all");
  const [selectedWebhookFilter, setSelectedWebhookFilter] = useState<string>("all");

  function runAction(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
    });
  }

  async function handleTestWebhook(webhookId: string) {
    setTestingWebhookId(webhookId);
    setTestFeedback(null);
    try {
      const res = await testWebhookAction(webhookId);
      if (res.error) {
        setTestFeedback({ id: webhookId, message: res.error, ok: false });
      } else {
        setTestFeedback({ id: webhookId, message: res.success || "Prueba exitosa.", ok: true });
      }
    } catch {
      setTestFeedback({ id: webhookId, message: "Error al enviar la prueba.", ok: false });
    } finally {
      setTestingWebhookId(null);
    }
  }

  const filteredDeliveries = deliveries.filter((d) => {
    if (selectedWebhookFilter !== "all" && d.webhook_id !== selectedWebhookFilter) {
      return false;
    }
    if (deliveryFilter === "delivered") return Boolean(d.delivered_at);
    if (deliveryFilter === "pending") return !d.delivered_at && d.attempt < d.max_attempts;
    if (deliveryFilter === "failed") return !d.delivered_at && d.attempt >= d.max_attempts;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Section: Webhooks list + Create Webhook */}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* List of Webhooks */}
        <Card className="border-hairline bg-surface-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-hairline pb-4">
            <div>
              <CardTitle className="text-title-md text-ink">Webhooks Registrados ({webhooks.length})</CardTitle>
              <p className="text-caption text-muted mt-0.5">
                Endpoints receptores de eventos del sistema firmados criptográficamente.
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {webhooks.length === 0 ? (
              <div className="py-8 text-center text-body-sm text-muted">
                No hay webhooks registrados aún. Configura un endpoint para recibir eventos en tiempo real.
              </div>
            ) : (
              webhooks.map((hook) => (
                <div
                  key={hook.id}
                  className="rounded-lg border border-hairline bg-surface-card-elevated p-4 space-y-3 transition-colors hover:border-hairline-strong"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          hook.active ? "bg-success" : "bg-muted-soft"
                        }`}
                        aria-hidden="true"
                      />
                      <h3 className="text-body-sm font-semibold text-body-strong">{hook.name}</h3>
                      <Badge variant={hook.active ? "success" : "default"}>
                        {hook.active ? "Activo" : "Pausado"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestWebhook(hook.id)}
                        disabled={testingWebhookId === hook.id}
                        className="text-caption text-primary hover:bg-primary/10"
                        title="Enviar petición de prueba inmediata"
                      >
                        {testingWebhookId === hook.id ? "Probando..." : "⚡ Probar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => runAction(() => toggleWebhook(hook.id, !hook.active))}
                        className="text-caption"
                      >
                        {hook.active ? "Pausar" : "Activar"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingWebhook(hook)}
                        className="text-caption"
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar webhook "${hook.name}"?`)) {
                            runAction(() => deleteWebhook(hook.id));
                          }
                        }}
                        className="text-caption text-muted hover:text-error"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>

                  <p className="font-mono text-caption text-muted break-all">{hook.url}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted font-medium">Suscrito a:</span>
                    {hook.events.length > 0 ? (
                      hook.events.map((ev) => (
                        <span
                          key={ev}
                          className="rounded bg-surface-card px-2 py-0.5 font-mono text-[11px] text-body"
                        >
                          {ev}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted italic">Todos los eventos</span>
                    )}
                  </div>

                  {testFeedback && testFeedback.id === hook.id && (
                    <div
                      className={`mt-2 rounded p-2.5 text-caption ${
                        testFeedback.ok
                          ? "bg-success/10 text-success border border-success/30"
                          : "bg-error/10 text-error border border-error/30"
                      }`}
                    >
                      {testFeedback.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Create Webhook Form */}
        <Card className="border-hairline bg-surface-card">
          <CardHeader className="border-b border-hairline pb-4">
            <CardTitle className="text-title-sm text-ink">Registrar Webhook</CardTitle>
            <p className="text-caption text-muted mt-0.5">
              Genera una URL destino y clave secreta de firma HMAC.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <form action={webhookAction} className="space-y-4">
              <div>
                <label htmlFor="create-webhook-name" className="mb-1 block text-caption font-medium text-body-strong">
                  Nombre del Webhook *
                </label>
                <input
                  id="create-webhook-name"
                  name="name"
                  required
                  className={inputClasses}
                  placeholder="Ej. Integración Slack Relay"
                />
              </div>

              <div>
                <label htmlFor="create-webhook-url" className="mb-1 block text-caption font-medium text-body-strong">
                  URL de Destino (HTTPS) *
                </label>
                <input
                  id="create-webhook-url"
                  name="url"
                  type="url"
                  required
                  className={inputClasses}
                  placeholder="https://ejemplo.com/webhooks/admipy"
                />
              </div>

              <fieldset>
                <legend className="mb-1.5 text-caption font-medium text-body-strong">
                  Eventos Suscritos
                </legend>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-hairline bg-surface-card-elevated p-2">
                  {webhookEventTypes.map((event) => (
                    <label key={event} className="flex items-center gap-2 text-caption text-body-strong p-1 hover:bg-surface-strong rounded cursor-pointer">
                      <input
                        type="checkbox"
                        name="events"
                        value={event}
                        defaultChecked
                        className="h-3.5 w-3.5 rounded border-hairline accent-primary"
                      />
                      <span className="font-mono text-[11px]">{event}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" disabled={webhookPending} className="w-full">
                {webhookPending ? "Creando..." : "Crear Webhook"}
              </Button>

              {webhookState?.error && (
                <p className="text-caption text-error" role="alert">
                  {webhookState.error}
                </p>
              )}
              {webhookState?.secret && <CopySecretCard secret={webhookState.secret} />}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Delivery History & Queue */}
      <Card className="border-hairline bg-surface-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <CardTitle className="text-title-md text-ink">
              Historial de Entregas & Cola de Reintentos (17.3)
            </CardTitle>
            <p className="text-caption text-muted mt-0.5">
              Auditoría de transmisiones en tiempo real. Reintentos acotados (hasta 5 intentos) con timeout de 8s.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => runAction(() => retryWebhookDeliveries())}
            className="self-start sm:self-auto text-caption"
          >
            ⚡ Reintentar pendientes en cola
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-card-elevated p-3">
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted">Filtrar por webhook:</span>
              <select
                value={selectedWebhookFilter}
                onChange={(e) => setSelectedWebhookFilter(e.target.value)}
                className="h-8 rounded-md border border-hairline bg-surface-card px-2 text-caption text-body-strong"
              >
                <option value="all">Todos los webhooks</option>
                {webhooks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "all", label: `Todos (${deliveries.length})` },
                  { id: "delivered", label: "Entregados" },
                  { id: "pending", label: "En cola / Pendientes" },
                  { id: "failed", label: "Agotados / Fallidos" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDeliveryFilter(opt.id)}
                  className={`rounded-md px-2.5 py-1 text-caption transition-colors ${
                    deliveryFilter === opt.id
                      ? "bg-surface-strong text-body-strong font-medium"
                      : "text-muted hover:text-body-strong"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deliveries List */}
          {filteredDeliveries.length === 0 ? (
            <div className="py-8 text-center text-body-sm text-muted">
              No hay entregas registradas bajo este criterio.
            </div>
          ) : (
            <div className="divide-y divide-hairline rounded-lg border border-hairline overflow-hidden">
              {filteredDeliveries.map((delivery) => {
                const isDelivered = Boolean(delivery.delivered_at);
                const isFailed = !isDelivered && delivery.attempt >= delivery.max_attempts;

                return (
                  <div
                    key={delivery.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface-card hover:bg-surface-card-elevated transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-body-sm font-semibold text-primary">
                          {delivery.event}
                        </span>
                        <Badge variant={isDelivered ? "success" : isFailed ? "error" : "warning"}>
                          {isDelivered
                            ? `HTTP ${delivery.status_code || 200}`
                            : isFailed
                              ? `Fallido (${delivery.attempt}/${delivery.max_attempts})`
                              : `Intento ${delivery.attempt}/${delivery.max_attempts}`}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
                        <span>Destino: <strong className="text-body-strong">{delivery.webhook_name || "Webhook"}</strong></span>
                        <span>•</span>
                        <time dateTime={delivery.created_at}>
                          {new Date(delivery.created_at).toLocaleString()}
                        </time>
                        {delivery.error && (
                          <>
                            <span>•</span>
                            <span className="text-error truncate max-w-xs">{delivery.error}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingDelivery(delivery)}
                        className="text-caption"
                      >
                        🔍 Inspeccionar Payload
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {editingWebhook && (
        <WebhookEditorModal
          webhook={editingWebhook}
          onClose={() => setEditingWebhook(null)}
          onSuccess={() => setEditingWebhook(null)}
        />
      )}

      {inspectingDelivery && (
        <DeliveryDetailsModal
          delivery={inspectingDelivery}
          onClose={() => setInspectingDelivery(null)}
          onRetried={() => setInspectingDelivery(null)}
        />
      )}
    </div>
  );
}
