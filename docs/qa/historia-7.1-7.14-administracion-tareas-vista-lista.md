# QA — Historias 7.1 y 7.14: Administración de Tareas / Vista Lista

Historias: BACKLOG.md → Épica 7 / Historia 7.1 (Administración de Tareas) e Historia 7.14 (Vista Lista)

Fecha: 2026-08-26

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Búsqueda (backend) | `TasksService.list`: server-side, case-insensitive sobre `title` y `description` (`LOWER(...) LIKE`). |
| Conteo total (backend) | `COUNT(*)` con el mismo WHERE de la página (`total`) devuelto junto a `page`/`pageSize`. |
| Ordenamiento | Whitelist exportada `TASK_SORTABLE_COLUMNS` (position, title, status, priority, created_at, updated_at, estimated_start, estimated_end); dirección ASC/DESC validada en servidor; estado inicial sembrado desde la URL vía `initialSorting` del DataTable compartido. |
| Búsqueda rápida (frontend) | Input del toolbar con debounce 400 ms sincronizado a `?search=`; filtrado manual en servidor (`manualFiltering`), resetea la paginación. |
| Filtros | Estado, Prioridad, Responsable y Proyecto como selects sincronizados a la URL; valores validados contra opciones oficiales/opciones disponibles antes de consultar. En contexto de proyecto fijo (`projectId`) el filtro/columna de proyecto se oculta. |
| Acciones masivas | Selección múltiple → barra "n selected" + cambio de estado por lote; acción `bulkUpdateTaskStatus` con Zod (`bulkUpdateTaskStatusSchema`: UUIDs, máx. 100, estado válido), guard `tasks.update`, transición de estado validada por tarea (`assertTaskStatusTransition`), auditoría `changed_task_status` por tarea y parada amigable del lote si una tarea falla. |
| Columnas configurables | Toggle "Columns" del toolbar del DataTable; columnas Selection y Actions no ocultables (`enableHiding: false`); columnas Task, Project (global), Assignee, Status, Priority, Progress, Est. Hours y Due Date ocultables. |
| Vista Lista — Tabla | `/dashboard/tasks` como vista de lista completa: paginación manual real (`totalCount`, `pageIndex`), búsqueda, filtros y ordenamiento en URL (compartible y restaurable por la PWA). |
| Acciones rápidas | Por fila: View (enlace al detalle), Edit (modal), Complete/Reopen (`toggleTaskCompletion` existente) y Archive (`toggleTaskActive` con confirmación, gated por `tasks.delete`). |
| Permisos | Páginas protegidas con `requirePermission("tasks.read")`; datos restringidos por `projectScope` en el servicio; controles gated por `tasks.create` / `tasks.update` / `tasks.delete`. Client e Intermediary (solo lectura de tareas) no ven selección ni acciones. |

## 2. Arquitectura

```
features/tasks/tasks.service.ts   búsqueda ampliada (title+description), TASK_SORTABLE_COLUMNS, scope por rol
actions/tasks.ts                  bulkUpdateTaskStatus: guard + Zod + transiciones + auditoría por tarea
schemas/task.ts                   bulkUpdateTaskStatusSchema (validación compartida cliente/servidor)
components/tables/data-table.tsx  extensión initialSorting (orden sembrado desde URL)
app/dashboard/tasks               Server Component (página, parseo de searchParams) + Client Component (tabla)
app/dashboard/projects/[id]/tasks reutiliza TasksTable con projectId fijo
constants/index.ts                TASK_STATUS_OPTIONS / TASK_PRIORITY_OPTIONS para filtros y formularios
```

La acción masiva devuelve `{ success } | { error }`; el feedback llega como texto amigable con `aria-live="polite"` sin exponer stack traces.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16, Turbopack): compilación, type check y generación de rutas `/dashboard/tasks` y `/dashboard/projects/[id]/tasks` | PASS |

## 4. Checklist manual (rol Developer)

### Escenario A — Búsqueda rápida y conteo total

- [ ] Buscar texto parcial del título → resultados filtrados server-side; URL contiene `?search=...`; recargar mantiene el filtro.
- [ ] Buscar una palabra que solo existe en la descripción → la tarea aparece.
- [ ] El paginador muestra el total real ("of N"); cambiar `?search=` vuelve a la página 1.

### Escenario B — Filtros y ordenamiento

- [ ] Filtrar por Status/Priority/Assignee/Project → combinaciones acumulativas (AND), cada cambio escribe su parámetro en la URL.
- [ ] Click en encabezados Task/Status/Priority/Due Date → alterna asc/desc escribiendo `?sort=&order=`; recargar conserva el orden.
- [ ] Encabezados no ordenables (Project, Assignee, Progress, Est. Hours) no muestran flecha ni cambian el orden.

### Escenario C — Acciones masivas

- [ ] Seleccionar varias tareas → barra "n selected"; elegir estado y Apply → confirmación previa; mensaje "n tasks updated."; auditoría registra `changed_task_status` por cada tarea con old/new status.
- [ ] Intentar una transición inválida desde otra vía → el lote se detiene con mensaje amigable y las ya procesadas permanecen consistentes.
- [ ] Cancelar el confirm → sin cambios ni llamadas al servidor.

### Escenario D — Acciones rápidas y permisos

- [ ] Complete/Reopen por fila funciona y audita; Archive pide confirmación y desaparece la fila (listado filtra `is_active = 1`).
- [ ] Con rol Intermediary o Client: sin columna de selección, sin acciones y sin barra masiva; acceso directo a `/dashboard/tasks` funciona (tasks.read) y las mutaciones devuelven redirect a `/unauthorized`.
- [ ] Responsive: selects apilados en móvil, tabla con scroll horizontal, targets táctiles ≥ 40px.
