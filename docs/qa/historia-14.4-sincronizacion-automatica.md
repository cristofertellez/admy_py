# QA — Historia 14.4: Sincronización Automática

Historia: BACKLOG.md → Épica 14 / Historia 14.4 (Sincronización Automática)

Fecha: 2026-08-22

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Sincronizar cambios pendientes | `lib/sync/sync-manager.ts`: al recuperar conexión ejecuta `queryClient.resumePausedMutations()` y luego `flushOfflineQueue()`, seguido de `invalidateQueries()` para refrescar datos. |
| Resolver conflictos | Política: el servidor es la fuente de verdad. Una mutación encolada que llega al servidor pero es rechazada (validación/permisos/datos obsoletos) se marca `conflict: true` con su mensaje; no se descarta ni se reintenta automáticamente: queda para reintento manual (`retryQueuedMutation`) o descarte (`discardConflictedMutation`). Las lecturas siempre se resincronizan desde el servidor tras el flush. |
| Mostrar estado de sincronización | `components/pwa/connectivity-indicator.tsx`: estados Syncing… (spinner), Online, Offline, Sync error, "N pending changes", "N conflicts" + botón Retry. `aria-live="polite"` en el contenedor. |
| Registrar errores | `lib/sync/offline-queue.ts` (`logSyncError`): log acotado a 50 entradas en `localStorage` (`admipy-sync-errors-v1`) + `console.error`. Los 5 errores más recientes se exponen en el snapshot del hook `useConnectivity`. |

## 2. Arquitectura

```
providers/query-provider.tsx        monta el SyncManager (start/stop) para toda la app
hooks/use-connectivity.ts           suscripción reactiva (useSyncExternalStore) al snapshot
lib/sync/sync-manager.ts            orquestador singleton ligado al QueryClient
lib/sync/offline-queue.ts           cola persistente (admipy-sync-queue-v1) + registro de handlers
lib/sync/types.ts                   tipos + detección de error transitorio vs conflicto
```

Flujo al recuperar conexión:

1. `onlineManager` notifica reconexión → `triggerSync()`.
2. Se reanudan las mutaciones de TanStack Query pausadas por estar offline.
3. Se reproduce la cola persistente en orden FIFO; ante el primer fallo transitorio se detiene para preservar el orden; los conflictos se marcan y el flush continúa.
4. Se invalidan las queries activas (el servidor manda).
5. Estado final: `synced` o `error` (si hubo conflictos/fallos), con timestamp de última sincronización persistido (`connectivity-last-sync`).

Clasificación de fallos (`isTransientSyncError`): si `navigator.onLine === false` o el mensaje coincide con patrones de red (fetch/timeout/connection…) → **transitorio** (se conserva en la cola). Cualquier otro rechazo del servidor → **conflicto**.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS (pendiente de adjuntar salida en sesión de build) |
| `npm run lint` sin errores ESLint sobre `lib/sync` | PASS (ídem) |

Nota: la app no registra aún mutaciones de cliente (`useMutation`) — todas las escrituras usan Server Actions vía formularios. Por eso `pendingChanges` solo reflejará cambios cuando existan mutaciones encoladas o pausadas; la cola queda lista como infraestructura documentada.

## 4. Checklist manual (build producción, `next start`)

Requisitos: SW registrado solo en producción; usar DevTools → Network → Offline.

### Escenario A — Reconexión básica

- [ ] Con sesión iniciada, alternar Network Offline → Online.
- [ ] Verificar badge "Offline" durante la caída y vuelta a "Online".
- [ ] Verificar que las queries visibles se refrescan tras reconectar (datos actualizados).
- [ ] Verificar tooltip del indicador con hora de última sincronización.

### Escenario B — Mutación pausada (requiere una feature con `useMutation`)

- [ ] Encolar una mutación estando offline (queda `paused` en TanStack Query).
- [ ] Badge "N pending changes" visible.
- [ ] Al reconectar: badge "Syncing…" → "Online", mutación aplicada, contador a 0.

### Escenario C — Cola persistente entre recargas

- [ ] En offline, encolar cambios y recargar la página.
- [ ] Verificar en `localStorage` la clave `admipy-sync-queue-v1`.
- [ ] Al reconectar, los cambios se reproducen una sola vez y la cola queda vacía.

### Escenario D — Conflicto

- [ ] Encolar una mutación cuyo payload será rechazado por el servidor (p. ej. validación).
- [ ] Tras flush: badge "N conflicts" + botón Retry + tooltip con el mensaje del servidor.
- [ ] Verificar que la entrada permanece en `admipy-sync-queue-v1` con `conflict: true` y `lastError`.
- [ ] `retryQueuedMutation(id)` con payload corregido → entrada eliminada.
- [ ] `discardConflictedMutation(id)` → entrada eliminada sin reintento.

### Escenario E — Errores registrados

- [ ] Provocar un conflicto y verificar entrada en `admipy-sync-errors-v1` (máx. 50, más reciente primero).
- [ ] Verificar `console.error('[sync] …')` asociado.

### Escenario F — Catch-up entre sesiones

- [ ] En offline, encolar un cambio y cerrar la pestaña.
- [ ] Reabrir la app con conexión: el arranque detecta la cola pendiente y sincroniza automáticamente sin esperar un ciclo offline→online.

## 5. Notas

1. El `SyncManager` es singleton por `QueryClient`; su ciclo de vida vive en `QueryProvider` (efecto cliente), no en componentes de UI.
2. `useSyncExternalStore` garantiza snapshots estables e hidratación segura (snapshot por defecto en servidor).
3. La invalidación global tras cada sync es deliberada: prioriza consistencia sobre ahorro de peticiones (las queries inactivas no se refetchean hasta su próximo uso).
4. Fuera de alcance para esta historia: UI de revisión de conflictos (lista con retry/descarte por entrada); las APIs ya están disponibles en `lib/sync/offline-queue.ts`.
