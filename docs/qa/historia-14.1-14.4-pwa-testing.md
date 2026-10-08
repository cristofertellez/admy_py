# QA — Historias 14.1–14.4: PWA Testing

Historias: BACKLOG.md → Épica 14 (Configuración Base de la PWA, Instalación, Modo Offline, Sincronización Automática)

Fecha: 2026-10-04

Sesión de QA independiente (solo verificación, sin cambios de código). Verificación en runtime con build de producción servido vía `next start` (puerto local).

---

## 1. Verificación automatizada y en runtime

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `GET /manifest.json` | 200, `application/json` (name/short_name, `start_url: /dashboard`, `display: standalone`, `scope: /`, iconos 192/512/512-maskable) |
| `GET /sw.js` | 200, `application/javascript`, **`Service-Worker-Allowed: /`** + **`Cache-Control: public, max-age=0, must-revalidate`** (headers de instalabilidad y detección de versiones) |
| `GET /icons/{icon-192,icon-512,icon-512-maskable,icon.svg}` | 200 con contenido (3.025/10.484/6.502/759 bytes) |
| `GET /offline` | 200 — página de respaldo con recientes y "Retry connection" |
| `GET /dashboard` sin sesión | 307 redirect (protección de auth a nivel edge; el SW no interfiere) |
| `POST /api/pwa/events` sin sesión | 401 (validación de autenticación; la ruta además restringe tipos a `{installed,updated,sync_completed,offline_error,reconnected}`) |

## 2. Historia 14.1 — Configuración Base de la PWA

| Elemento | Resultado | Evidencia |
| --- | --- | --- |
| Configuración de manifest | PASS | `public/manifest.json` completo y servido correctamente (iconos con propósito maskable, theme/background color, categorías). |
| Configuración de Service Worker | PASS | `public/sw.js` (v3) registrado en producción por `ServiceWorkerRegister`; headers correctos en `next.config.ts` (verificado por HTTP). |
| Configuración de íconos | PASS | 192/512/maskable presentes y accesibles; `manifest` + metadata `icons` + apple icons consistentes. |
| Configuración de metadatos | PASS | `app/layout.tsx`: manifest, `appleWebApp` (capable/statusBarStyle/title), iconos apple + SVG, meta legado `apple-mobile-web-app-capable` (iOS < 16.4), `viewport.themeColor`. |
| Banner de instalación | PASS | `InstallPrompt`: `beforeinstallprompt` con `preventDefault`, detección standalone (`matchMedia` + `navigator.standalone`), guía manual iOS (Safari no dispara el evento), persistencia de dismiss y auditoría de instalación vía `/api/pwa/events`. Montado en el layout del dashboard. |
| Verificación de instalación | PASS | Criterios Chromium re-verificados por HTTP en esta sesión (manifest + SW con `Service-Worker-Allowed` + iconos + headers); Lighthouse 100 % ya verificado (docs/qa/historia-14.2). |
| Indicadores visuales | PASS | `ConnectivityIndicator` en el header (Online/Offline/Syncing…/Sync error, cambios pendientes, conflictos, última sincronización, Retry) + `OfflineBanner`. |
| Compatibilidad | **PENDIENTE (por entorno)** | Requiere dispositivos físicos Android/iOS/macOS y despliegue HTTPS — explícitamente delegado a la Historia 14.11 en el backlog. No verificable en esta sesión (sin dispositivos ni HTTPS). |

## 3. Historia 14.2 — Instalación

| Elemento | Resultado |
| --- | --- |
| Criterios de instalabilidad Chromium (manifest, SW, iconos, headers) | PASS — re-verificado por HTTP en esta sesión |
| apple-touch-icon para iOS/Safari | PASS (metadata + icono 192 servido) |
| Guía de instalación manual iOS | PASS (`InstallPrompt` variante `ios-manual`) |
| Chrome / Edge / Windows | PASS a nivel de criterios técnicos (Lighthouse 100 % + headers) |
| Prueba física Android / iOS / macOS | **PENDIENTE (por entorno)** — requiere HTTPS y dispositivos físicos, según el backlog |

## 4. Historia 14.3 — Modo Offline

Todas las afirmaciones de implementación de la historia verificadas en `public/sw.js`:

| Afirmación | Resultado |
| --- | --- |
| Páginas visitadas servidas offline (Network First, máx. 20) | PASS — `handleNavigation` + `PAGES_CACHE` con `trimCache(20)` |
| Payloads RSC cacheados para navegación cliente | PASS — header `RSC`/`_rsc` → `handleClientNavigation` (Network First) |
| Payloads prefetch excluidos | PASS — filtro `Next-Router-Prefetch` |
| Fallo de caché RSC → error al router (nunca HTML de /offline como flight data) | PASS — `Response.error()` documentado y correcto |
| Respaldo `/offline` para navegaciones nunca visitadas | PASS — precacheado en install + servido (HTTP 200 verificado) |
| Assets de build y tipografías offline (Cache First) | PASS — `_next/static` + `fonts.gstatic.com`/extensiones |
| Iconos/imágenes vistas offline (SWR) | PASS — `RUNTIME_CACHE` con límite 60 |
| Banner offline "solo lectura" | PASS — `OfflineBanner` sticky, `role="status"`, `aria-live="polite"`, montado en el layout del dashboard |
| Sin interferencia con datos/APIs | PASS — `/api/`, `/auth/`, `/rest/` y no-GET excluidos |
| Recientes offline | PASS — `OfflineRecents` en `/offline` |

