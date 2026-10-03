# QA — Épica 17: API pública, Webhooks, Automatizaciones e Importación

Alcance: API v1 (17.1/17.2), webhooks (17.3), bus de eventos (17.7),
automatizaciones (17.6), calendario ICS (17.4), importación CSV (17.10),
exportación global (17.11) y health check (17.12).

## API v1

1. **Autenticación** — sin cabecera → 401; key revocada/expirada → 401;
   `Authorization: Bearer apk_...` válida → 200 con envolvente
   `{data, pagination, version:"v1"}`.
2. **Rate limit** — más de 60 peticiones en un minuto por key → 429 con
   mensaje; la ventana se reinicia al minuto.
3. **Scoping** — una key de un usuario Client solo lista sus proyectos
   (actor context asíncrono sobre `lib/auth-scope`); una key de Developer
   lista todo. `last_used_at` se actualiza y `used_api` aparece en el
   Activity Log.
4. **Endpoints** — `/api/v1/projects?status=...&page=`,
   `/api/v1/projects/{id}` (tareas + hitos), `/api/v1/tasks` (filtros
   status/priority/assignee/project/search), `/api/v1/clients`,
   `/api/v1/milestones?project=` (400 sin `project`),
   `/api/v1/openapi` (documento 3.1 importable), `/api/v1/calendar`
   (text/calendar con VEVENTs).
5. **Gestión** — `/dashboard/integrations`: crear key (secreto visible una
   vez), revocar (401 inmediato), eliminar; todo auditado.

## Webhooks

1. Crear un webhook HTTPS suscrito a `project.created` con receptor de
   pruebas (p. ej. webhook.site): crear un proyecto → POST firmado con
   `x-admipy-signature` (HMAC-SHA256 del body con el secret mostrado) y
   `x-admipy-event`.
2. Receptor caído → la entrega queda pending con error; "Retry pending"
   la reprocesa; el historial muestra intentos, código HTTP y error.
3. Pausar el webhook detiene las entregas; el flujo nunca bloquea la
   mutación original (side channels en `after()`).

## Automatizaciones

- Regla "milestone.completed → notify_project_audience": completar un
  hito genera la notificación de la audiencia con dedupe por
  regla/evento/día; pausar la regla la detiene.

## Importación / Exportación

- CSV de clientes con cabeceras `company_name,contact_name,email,phone,status`:
  "Validate" reporta filas válidas/errores sin escribir; "Import" crea
  solo las válidas y audita `imported_data` + publica `client.created`.
- CSV de proyectos resuelve el cliente por email o empresa; cliente
  inexistente → error de fila con instrucción.
- `GET /api/export/global` (Developer/Super Administrator) devuelve ZIP
  con clients/projects/tasks/milestones/activity-log/settings.csv y
  audita `exported_globals`; roles inferiores reciben 403.
- `GET /api/health` responde `{status, checks.database, latencyMs}` y 503
  si la base de datos no responde.
