# QA — Historia 14.3: Modo Offline

Historia: BACKLOG.md → Épica 14 / Historia 14.3 (Modo Offline)

Fecha de ejecución: 2026-08-22

Enfoque acordado: **solo caché del Service Worker, sin persistencia de datos** (cero IndexedDB/localStorage de datos en el proyecto). El contenido offline proviene exclusivamente de las cachés HTTP descritas en la Historia 14.5.

---

## 1. Alcance implementado

### Service Worker (`public/sw.js`)

| Comportamiento | Estrategia | Resultado |
| --- | --- | --- |
| Navegaciones completas (HTML) | Network First → caché Pages (máx. 20) | PASS (preexistente 14.5 + revisado) |
| Payloads RSC de rutas visitadas (`RSC: 1` / `_rsc`) | Network First → caché Pages | PASS (nuevo en 14.3) |
| Payloads prefetch (`Next-Router-Prefetch: 1`) | Excluidos de caché (parciales) | PASS (nuevo en 14.3) |
| Fallo de payload RSC sin caché | `Response.error()` → el router resuelve con navegación completa; nunca se sirve `/offline` como flight data | PASS (nuevo en 14.3) |
| Assets `_next/static`, tipografías | Cache First | PASS (preexistente 14.5) |
| Iconos/imágenes same-origin vistas | Stale While Revalidate (runtime, máx. 60) | PASS (preexistente 14.5) |
| `/api/*`, auth, acciones (no GET) | Sin interferencia del SW | PASS |

### Frontend

| Elemento | Resultado |
| --- | --- |
| `OfflineBanner` sticky bajo el header del dashboard, visible solo sin conexión | PASS |
| Mensaje de datos recientemente vistos + modo solo lectura hasta reconectar | PASS |
| Accesibilidad: `role="status"`, `aria-live="polite"`, foco no robado | PASS |
| Sin shift de layout al aparecer (render condicional post-mount vía `useConnectivity`) | PASS |

### Verificación estática automatizada

| Chequeo | Resultado |
| --- | --- |
| ESLint (`npm run lint`) sobre `lib/`, `app/` | PASS (se corrigieron 2 defectos preexistentes en `lib/sync/`) |
| TypeScript `tsc --noEmit` en archivos tocados (`components/pwa/offline-banner.tsx`, `app/dashboard/layout.tsx`, `lib/sync/*`) | PASS |
 | `next build` producción | RESUELTO: `lib/supabase/*` y sus dependencias fueron eliminadas con la migración a Turso + NextAuth; `next build` compila sin errores. |

---

## 2. Checklist manual (DevTools, build producción)

Requiere `next build && next start` con las dependencias restauradas y sesión iniciada.

### Preparación

- [ ] Visitar en línea: Dashboard, Proyectos, Detalle de proyecto, Tareas, Hitos, Comentarios.
- [ ] DevTools → Application → Cache Storage: verificar entradas en `admipy-pages-v2` (HTML y payloads `text/x-component`).

### Escenario A — Navegación completa offline

- [ ] DevTools → Network → Offline → recargar una página visitada: se sirve desde caché Pages.
- [ ] El banner "You are offline…" es visible bajo el header y anuncia modo lectura.
- [ ] Recargar una página NUNCA visitada: aparece `/offline`.

### Escenario B — Navegación cliente (SPA) offline

- [ ] Offline: clic en enlace del sidebar a una ruta ya visitada: transición exitosa (payload RSC cacheado o fallback de navegación completa).
- [ ] Clic hacia ruta no visitada: aterriza en `/offline` (sin pantalla blanca ni error de hidratación).

### Escenario C — Solo lectura

- [ ] Offline: intentar crear/editar (server action): la acción falla sin corromper la UI; el banner comunica que los cambios no se guardan.
- [ ] Reconectar: banner desaparece, indicador pasa a Online.

### Escenario D — Recursos

- [ ] Offline: assets JS/CSS e iconos cargan desde cachés static/runtime.
- [ ] Imágenes same-origin previamente vistas cargan; imágenes nunca vistas muestran estado vacío controlado.

---

## 3. Limitaciones conocidas (por diseño de este alcance)

1. **Sin persistencia de datos**: si se despliega una nueva versión del build mientras el usuario estuvo offline, los chunks antiguos pueden no estar en caché y la página cacheada puede fallar al hidratar; el respaldo es `/offline`. Semitransparente para el usuario, aceptado para 14.3.
2. **Archivos de R2 por URL firmada** (cross-origin): quedan fuera de la caché del SW; solo aplica a lo previamente visto same-origin. La descarga real de archivos requiere conexión.
3. **Mutaciones offline**: fuera de alcance aquí (Historia 14.8, cola persistente). El banner deja claro el modo lectura.
4. **Datos siempre desactualizados**: la caché Pages es Network First, así que online siempre refresca; offline muestra la última visita. El banner lo comunica.

## 4. Hallazgos

1. Defecto preexistente corregido en `lib/sync/offline-queue.ts`: `readErrorLog()` era referenciado pero no existía (rompía `logSyncError`); se extrajo como función única reutilizada por `getRecentSyncErrors`.
2. Defecto preexistente corregido en `lib/sync/sync-manager.ts`: función muerta `readLastSyncedAt` eliminada.
 3. Bloqueador preexistente resuelto: el stack se migró a Turso + NextAuth (según AGENTS.md); las dependencias Supabase ya no existen y `next build` compila sin errores.
