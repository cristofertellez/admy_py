"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/shared/card";
import { toggleAutomation, deleteAutomation } from "@/actions/integrations";
import { AUTOMATION_EVENT_DEFINITIONS, AUTOMATION_ACTION_DEFINITIONS } from "./types";
import type { AutomationRuleView } from "./types";

interface RuleCardProps {
  rule: AutomationRuleView;
  onEdit: (rule: AutomationRuleView) => void;
  onTest: (rule: AutomationRuleView) => void;
}

export function RuleCard({ rule, onEdit, onTest }: RuleCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const eventDef = AUTOMATION_EVENT_DEFINITIONS.find((e) => e.type === rule.event);
  const actionDef = AUTOMATION_ACTION_DEFINITIONS.find((a) => a.value === rule.action);

  const conditions = rule.config.conditions;
  const actionConfig = rule.config.actionConfig;

  const hasConditions =
    Boolean(conditions?.status) ||
    Boolean(conditions?.priority) ||
    Boolean(conditions?.filterField);

  function handleToggle() {
    startTransition(async () => {
      await toggleAutomation(rule.id, !rule.active);
    });
  }

  function handleDelete() {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la automatización "${rule.name}"?`)) {
      return;
    }
    setIsDeleting(true);
    startTransition(async () => {
      await deleteAutomation(rule.id);
      setIsDeleting(false);
    });
  }

  return (
    <Card className="overflow-hidden border-hairline bg-surface-card transition-all hover:border-hairline-strong">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 bg-surface-card-elevated/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              rule.active ? "bg-success shadow-[0_0_8px_rgba(51,209,122,0.5)]" : "bg-muted-soft"
            }`}
            aria-hidden="true"
          />
          <h3 className="truncate text-body-sm font-semibold text-body-strong">{rule.name}</h3>
          <Badge variant={rule.active ? "success" : "default"}>
            {rule.active ? "Activo" : "Pausado"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onTest(rule)}
            className="text-caption text-primary hover:text-primary-active hover:bg-primary/10"
            title="Ejecutar simulación diagnóstica"
          >
            ⚡ Probar regla
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
            className="text-caption"
          >
            {rule.active ? "Pausar" : "Activar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(rule)}
            className="text-caption"
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="text-caption text-muted hover:text-error hover:bg-error/10"
          >
            {isDeleting ? "..." : "Eliminar"}
          </Button>
        </div>
      </div>

      {/* Visual Trigger -> Action Flow */}
      <CardContent className="p-4">
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
          {/* Node 1: Disparador (Trigger) */}
          <div className="flex flex-col justify-between rounded-lg border border-hairline bg-surface-card-elevated p-3.5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption-uppercase font-bold tracking-wider text-muted">
                  DISPARADOR (TRIGGER)
                </span>
                {eventDef?.category && (
                  <span className="rounded bg-surface-strong px-2 py-0.5 font-mono text-[11px] text-muted capitalize">
                    {eventDef.category}
                  </span>
                )}
              </div>
              <p className="mt-2 text-body-sm font-semibold text-body-strong">
                {eventDef?.label || rule.event}
              </p>
              <p className="font-mono text-caption text-primary/90 mt-0.5">{rule.event}</p>
              <p className="mt-1.5 text-caption text-muted line-clamp-2">
                {eventDef?.description}
              </p>
            </div>

            {/* Conditions Box */}
            <div className="mt-3 pt-2.5 border-t border-hairline">
              <span className="block text-[11px] font-medium text-muted uppercase">Condiciones:</span>
              {hasConditions ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {conditions?.status && (
                    <Badge variant="warning" className="text-[11px]">
                      Estado = {conditions.status}
                    </Badge>
                  )}
                  {conditions?.priority && (
                    <Badge variant="error" className="text-[11px]">
                      Prioridad = {conditions.priority}
                    </Badge>
                  )}
                  {conditions?.filterField && (
                    <Badge variant="default" className="text-[11px]">
                      {conditions.filterField} = {conditions.filterValue}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-caption text-muted-soft italic">
                  Sin filtros (aplica a todos los eventos)
                </span>
              )}
            </div>
          </div>

          {/* Connector Node */}
          <div className="flex items-center justify-center py-1 md:py-0">
            <div className="flex md:flex-col items-center justify-center gap-1 rounded-full border border-hairline-strong bg-surface-card px-2.5 py-1 text-caption text-muted">
              <span className="text-[11px] font-semibold text-muted">ENTONCES</span>
              <span className="text-primary font-bold">➔</span>
            </div>
          </div>

          {/* Node 2: Acción (Action) */}
          <div className="flex flex-col justify-between rounded-lg border border-hairline bg-surface-card-elevated p-3.5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption-uppercase font-bold tracking-wider text-muted">
                  ACCIÓN (ACTION)
                </span>
                <span className="rounded bg-primary/20 text-primary px-2 py-0.5 text-[11px] font-semibold">
                  {rule.action === "notify_project_audience" ? "Notificación In-App" : "Forward Webhook"}
                </span>
              </div>
              <p className="mt-2 text-body-sm font-semibold text-body-strong">
                {actionDef?.label || rule.action}
              </p>
              <p className="mt-1.5 text-caption text-muted">
                {actionDef?.description}
              </p>
            </div>

            {/* Action Details */}
            <div className="mt-3 pt-2.5 border-t border-hairline">
              {rule.action === "notify_project_audience" ? (
                <div className="space-y-1">
                  {actionConfig?.titleTemplate && (
                    <p className="text-caption text-body">
                      <strong className="text-muted text-[11px]">Título:</strong> {actionConfig.titleTemplate}
                    </p>
                  )}
                  {actionConfig?.messageTemplate && (
                    <p className="text-caption text-muted truncate">
                      <strong className="text-muted text-[11px]">Mensaje:</strong> &ldquo;{actionConfig.messageTemplate}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted">Nivel:</span>
                    <Badge variant={actionConfig?.severity === "alert" ? "error" : "default"}>
                      {actionConfig?.severity || "reminder"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-caption text-muted">
                  <span>Destino: </span>
                  <span className="text-body-strong font-mono">
                    {actionConfig?.webhookId ? `Webhook ID: ${actionConfig.webhookId}` : "Todos los webhooks activos"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2 text-[11px] text-muted">
          <span>Creada: {new Date(rule.created_at).toLocaleDateString()}</span>
          <span className="font-mono text-muted-soft">ID: {rule.id.slice(0, 8)}...</span>
        </div>
      </CardContent>
    </Card>
  );
}
