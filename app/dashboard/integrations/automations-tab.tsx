"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/shared/card";
import { RuleCard } from "@/features/automations/rule-card";
import { RuleEditorModal } from "@/features/automations/rule-editor-modal";
import { RuleTestModal } from "@/features/automations/rule-test-modal";
import type { AutomationRuleView } from "@/features/automations/types";
import type { WebhookView } from "@/features/webhooks";

interface AutomationsTabProps {
  automations: AutomationRuleView[];
  webhooks: WebhookView[];
}

export function AutomationsTab({ automations, webhooks }: AutomationsTabProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");

  const [editingRule, setEditingRule] = useState<AutomationRuleView | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [testingRule, setTestingRule] = useState<AutomationRuleView | null>(null);

  const filteredRules = automations.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(search.toLowerCase()) ||
      rule.event.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && rule.active) ||
      (filterStatus === "paused" && !rule.active);

    return matchesSearch && matchesStatus;
  });

  function openCreateWithPreset(preset: Partial<AutomationRuleView>) {
    setEditingRule({
      id: "",
      name: preset.name || "",
      event: preset.event || "project.completed",
      action: preset.action || "notify_project_audience",
      config: preset.config || { conditions: {}, actionConfig: {} },
      active: true,
      created_by: null,
      created_at: new Date().toISOString(),
    });
    setIsCreating(true);
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-md font-semibold text-ink">
            Motor de Reglas y Automatizaciones (17.6)
          </h2>
          <p className="text-body-sm text-muted">
            Define flujos automáticos conectando eventos internos con acciones inmediatas (Disparador ➔ Acción).
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingRule(null);
            setIsCreating(true);
          }}
          className="self-start sm:self-auto"
        >
          + Nueva Regla
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-card p-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o evento..."
            className="h-9 w-full rounded-md border border-hairline bg-surface-card-elevated px-3 text-body-sm text-body-strong focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-caption text-muted mr-1">Filtrar:</span>
          {(
            [
              { id: "all", label: `Todas (${automations.length})` },
              { id: "active", label: "Activas" },
              { id: "paused", label: "Pausadas" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilterStatus(opt.id)}
              className={`rounded-md px-2.5 py-1 text-caption transition-colors ${
                filterStatus === opt.id
                  ? "bg-surface-strong text-body-strong font-medium"
                  : "text-muted hover:text-body-strong"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules list */}
      {filteredRules.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={(r) => {
                setEditingRule(r);
                setIsCreating(true);
              }}
              onTest={(r) => setTestingRule(r)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-hairline-strong bg-surface-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl" aria-hidden="true">⚡</span>
            <h3 className="mt-3 text-title-sm font-semibold text-body-strong">
              {search || filterStatus !== "all"
                ? "No se encontraron reglas con ese filtro"
                : "No hay reglas de automatización configuradas"}
            </h3>
            <p className="mt-1 max-w-md text-caption text-muted">
              Crea una regla para que cuando una tarea o proyecto cambie de estado, se notifique a los interesados o se transmita a tus sistemas externos.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                onClick={() => {
                  setEditingRule(null);
                  setIsCreating(true);
                }}
              >
                Crear primera regla
              </Button>
            </div>

            {/* Presets */}
            <div className="mt-8 border-t border-hairline pt-6 w-full max-w-xl text-left">
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted mb-3 text-center">
                O empieza con una plantilla rápida:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openCreateWithPreset({
                      name: "Notificar al equipo al finalizar un proyecto",
                      event: "project.completed",
                      action: "notify_project_audience",
                      config: {
                        conditions: {},
                        actionConfig: {
                          titleTemplate: "¡Proyecto finalizado: {projectName}!",
                          messageTemplate: "El proyecto ha sido completado con éxito.",
                          severity: "info",
                        },
                      },
                    })
                  }
                  className="rounded-lg border border-hairline bg-surface-card-elevated p-3 text-left hover:border-primary transition-colors"
                >
                  <p className="text-body-sm font-medium text-body-strong">🎉 Proyecto finalizado</p>
                  <p className="text-caption text-muted mt-0.5">Notifica a toda la audiencia del proyecto.</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openCreateWithPreset({
                      name: "Reenviar tareas críticas a webhook",
                      event: "task.status_changed",
                      action: "webhook_forward",
                      config: {
                        conditions: { priority: "urgent" },
                        actionConfig: {},
                      },
                    })
                  }
                  className="rounded-lg border border-hairline bg-surface-card-elevated p-3 text-left hover:border-primary transition-colors"
                >
                  <p className="text-body-sm font-medium text-body-strong">🚨 Tarea urgente movida</p>
                  <p className="text-caption text-muted mt-0.5">Reenvía eventos de tareas urgentes a webhooks.</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {isCreating && (
        <RuleEditorModal
          rule={editingRule}
          webhooks={webhooks}
          onClose={() => {
            setIsCreating(false);
            setEditingRule(null);
          }}
          onSuccess={() => {
            setIsCreating(false);
            setEditingRule(null);
          }}
        />
      )}

      {testingRule && (
        <RuleTestModal
          rule={testingRule}
          onClose={() => setTestingRule(null)}
        />
      )}
    </div>
  );
}
