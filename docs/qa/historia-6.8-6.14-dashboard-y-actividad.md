# QA — Historias 6.8 + 6.14: Dashboard del Proyecto y Actividad del Proyecto

Historias: BACKLOG.md → Épica 6 / Historia 6.8 (Dashboard del Proyecto) e Historia 6.14 (Actividad del Proyecto)

Fecha: 2026-08-25

---

## 1. Alcance implementado — 6.8

| Widget | Implementación |
| --- | --- |
| Estado actual | Tarjeta "Current Status" (estado, prioridad, fechas reales inicio/fin). |
| Progreso | Tarjeta "Progress" con anillo (`ProgressRing`) del % real y progreso esperado según cronograma; etiqueta "On/ahead of plan" o "Behind plan". |
| Horas | Tarjeta "Effort": horas estimadas, trabajadas y restantes. |
| Próximos hitos | Tarjeta "Upcoming Deliveries" con los próximos hitos no completados ordenados por fecha; vencidos en rojo. También cubre las "Próximas entregas" de la vista del cliente (6.12). |
| Actividad reciente | Ya existente ([x] en backlog): pestaña Activity y auditoría de accesos. |
| Últimos comentarios | Tarjeta "Latest Comments" (3 más recientes con autor y fecha). |
| Últimos archivos | Tarjeta "Latest Files" (3 más recientes). |
| Riesgos | Tarjeta "Health & Risks": semáforo de salud y nivel de riesgo desde `ProjectIndicatorsService` (PRD §72), listando los factores disparados. |
| Indicadores | Enlace "View indicators" hacia la pestaña Indicators (Historia 6.9/6.15). |

Componente: `app/dashboard/projects/[id]/project-dashboard.tsx` (Server Component, datos ya consultados por la página; sin requests extra).

## 2. Alcance implementado — 6.14

| Requisito | Implementación |
| --- | --- |
| Creación / Edición / Cambio de estado | Eventos existentes `created_project`, `updated_project` (diff campo a campo), `changed_project_status`. |
| Asignaciones | Nuevos `assigned_project_member` / `removed_project_member` (6.7) y diff de intermediario en `updated_project`; `updated_project_tags` (6.10) incluido en la categoría proyecto. |
| Comentarios | `created_comment`, `replied_comment`, `updated_comment`, `deleted_comment` sobre comentarios del proyecto (scope vía `project_comments`). |
| Archivos | `uploaded_file` / `deleted_file` con `entity = 'Project'`. Los accesos (`viewed_project`, `downloaded_file`) se excluyen del timeline. |
| Timeline | Pestaña Activity reutiliza `ActivityTimeline` (agrupado por día, paginado). |
| Filtros | Selector "Event type" mapeado a `PROJECT_HISTORY_ACTIONS` (project/files/comments) en `ProjectsService.getHistory`. |
| Búsqueda | Búsqueda debounced server-side por acción, usuario y valores old/new JSON; estado en URL (`q`, `category`, `page`) compartible. |

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16) compilando rutas | PASS |

## 4. Checklist manual (rol Developer)

### Escenario A — Widgets

- [ ] `/dashboard/projects/[id]` muestra las tres filas de widgets bajo los KPIs, con datos reales y estados vacíos amigables ("No upcoming milestones.", etc.).
- [ ] "View indicators" navega a la pestaña Indicators.
- [ ] Responsive: 4 columnas en desktop, apilado en móvil.

### Escenario B — Actividad

- [ ] Pestaña Activity lista eventos del proyecto, sus comentarios y archivos, agrupados por día.
- [ ] Filtrar por "Files" solo muestra uploaded/deleted_file; por "Comments" solo comentarios.
- [ ] Buscar por el nombre de un actor o un filename filtra correctamente; limpiar la búsqueda restaura el listado.
- [ ] Paginación Previous/Next conserva los filtros activos (estado en URL).
