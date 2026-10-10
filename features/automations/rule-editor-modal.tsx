"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { createAutomation, updateAutomation } from "@/actions/integrations";
import {
  AUTOMATION_EVENT_DEFINITIONS,
  AUTOMATION_ACTION_DEFINITIONS,
  type AutomationRuleView,
  type AutomationAction,
} from "./types";
import type { WebhookView } from "@/features/webhooks";

interface RuleEditorModalProps {
  rule?: AutomationRuleView | null;
  webhooks: WebhookView[];
  onClose: () => void;
  onSuccess: () => void;
}

const inputClasses =
  "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

export function RuleEditorModal({ rule, webhooks, onClose, onSuccess }: RuleEditorModalProps) {
  const isEditing = Boolean(rule);

  const [name, setName] = useState(rule?.name ?? "");
  const [selectedEvent, setSelectedEvent] = useState(
    rule?.event ?? AUTOMATION_EVENT_DEFINITIONS[0].type,
  );
  const [selectedAction, setSelectedAction] = useState<AutomationAction>(
    rule?.action ?? "notify_project_audience",
  );

  // Conditions state
  const [statusCondition, setStatusCondition] = useState(
    rule?.config.conditions?.status ?? "",
  );
  const [priorityCondition, setPriorityCondition] = useState(
    rule?.config.conditions?.priority ?? "",
  );

  // Action config state
  const [titleTemplate, setTitleTemplate] = useState(
    rule?.config.actionConfig?.titleTemplate ?? "",
  );
  const [messageTemplate, setMessageTemplate] = useState(
    rule?.config.actionConfig?.messageTemplate ?? "",
  );
  const [severity, setSeverity] = useState<"info" | "reminder" | "alert">(
    rule?.config.actionConfig?.severity ?? "reminder",
  );
  const [targetWebhookId, setTargetWebhookId] = useState(
    rule?.config.actionConfig?.webhookId ?? "",
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentEventDef = AUTOMATION_EVENT_DEFINITIONS.find((e) => e.type === selectedEvent);

  function insertPlaceholder(placeholder: string) {
    setMessageTemplate((prev) => (prev ? `${prev} {${placeholder}}` : `{${placeholder}}`));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError("El nombre de la regla debe tener al menos 3 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const config = {
        conditions: {
          status: statusCondition.trim() || undefined,
          priority: priorityCondition.trim() || undefined,
        },
        actionConfig: {
          titleTemplate: titleTemplate.trim() || undefined,
          messageTemplate: messageTemplate.trim() || undefined,
          severity,
          webhookId: targetWebhookId.trim() || undefined,
        },
      };

      if (isEditing && rule) {
        const res = await updateAutomation({
          id: rule.id,
          name: name.trim(),
          event: selectedEvent,
          action: selectedAction,
          config,
          active: rule.active,
        });

        if (res.error) {
          setError(res.error);
        } else {
          onSuccess();
        }
      } else {
        const res = await createAutomation({
          name: name.trim(),
          event: selectedEvent,
          action: selectedAction,
          config,
        });

        if (res.error) {
          setError(res.error);
        } else {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al guardar la regla.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-editor-title"
    >
      <Card className="w-full max-w-2xl max-h-[92vh] flex flex-col border-hairline-strong bg-surface-card shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-hairline pb-4">
          <div>
            <CardTitle id="rule-editor-title" className="text-title-md text-ink">
              {isEditing ? "Editar Regla de Automatización" : "Nueva Regla: Disparador ➔ Acción"}
            </CardTitle>
            <p className="text-caption text-muted mt-0.5">
              Configura qué evento activa la regla y qué acción desencadenará automáticamente.
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

        <CardContent className="overflow-y-auto p-6 space-y-6">
          <form id="rule-form" onSubmit={handleSubmit} className="space-y-6">
            {/* General info */}
            <div>
              <label htmlFor="rule-name-input" className="mb-1 block text-body-sm font-medium text-body-strong">
                Nombre de la regla *
              </label>
              <input
                id="rule-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Notificar a equipo cuando una tarea pase a Hecho"
                className={inputClasses}
              />
            </div>

            {/* SECCIÓN 1: DISPARADOR (TRIGGER) */}
            <div className="rounded-xl border border-hairline bg-surface-card-elevated/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-caption-uppercase font-bold tracking-wider text-primary">
                  <span>⚡ PASO 1: CUANDO OCURRA EL DISPARADOR</span>
                </span>
                <Badge variant="default">Evento interno</Badge>
              </div>

              <div>
                <label htmlFor="trigger-event-select" className="mb-1 block text-caption text-muted">
                  Selecciona el evento desencadenante:
                </label>
                <select
                  id="trigger-event-select"
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    setStatusCondition("");
                    setPriorityCondition("");
                  }}
                  className={inputClasses}
                >
                  <optgroup label="Proyectos">
                    {AUTOMATION_EVENT_DEFINITIONS.filter((e) => e.category === "project").map((e) => (
                      <option key={e.type} value={e.type}>
                        {e.label} ({e.type})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Tareas">
                    {AUTOMATION_EVENT_DEFINITIONS.filter((e) => e.category === "task").map((e) => (
                      <option key={e.type} value={e.type}>
                        {e.label} ({e.type})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Hitos">
                    {AUTOMATION_EVENT_DEFINITIONS.filter((e) => e.category === "milestone").map((e) => (
                      <option key={e.type} value={e.type}>
                        {e.label} ({e.type})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Colaboración & Archivos">
                    {AUTOMATION_EVENT_DEFINITIONS.filter((e) => e.category === "collaboration").map((e) => (
                      <option key={e.type} value={e.type}>
                        {e.label} ({e.type})
                      </option>
                    ))}
                  </optgroup>
                </select>
                {currentEventDef && (
                  <p className="mt-1.5 text-caption text-muted">
                    {currentEventDef.description}
                  </p>
                )}
              </div>

              {/* Conditions / Filters */}
              {(currentEventDef?.supportsStatusFilter || currentEventDef?.supportsPriorityFilter) && (
                <div className="rounded-lg border border-hairline bg-surface-card p-3 space-y-3">
                  <p className="text-[12px] font-semibold text-body-strong uppercase tracking-wide">
                    Filtros y Condiciones (Opcionales)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentEventDef.supportsStatusFilter && (
                      <div>
                        <label className="block text-caption text-muted mb-1">
                          Filtrar por estado del ítem:
                        </label>
                        <select
                          value={statusCondition}
                          onChange={(e) => setStatusCondition(e.target.value)}
                          className={inputClasses}
                        >
                          <option value="">Cualquier estado (sin filtro)</option>
                          {currentEventDef.availableStatuses?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              Solo cuando sea: {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {currentEventDef.supportsPriorityFilter && (
                      <div>
                        <label className="block text-caption text-muted mb-1">
                          Filtrar por prioridad:
                        </label>
                        <select
                          value={priorityCondition}
                          onChange={(e) => setPriorityCondition(e.target.value)}
                          className={inputClasses}
                        >
                          <option value="">Cualquier prioridad</option>
                          <option value="urgent">Solo: Urgente</option>
                          <option value="high">Solo: Alta</option>
                          <option value="medium">Solo: Media</option>
                          <option value="low">Solo: Baja</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CONECTOR VISUAL */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full border border-hairline-strong bg-surface-card-elevated px-4 py-1.5 text-caption font-medium text-body-strong">
                <span>ENTONCES EJECUTAR LA ACCIÓN</span>
                <span className="text-primary font-bold">➔</span>
              </div>
            </div>

            {/* SECCIÓN 2: ACCIÓN (ACTION) */}
            <div className="rounded-xl border border-hairline bg-surface-card-elevated/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-caption-uppercase font-bold tracking-wider text-primary">
                  <span>🎯 PASO 2: ACCIÓN RESULTANTE</span>
                </span>
                <Badge variant="success">Ejecución automática</Badge>
              </div>

              <div>
                <label className="mb-2 block text-caption text-muted">
                  Tipo de acción a desencadenar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AUTOMATION_ACTION_DEFINITIONS.map((act) => {
                    const isSelected = selectedAction === act.value;
                    return (
                      <button
                        key={act.value}
                        type="button"
                        onClick={() => setSelectedAction(act.value)}
                        className={`text-left rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-hairline bg-surface-card hover:bg-surface-card-elevated"
                        }`}
                      >
                        <p className="text-body-sm font-semibold text-body-strong">{act.label}</p>
                        <p className="text-caption text-muted mt-1">{act.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-config para notificaciones */}
              {selectedAction === "notify_project_audience" && (
                <div className="rounded-lg border border-hairline bg-surface-card p-3.5 space-y-3">
                  <p className="text-[12px] font-semibold text-body-strong uppercase tracking-wide">
                    Personalización de la Notificación
                  </p>

                  <div>
                    <label className="block text-caption text-muted mb-1">
                      Título de la notificación (opcional):
                    </label>
                    <input
                      type="text"
                      value={titleTemplate}
                      onChange={(e) => setTitleTemplate(e.target.value)}
                      placeholder="Ej. Tarea lista para revisión: {taskTitle}"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label className="block text-caption text-muted mb-1">
                      Mensaje de la notificación (opcional):
                    </label>
                    <textarea
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      placeholder="Ej. La tarea {taskTitle} en el proyecto {projectName} cambió a {status}."
                      rows={2}
                      className="w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />

                    {/* Placeholder helper buttons */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted">Variables disponibles:</span>
                      {["projectName", "taskTitle", "status", "userName"].map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertPlaceholder(variable)}
                          className="rounded border border-hairline bg-surface-card-elevated px-2 py-0.5 font-mono text-[11px] text-primary hover:bg-primary/20 transition-colors"
                        >
                          +{`{${variable}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-caption text-muted mb-1">Nivel de alerta:</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as "info" | "reminder" | "alert")}
                      className={inputClasses}
                    >
                      <option value="reminder">Recordatorio normal</option>
                      <option value="info">Informativo</option>
                      <option value="alert">Alerta / Crítico</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Sub-config para webhook forward */}
              {selectedAction === "webhook_forward" && (
                <div className="rounded-lg border border-hairline bg-surface-card p-3.5 space-y-3">
                  <p className="text-[12px] font-semibold text-body-strong uppercase tracking-wide">
                    Destino del Reenvío Webhook
                  </p>

                  <div>
                    <label className="block text-caption text-muted mb-1">
                      Endpoint objetivo:
                    </label>
                    <select
                      value={targetWebhookId}
                      onChange={(e) => setTargetWebhookId(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">Todos los webhooks activos con suscripción</option>
                      {webhooks.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.url})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-caption text-muted">
                      El payload viaja con firma HMAC-SHA256 en la cabecera <code>x-admipy-signature</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>

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
          <Button type="submit" form="rule-form" disabled={isSubmitting}>
            {isSubmitting ? "Guardando regla..." : isEditing ? "Actualizar Regla" : "Crear Regla"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
