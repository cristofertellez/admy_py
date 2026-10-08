# QA — Historias 5.1, 5.4, 5.5, 5.7 y 5.9: Intermediarios

Historias: BACKLOG.md → Épica 5 (Administración de Intermediarios, Asignación de Clientes, Vista General, Seguimiento de Proyectos, Comentarios)

Fecha: 2026-10-04

Sesión de QA independiente (solo verificación, sin cambios de código). Sin cambios de código desde la sesión de clientes; `tsc` y `eslint` re-ejecutados en verde en esta sesión.

---

## 1. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| Consulta de solo lectura a la BD (intermediarios, asignaciones, agregados de cartera, progreso de proyectos, comentarios) | PASS |

## 2. Historia 5.1 — Administración de Intermediarios

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Validar filtros | PASS | El filtro "Status" filtra por `u.is_active` (`intermediaries.service.ts:56-57`) — exactamente lo que modifica la acción Deactivate/Activate (`toggleActive`). Coherente, a diferencia del caso de clientes (hallazgo 4.1-A). Ambos intermediarios de la BD están activos. |
| Validar búsqueda | PASS | `LIKE` sobre `first_name`/`last_name`/`email` con debounce 400 ms y estado en URL; probe real: "vega" → 1 coincidencia. |
| Validar rendimiento | PASS (con nota) | 2 consultas (COUNT + página) con el mismo WHERE (rol Intermediary + filtros), sin N+1. Nota: `LIKE '%…%'` no aprovecha índices — aceptable con 2 registros. |

## 3. Historia 5.4 — Asignación de Clientes

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Asignación correcta | PASS | Acción `assignClientsToIntermediary`: guard `clients.update`, Zod (`assignClientsToIntermediarySchema`: uuids, 1–200 clientes). Servicio: valida intermediario activo con rol Intermediary, `assertClientVisible` por cliente, omite duplicados sin fallar y reasigna clientes de otros intermediarios registrando el intermediario previo para el diff de auditoría. Auditoría `assigned_intermediary` por cambio + revalidación del detalle del intermediario, los clientes afectados y el listado. UI: selector múltiple con buscador (empresa/contacto/email), "Current" deshabilitado, badge "Reassign" con tooltip, estados vacíos y feedback `aria-live`. Verificado con datos reales (5 clientes asignados entre 2 intermediarios). |
| Eliminación correcta | PASS | Acción `removeClientFromIntermediary`: guard `clients.update`, valida que el cliente esté asignado a este intermediario (vía `getAssignedIntermediary`, que aplica `assertClientVisible`), remueve, audita `removed_intermediary` con old/new y revalida. UI: confirmación previa en modal accesible. |

Observación (no bloqueante): la asignación por lotes ejecuta una consulta por cliente (hasta 200) — patrón N+1 aceptable por el tamaño del lote y la necesidad de validar visibilidad por cliente; a vigilar si los lotes crecen.

## 4. Historia 5.5 — Vista General del Intermediario

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Información correcta | PASS | `/dashboard/intermediaries/[id]`: datos personales + badge Active/Inactive, clientes asignados (con badge por cliente), tarjetas Total/Active/Completed Projects y Worked Hours, Upcoming Deliveries (hitos y proyectos a 30 días), Last Activity y Timeline de cartera. Agregados verificados contra la BD (claudia.vega: 4 proyectos/2 activos/345 h; martin.sosa: 4/2/2/1045 h). Autorización: `assertCanViewIntermediaryDetail` (Developer con `intermediaries.read` o self-access); el servicio de reportes valida rol Intermediary y excluye clientes archivados (`is_active = 1`). |
| Responsive | PASS | Grids `grid-cols-2 lg:grid-cols-4` y `lg:grid-cols-2`, pestañas `overflow-x-auto` con `role="tablist"`/`aria-selected`, textos `truncate`. |

Observación (menor, para decisión del equipo): `getAssignedClients` no filtra `is_active`/`deleted_at`, por lo que la lista de clientes del Overview incluye clientes inactivos (con badge "Inactive" explícito, p. ej. Terra Agro en la BD), mientras las estadísticas de cartera y reportes los excluyen (`is_active = 1`). Es transparente para el usuario, pero las cifras de "Total Projects" y la lista de clientes provienen de alcances distintos.

## 5. Historia 5.7 — Seguimiento de Proyectos

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Progreso correcto | PASS | Pestaña "Projects (N)" con tarjetas agrupadas Active/Finalized; `completion_percentage` de `projects` (mantenido por el módulo de tareas), acotado 0–100 en la UI, barra accesible (`role="progressbar"` con `aria-valuenow/min/max`), horas trabajadas/estimadas y fechas. Valores reales verificados: 25 %, 70 %, 40 %, 10 %. |
| Estados correctos | PASS | Agrupación Active/Finalized coherente entre UI (`FINALIZED_STATUSES`) y servicio (`FINALIZED_PROJECT_STATUSES`: Completed/Cancelled/Archived). Badges: Completed=success, Cancelled/Archived/Suspended=error, resto=warning. Badge "Overdue" cuando `estimated_end_date` venció y el proyecto sigue activo — verificado con datos reales (Integracion ERP, vence 2026-09-26, estado QA → activo y vencido). Suspended cuenta como activo (no finalizado) en ambos lados. |

## 6. Historia 5.9 — Comentarios (proyectos)

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Crear | PASS | `createProjectCommentAction`: auth, mensaje vacío rechazado; servicio `createProjectComment` aplica `assertProjectVisible`; auditoría `created_comment`, notificación `comment_created` y menciones; formulario raíz con cola offline PWA (`project-comment.create` vía `useQueuedFormAction`). |
| Editar | PASS | Edición inline en la pestaña Comments; regla autor-o-moderador aplicada en la capa de datos (`updateProjectComment`: `requireScopedUser` + `comments.update`/acceso completo), marca `is_edited` + `edited_at`; auditoría `updated_comment`; UI muestra "(edited)". |
| Responder | PASS | `parent_comment_id` validado (mismo proyecto, activo) en el servicio; auditoría distinta `replied_comment`; respuestas anidadas por hilo (`buildThreads`); respuestas van directas (la cola offline no soporta su payload — documentado en el código). Controles gated por permisos/autoría; confirmación en borrado; vacío, error y auto-scroll cubiertos. |

Nota: la BD contiene 3 comentarios de proyecto, 0 respuestas y 0 editados — crear está ejercitado con datos reales; responder/editar verificados a nivel de código (misma infraestructura ya probada por comentarios de cliente, H4.9). Menciones y adjuntos en comentarios siguen pendientes según el backlog.

## 7. Resumen de la sesión

| Historia | QA pendiente | Resultado |
| --- | --- | --- |
| 5.1 | Filtros, búsqueda, rendimiento | 3/3 PASS |
| 5.4 | Asignación, eliminación | 2/2 PASS |
| 5.5 | Información correcta, responsive | 2/2 PASS |
| 5.7 | Progreso, estados | 2/2 PASS |
| 5.9 | Crear, editar, responder | 3/3 PASS |

Observaciones para el equipo (no ejecutadas por ser QA de solo verificación):

1. `toggleIntermediaryActive` no escribe evento de auditoría (usuarios y clientes sí auditan activate/deactivate) — 5.13 no lo exige, pero conviene alinearlo por consistencia.
2. Decidir si la lista de clientes del Overview debe reflejar el mismo alcance (`is_active = 1`) que las estadísticas de cartera (observación de 5.5).
3. Lotes de asignación con consulta por cliente (nota de rendimiento de 5.4).
