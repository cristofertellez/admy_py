# QA — Historias 4.1, 4.3 y 4.5: Clientes

Historias: BACKLOG.md → Épica 4 (Administración de Clientes, Editar Cliente, Detalle del Cliente)

Fecha: 2026-10-04

Sesión de QA independiente (solo verificación, sin cambios de código). Sin cambios de código desde la sesión anterior (tsc/eslint/build ya verificados en verde; tsc y eslint re-ejecutados en esta sesión: PASS).

---

## 1. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS (sin cambios de código desde la sesión 3.x) |
| Consulta de solo lectura a la BD (estado de clientes, asignaciones, eventos de auditoría, agregados del detalle) | PASS |

## 2. Historia 4.1 — Administración de Clientes

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Validar búsqueda | PASS | Server-side `LIKE` sobre `company_name`, `contact_name`, `email`, `phone` (`clients.service.ts:73-79`) — coherente con el placeholder "Search by company, contact, email or phone...". Debounce 400 ms → estado en URL → `manualFiltering` en el DataTable (sin filtrado cliente duplicado). Campos verificados con datos reales (los 4 poblados en la BD). |
| Validar paginación | PASS (implementación) | `total` vía COUNT con los mismos filtros + `LIMIT/OFFSET`, estado en URL (`page`), paginador compartido con ventanas de 7 páginas. Nota: la BD tiene 5 clientes (una sola página); la página 2 no es ejercitable con datos reales, verificación a nivel de implementación. |
| Validar filtros | **FAIL (hallazgo 4.1-A)** | El único filtro de la tabla es "Status" (active/inactive) y filtra la columna `status`. Ver hallazgo. |
| Validar rendimiento | PASS (con nota) | 2 consultas por carga (COUNT + página), sin N+1; columna de orden restringida a allowlist (`SORTABLE_COLUMNS`); scope de datos (`clientScope`) empujado al WHERE. Nota: `LIKE '%…%'` con comodín inicial no aprovecha índices — aceptable con 5 filas, a vigilar al crecer el dataset. |

### Hallazgo 4.1-A (bug, medio): filtro "Status" desconectado del estado real

- El filtro "Status" filtra por la columna `status` (`active`/`inactive`), pero **nada en la aplicación escribe `status='inactive'`**: el formulario de creación no ofrece el campo (default `'active'` en `clientSchema`), la edición lo excluye explícitamente (`clientTextFields`, flujos dedicados) y Archivar/Restaurar togglea `is_active` + `deleted_at` sin tocar `status` (`clients.service.ts:502-520`).
- Consecuencias verificadas con datos reales (Terra Agro: `is_active=0`, `status='active'`):
  1. El filtro "Inactive" siempre devuelve "No results found".
  2. Los clientes archivados aparecen bajo el filtro "Active" y en el listado por defecto con badge verde "active" mientras la columna de acciones ofrece "Restore" — contradicción visual en la misma fila.
  3. El detalle del cliente (4.5) sí muestra "Archived" correctamente (usa `is_active`) — el listado es la superficie inconsistente.
- Nota: el seed (`scripts/seed-demo.mjs:216,225`) también crea Terra Agro con `is_active=0` y `status` hardcodeado `'active'`, replicando el estado inconsistente.
- Corrección sugerida (fuera de alcance de esta sesión): alinear el filtro y el badge del listado con `is_active` (como hace el detalle), o mantener `status` sincronizado en archive/restore; re-verificar tras el cambio.

## 3. Historia 4.3 — Editar Cliente

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Validar actualización | PASS (código) | `updateClient` (`actions/clients.ts:93-134`): guard `clients.update`, esquema Zod compartido (`clientSchema`: company requerido ≤200, email/website con formato, límites por campo), `getById` previo aplica verificación de visibilidad y captura valores para el diff, actualización limitada a campos de texto + `updated_by`, `revalidatePath` del listado y del detalle, respuesta tipada success/error. Estado e intermediario quedan fuera de la edición (flujos dedicados 4.4/4.6), documentado en la implementación. |
| Validar historial | PASS (código) | Auditoría `updated_client` con diff `old_value`/`new_value` **solo de campos modificados** y sin evento cuando no hay cambios (coherente con 4.3/6.3). `updated_client` ∈ `CLIENT_HISTORY_ACTIONS.client` (`clients.types.ts:76`) → el evento alimenta la pestaña Timeline del detalle (4.7). Nota: la BD aún no tiene eventos `updated_client` (la edición no se ha ejercitado con datos reales); verificación a nivel de código. |

## 4. Historia 4.5 — Detalle del Cliente

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Información correcta | PASS | Todas las secciones requeridas presentes: datos generales y contacto (Overview), estado (badge Active/Archived vía `is_active` — correcto), proyectos activos/finalizados (StatCards + pestaña Projects con agrupación), intermediario asignado (tarjeta con gestión 4.6), actividad reciente (Timeline + tarjeta Last Activity), archivos (Documents, 4.8) y comentarios (Comments, 4.9). Widgets 4.10 (Total/Active/Completed Projects, Worked Hours, Upcoming Deliveries, Last Activity). Agregados verificados contra la BD para Norte Digital SRL: 2 proyectos (1 activo, 1 completado), 520 h, 3 entregas próximas, 7 eventos de historial alcanzables. |
| Responsive | PASS | Grids `grid-cols-2 lg:grid-cols-4` (stats), `lg:grid-cols-2` (tarjetas), barra de pestañas `overflow-x-auto` con `role="tablist"`/`aria-selected`, textos con `truncate` y `min-w-0`. |

Observaciones (no bloqueantes):

1. La historia pide "Intermediarios asignados" (plural); la implementación usa un único `intermediary_id` en `clients` — interpretación ya documentada en el backlog (4.6) como asignación individual.
2. `generateMetadata` maneja errores de visibilidad con título fallback; el cuerpo redirige a `/unauthorized` si el cliente no es visible (`isAccessDeniedError`).
3. La página carga 8 fuentes de datos en paralelo (`Promise.all`) — buen patrón de rendimiento, sin N+1.

## 5. Resumen de la sesión

| Historia | QA pendiente | Resultado |
| --- | --- | --- |
| 4.1 | Búsqueda, filtros, paginación, rendimiento | 3/4 PASS — **filtro "Status" desconectado del archivado (4.1-A)** |
| 4.3 | Actualización, historial | 2/2 PASS (verificación de código; sin eventos reales en BD aún) |
| 4.5 | Información correcta, responsive | 2/2 PASS |

Acciones sugeridas para el equipo (no ejecutadas en esta sesión por ser QA de solo verificación):

1. Alinear el filtro/badge de estado del listado de clientes con `is_active` o sincronizar `status` en archive/restore (4.1-A) y re-verificar "Validar filtros".
2. Considerar un índice/estrategia de búsqueda para `clients` cuando el dataset crezca (nota de rendimiento).
