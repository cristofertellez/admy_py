"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { retrySingleWebhookDelivery } from "@/actions/integrations";
import type { WebhookDeliveryView } from "./webhooks.service";

interface DeliveryDetailsModalProps {
  delivery: WebhookDeliveryView;
  onClose: () => void;
  onRetried?: () => void;
}

export function DeliveryDetailsModal({ delivery, onClose, onRetried }: DeliveryDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, startTransition] = useTransition();

  let formattedPayload = delivery.payload;
  try {
    const parsed = JSON.parse(delivery.payload) as unknown;
    formattedPayload = JSON.stringify(parsed, null, 2);
  } catch {
    // raw payload
  }

  function handleCopyPayload() {
    void navigator.clipboard.writeText(delivery.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRetry() {
    setRetryResult(null);
    setRetryError(null);
    startTransition(async () => {
      const res = await retrySingleWebhookDelivery(delivery.id);
      if (res.error) {
        setRetryError(res.error);
      } else {
        setRetryResult(res.success || "Entrega reintentada exitosamente.");
        onRetried?.();
      }
    });
  }

  const isDelivered = Boolean(delivery.delivered_at);
  const isFailed = !isDelivered && delivery.attempt >= delivery.max_attempts;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-modal-title"
    >
      <Card className="w-full max-w-2xl max-h-[92vh] flex flex-col border-hairline-strong bg-surface-card shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-hairline pb-4">
          <div>
            <CardTitle id="delivery-modal-title" className="text-title-md text-ink">
              Detalles de Entrega de Webhook
            </CardTitle>
            <p className="text-caption text-muted mt-0.5">
              Auditoría de paquete y respuesta HTTP de la entrega.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded p-1 text-muted hover:text-body-strong transition-colors"
          >
            ✕
          </button>
        </CardHeader>

        <CardContent className="overflow-y-auto p-6 space-y-5">
          {/* Status banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-card-elevated p-3.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">ESTADO HTTP</span>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={isDelivered ? "success" : isFailed ? "error" : "warning"}>
                  {isDelivered
                    ? `Entregado (${delivery.status_code || 200} OK)`
                    : isFailed
                      ? `Agotado (${delivery.attempt}/${delivery.max_attempts})`
                      : `En Cola (Intento ${delivery.attempt}/${delivery.max_attempts})`}
                </Badge>
                {delivery.status_code && (
                  <span className="font-mono text-body-sm font-semibold text-body-strong">
                    HTTP {delivery.status_code}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">FECHA</span>
              <p className="mt-1 text-caption text-body">
                {new Date(delivery.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Webhook info */}
          <div className="rounded-lg border border-hairline bg-surface-card-elevated/60 p-3.5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">DESTINATARIO</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-caption">
              <div>
                <span className="text-muted">Webhook: </span>
                <span className="font-semibold text-body-strong">{delivery.webhook_name || delivery.webhook_id}</span>
              </div>
              <div>
                <span className="text-muted">Evento: </span>
                <span className="font-mono text-primary font-medium">{delivery.event}</span>
              </div>
              {delivery.webhook_url && (
                <div className="sm:col-span-2">
                  <span className="text-muted">URL: </span>
                  <span className="font-mono text-body-strong truncate">{delivery.webhook_url}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error if failed */}
          {delivery.error && (
            <div className="rounded-lg border border-error/40 bg-error/10 p-3.5 text-caption text-error">
              <span className="font-bold uppercase tracking-wide text-[11px] block">Error registrado:</span>
              <p className="mt-1 font-mono">{delivery.error}</p>
            </div>
          )}

          {/* Headers Sent */}
          <div className="rounded-lg border border-hairline bg-surface-card-elevated/60 p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">CABECERAS ENVIADAS</span>
            <div className="rounded bg-surface-card p-2.5 font-mono text-[11px] text-body space-y-1">
              <div><strong className="text-muted">Content-Type:</strong> application/json</div>
              <div><strong className="text-muted">x-admipy-event:</strong> {delivery.event}</div>
              <div><strong className="text-muted">x-admipy-signature:</strong> &lt;HMAC-SHA256 firma criptográfica&gt;</div>
            </div>
          </div>

          {/* Payload Inspector */}
          <div className="rounded-lg border border-hairline bg-surface-card-elevated/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">PAYLOAD DE LA PETICIÓN (JSON)</span>
              <button
                type="button"
                onClick={handleCopyPayload}
                className="text-caption text-primary hover:underline"
              >
                {copied ? "¡Copiado!" : "Copiar JSON"}
              </button>
            </div>
            <pre className="max-h-56 overflow-auto rounded bg-surface-card p-3 font-mono text-[12px] text-body leading-relaxed border border-hairline">
              {formattedPayload}
            </pre>
          </div>

          {retryResult && (
            <div className="rounded-md border border-success/40 bg-success/10 p-3 text-caption text-success">
              {retryResult}
            </div>
          )}
          {retryError && (
            <div className="rounded-md border border-error/40 bg-error/10 p-3 text-caption text-error">
              {retryError}
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between border-t border-hairline p-4 bg-surface-card-elevated/40">
          <Button
            type="button"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-caption"
          >
            {isRetrying ? "Reintentando..." : "⚡ Reintentar entrega ahora"}
          </Button>
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Card>
    </div>
  );
}
