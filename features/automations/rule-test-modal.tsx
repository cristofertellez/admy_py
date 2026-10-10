"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { testAutomationRule } from "@/actions/integrations";
import type { AutomationRuleView, AutomationTestResult } from "./types";

interface RuleTestModalProps {
  rule: AutomationRuleView;
  onClose: () => void;
}

export function RuleTestModal({ rule, onClose }: RuleTestModalProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [result, setResult] = useState<AutomationTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function runTest() {
      setIsRunning(true);
      setError(null);
      try {
        const response = await testAutomationRule(rule.id);
        if (!mounted) return;
        if (response.error) {
          setError(response.error);
        } else if (response.testResult) {
          setResult(response.testResult);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error durante la prueba diagnóstica.");
        }
      } finally {
        if (mounted) {
          setIsRunning(false);
        }
      }
    }
    void runTest();
    return () => {
      mounted = false;
    };
  }, [rule.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-modal-title"
    >
      <Card className="w-full max-w-xl max-h-[90vh] flex flex-col border-hairline-strong bg-surface-card shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-hairline pb-4">
          <div>
            <CardTitle id="test-modal-title" className="text-title-md text-ink">
              Simulación Diagnóstica de Automatización
            </CardTitle>
            <p className="text-caption text-muted mt-0.5">
              Prueba segura en seco para la regla: <strong className="text-body-strong">{rule.name}</strong>
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
          {isRunning ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-body-sm text-muted">Ejecutando simulación de evento y evaluando condiciones...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-error/40 bg-error/10 p-4 text-body-sm text-error">
              <p className="font-semibold">Error al probar la regla:</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Outcome Status */}
              <div className="flex items-center justify-between rounded-lg border border-hairline bg-surface-card-elevated p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-body-strong">Resultado:</span>
                  <Badge variant={result.conditionsPassed ? "success" : "warning"}>
                    {result.conditionsPassed ? "Condiciones Aprobadas" : "Condición No Cumplida"}
                  </Badge>
                </div>
                <span className="font-mono text-caption text-muted">{result.event}</span>
              </div>

              {/* Conditions Diagnostic */}
              <div className="rounded-lg border border-hairline bg-surface-card-elevated/60 p-3.5">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  1. Evaluación del Disparador y Condiciones
                </p>
                <p className="mt-1 text-body-sm text-body-strong">{result.conditionDetails}</p>
              </div>

              {/* Action Diagnostic */}
              <div className="rounded-lg border border-hairline bg-surface-card-elevated/60 p-3.5">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  2. Ejecución de la Acción ({result.actionExecuted})
                </p>
                <p className="mt-1 text-body-sm text-body-strong">{result.actionDetails}</p>

                {result.evaluatedMessage && (
                  <div className="mt-2.5 rounded border border-hairline bg-surface-card p-2.5">
                    <p className="text-[11px] text-muted font-medium">Previsualización del mensaje generado:</p>
                    <p className="mt-1 font-mono text-caption text-primary break-words">
                      {result.evaluatedMessage}
                    </p>
                  </div>
                )}
              </div>

              {/* Simulated Payload Inspector */}
              <div className="rounded-lg border border-hairline bg-surface-card-elevated/60 p-3.5">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                  3. Payload Simulado del Evento
                </p>
                <pre className="max-h-40 overflow-auto rounded bg-surface-card p-2.5 font-mono text-[12px] text-body">
                  {JSON.stringify(result.simulatedPayload, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </CardContent>

        <div className="flex justify-end border-t border-hairline p-4 bg-surface-card-elevated/40">
          <Button type="button" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </Card>
    </div>
  );
}
