"use client";

import { useActionState, useState, useTransition } from "react";
import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import { createApiKey, revokeApiKey, deleteApiKey } from "@/actions/integrations";
import type { ApiKeyView } from "@/features/api-keys";

interface ApiKeysTabProps {
  apiKeys: ApiKeyView[];
}

const inputClasses =
  "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

function CopyOnce({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-success/40 bg-success/10 p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-success">
          CLAVE API GENERADA
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
          {copied ? "¡Copiado!" : "Copiar clave"}
        </button>
      </div>
      <p className="break-all font-mono text-caption text-body-strong bg-surface-card p-2 rounded border border-hairline">
        {secret}
      </p>
      <p className="text-[11px] text-muted">
        Copia esta clave ahora. Por seguridad, no volverá a mostrarse en texto plano.
      </p>
    </div>
  );
}

export function ApiKeysTab({ apiKeys }: ApiKeysTabProps) {
  const [keyState, keyAction, keyPending] = useActionState(createApiKey, null);
  const [, startTransition] = useTransition();

  function runAction(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      {/* API Keys List */}
      <Card className="border-hairline bg-surface-card">
        <CardHeader className="border-b border-hairline pb-4">
          <CardTitle className="text-title-md text-ink">Claves API Públicas ({apiKeys.length})</CardTitle>
          <p className="text-caption text-muted mt-0.5">
            Claves de acceso REST v1 seguras para automatizaciones externas y scripts.
          </p>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {apiKeys.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-muted">
              No hay claves API registradas todavía. Crea una para consumir la API pública.
            </p>
          ) : (
            apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-card-elevated p-4 transition-colors hover:border-hairline-strong"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-body-sm font-semibold text-body-strong">{key.name}</p>
                    {key.revoked ? (
                      <Badge variant="error">Revocada</Badge>
                    ) : (
                      <Badge variant="success">Activa</Badge>
                    )}
                  </div>
                  <p className="font-mono text-caption text-primary">{key.prefix}••••••••••••</p>
                  <p className="text-caption text-muted">
                    Alcances: <span className="text-body font-medium">{key.scopes.join(", ")}</span> • Último uso:{" "}
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "nunca"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!key.revoked && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => runAction(() => revokeApiKey(key.id))}
                      className="text-caption"
                    >
                      Revocar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar clave "${key.name}"?`)) {
                        runAction(() => deleteApiKey(key.id));
                      }
                    }}
                    className="text-caption text-muted hover:text-error"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New API Key Form */}
      <Card className="border-hairline bg-surface-card">
        <CardHeader className="border-b border-hairline pb-4">
          <CardTitle className="text-title-sm text-ink">Nueva Clave API</CardTitle>
          <p className="text-caption text-muted mt-0.5">
            Genera un token de autenticación Bearer con alcance acotado.
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <form action={keyAction} className="space-y-4">
            <div>
              <label htmlFor="api-key-name" className="mb-1 block text-caption font-medium text-body-strong">
                Nombre identificador *
              </label>
              <input
                id="api-key-name"
                name="name"
                required
                className={inputClasses}
                placeholder="Ej. Integración Make / Zapier"
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-caption font-medium text-body-strong">Permisos (Scopes)</legend>
              <div className="space-y-2 rounded-lg border border-hairline bg-surface-card-elevated p-3">
                <label className="flex items-center gap-2.5 text-body-sm text-body-strong cursor-pointer">
                  <input
                    type="checkbox"
                    name="scopes"
                    value="read"
                    defaultChecked
                    className="h-4 w-4 rounded border-hairline accent-primary"
                  />
                  <span>
                    <strong>read:</strong> Consulta de proyectos, tareas y clientes
                  </span>
                </label>
                <label className="flex items-center gap-2.5 text-body-sm text-body-strong cursor-pointer">
                  <input
                    type="checkbox"
                    name="scopes"
                    value="write"
                    className="h-4 w-4 rounded border-hairline accent-primary"
                  />
                  <span>
                    <strong>write:</strong> Creación y mutaciones (reservado v2)
                  </span>
                </label>
              </div>
            </fieldset>

            <Button type="submit" disabled={keyPending} className="w-full">
              {keyPending ? "Generando clave..." : "Generar Clave API"}
            </Button>

            {keyState?.error && (
              <p className="text-caption text-error" role="alert">
                {keyState.error}
              </p>
            )}
            {keyState?.secret && <CopyOnce secret={keyState.secret} />}
          </form>

          <div className="mt-4 rounded border border-hairline bg-surface-card-elevated p-3 text-[11px] text-muted space-y-1">
            <p className="font-semibold text-body-strong">Uso de cabecera:</p>
            <code className="block bg-surface-card p-1.5 rounded font-mono text-body text-[11px]">
              Authorization: Bearer &lt;tu_clave&gt;
            </code>
            <p>Límite de tasa: 60 peticiones por minuto por clave.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
