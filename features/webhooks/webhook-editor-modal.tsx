"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { updateWebhook } from "@/actions/integrations";
import { WEBHOOK_EVENT_TYPES, type WebhookView } from "./webhooks.service";

interface WebhookEditorModalProps {
  webhook?: WebhookView | null;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClasses =
  "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

export function WebhookEditorModal({ webhook, onClose, onSuccess }: WebhookEditorModalProps) {
  const isEditing = Boolean(webhook);

  const [name, setName] = useState(webhook?.name ?? "");
  const [url, setUrl] = useState(webhook?.url ?? "");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    webhook?.events ?? [...WEBHOOK_EVENT_TYPES],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleEvent(eventType: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventType)
        ? prev.filter((e) => e !== eventType)
        : [...prev, eventType],
    );
  }

  function selectAll() {
    setSelectedEvents([...WEBHOOK_EVENT_TYPES]);
  }

  function deselectAll() {
    setSelectedEvents([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError("El nombre debe tener al menos 3 caracteres.");
      return;
    }
    if (!url.startsWith("https://")) {
      setError("La URL del webhook debe usar protocolo HTTPS seguro.");
      return;
    }
    if (selectedEvents.length === 0) {
      setError("Selecciona al menos un evento para suscribir el webhook.");
      return;
    }

    if (!webhook) {
      // In create mode, creation is handled via form action or state
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateWebhook({
        id: webhook.id,
        name: name.trim(),
        url: url.trim(),
        events: selectedEvents,
        active: webhook.active,
      });

      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el webhook.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webhook-editor-title"
    >
      <Card className="w-full max-w-xl max-h-[92vh] flex flex-col border-hairline-strong bg-surface-card shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-hairline pb-4">
          <div>
            <CardTitle id="webhook-editor-title" className="text-title-md text-ink">
              {isEditing ? "Editar Webhook" : "Nuevo Webhook"}
            </CardTitle>
            <p className="text-caption text-muted mt-0.5">
              Configura el endpoint externo que recibirá notificaciones firmadas con HMAC-SHA256.
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
          <form id="webhook-edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="webhook-edit-name" className="mb-1 block text-body-sm font-medium text-body-strong">
                Nombre del Webhook *
              </label>
              <input
                id="webhook-edit-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Integración Slack o Servidor Central"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="webhook-edit-url" className="mb-1 block text-body-sm font-medium text-body-strong">
                URL de Destino (HTTPS) *
              </label>
              <input
                id="webhook-edit-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tu-dominio.com/api/webhooks/admipy"
                className={inputClasses}
              />
            </div>

            <fieldset>
              <div className="flex items-center justify-between mb-2">
                <legend className="text-body-sm font-medium text-body-strong">
                  Eventos Suscritos ({selectedEvents.length})
                </legend>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-[12px] text-primary hover:underline"
                  >
                    Todos
                  </button>
                  <span className="text-hairline">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[12px] text-muted hover:underline"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-hairline bg-surface-card-elevated p-3">
                {WEBHOOK_EVENT_TYPES.map((eventType) => {
                  const checked = selectedEvents.includes(eventType);
                  return (
                    <label
                      key={eventType}
                      className="flex items-center gap-2.5 rounded p-1.5 hover:bg-surface-strong cursor-pointer text-body-sm text-body-strong"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(eventType)}
                        className="h-4 w-4 rounded border-hairline accent-primary"
                      />
                      <span className="font-mono text-caption">{eventType}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error && (
              <div className="rounded-md border border-error/40 bg-error/10 p-3 text-caption text-error" role="alert">
                {error}
              </div>
            )}
          </form>
        </CardContent>

        <div className="flex items-center justify-end gap-3 border-t border-hairline p-4 bg-surface-card-elevated/40">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="webhook-edit-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Actualizar Webhook"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