Nota: los pasos de simulación con DevTools del checklist manual (`docs/qa/historia-14.3-modo-offline.md`) requieren un navegador real con sesión iniciada; verificación de código + HTTP completada aquí, pasos con navegador pendientes de pase humano (estado de la historia se mantiene en Testing).

## 5. Historia 14.4 — Sincronización Automática

| Requisito | Resultado | Evidencia |
| --- | --- | --- |
| Sincronizar cambios pendientes | PASS | `SyncManager.triggerSync()`: `resumePausedMutations()` → `flushPendingActions()` (FIFO, detiene en primer fallo transitorio para preservar orden) → `invalidateQueries()`; catch-up al arrancar si hay cola de sesiones previas; `OfflineSyncManager` montado con `autoSync` según ajuste `pwa_background_sync` (14.13). Cola persistente `pwa-pending-actions-v1` con payloads validados por Zod y 5 tipos de acción; features ya la usan (`useQueuedFormAction` en comentarios de proyecto/tarea, `useOfflineQueue`). |
| Resolver conflictos (servidor = fuente de verdad) | **PARTIAL — hallazgo 14.4-A** | Rechazos del servidor → `conflict: true` con mensaje, excluidos del flush automático, nunca descartados automáticamente. `retryPendingAction()` y `discardPendingAction()` existen como infraestructura, pero **ningún componente los consume**: el "Retry" del indicador ejecuta `flushPendingActions()`, que filtra `conflict === true` — un conflicto no puede limpiarse desde la UI y el badge "N conflicts" persistiría indefinidamente. |
| Mostrar estado de sincronización | PASS | `ConnectivityIndicator`: Syncing… (spinner)/Online/Offline/Sync error, "N pending changes", "N conflicts", tooltip con última sincronización/último error, Retry manual, `aria-live`. |
| Registrar errores | PASS | Log acotado por acción (`lastError`), `console.error` en conflictos/flush, eventos PWA auditados (`sync_completed`, `offline_error`, `reconnected`) vía `/api/pwa/events` (401 sin sesión verificado). |

### Hallazgo 14.4-A (bug/UX gap, medio): conflicto sin superficie de resolución manual

- Reproducción: encolar un comentario offline cuyo proyecto fue eliminado antes de reconectar → el servidor rechaza → acción marcada conflicto → badge "1 conflict" permanente; "Retry" no la reintenta (está filtrada) y no existe UI que liste/descarte acciones en conflicto.
- Corrección sugerida (fuera de alcance): panel/lista de acciones en conflicto (mensaje + Reintentar/Descartar) conectado a `retryPendingAction`/`discardPendingAction` en `lib/offline/sync.ts:107-132`.

### Hallazgo 14.4-B (documentación desactualizada, bajo)

- El texto de la historia 14.4 y `docs/qa/historia-14.4-sincronizacion-automatica.md` referencian la arquitectura anterior (`lib/sync/offline-queue.ts`, `enqueueOfflineMutation`/`registerSyncHandler`, `flushOfflineQueue`, "los módulos de features la adoptarán al migrar"). La implementación actual vive en `lib/offline/pending-actions.ts` + `lib/offline/sync.ts` + `lib/sync/sync-manager.ts` con `useQueuedFormAction`/`useOfflineQueue`, y las features ya la adoptaron (comentarios de proyecto/tarea, task.update/complete, project.update).
- Acción tomada en esta sesión (solo backlog): nota de 14.4 actualizada con la API real y referencia a este QA. El guía QA histórica queda como registro de la iteración anterior.

## 6. Resumen de la sesión

| Historia | Resultado |
| --- | --- |
| 14.1 | PASS completo en criterios técnicos; "Compatibilidad" pendiente por dispositivos físicos/HTTPS (14.11) |
| 14.2 | PASS en criterios Chromium/Windows + iOS preparado; pruebas físicas Android/iOS/macOS pendientes por entorno |
| 14.3 | PASS — todas las afirmaciones del SW/banner verificadas (código + HTTP); pasos con navegador pendientes de pase humano |
| 14.4 | 3/4 PASS; **hallazgo 14.4-A** (conflictos sin UI de resolución) + **14.4-B** (doc desactualizada, corregida en backlog) |

Acciones sugeridas para el equipo (no ejecutadas por ser QA de solo verificación):

1. Añadir superficie de UI para resolver conflictos de la cola offline (reintento/descarte por acción).
2. Actualizar `docs/qa/historia-14.4-sincronizacion-automatica.md` a la arquitectura vigente.
3. Ejecutar el pase humano con navegador (DevTools offline) y las pruebas físicas de 14.2/14.11 cuando exista despliegue HTTPS.
