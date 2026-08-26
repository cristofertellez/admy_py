# QA — Historia 6.1: Administración de Proyectos

Historia: BACKLOG.md → Épica 6 / Historia 6.1 (Administración de Proyectos)

Fecha: 2026-08-23

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Consulta paginada + conteo total | `ProjectsService.list`: COUNT con los mismos parámetros del WHERE (`total`) y consulta de página con LIMIT/OFFSET; `page`/`pageSize` devueltos junto a los datos. |
| Ordenamiento | Columnas permitidas (`created_at`, `updated_at`, `name`, `status`, `priority`, `estimated_end_date`) con dirección ASC/DESC validada en servidor. |
| Búsqueda | Server-side, case-insensitive sobre nombre, código, descripción y empresa del cliente (JOIN a `clients`). UI con input debounced (400 ms) sincronizado al parámetro `?search=` de la URL. |
| Filtros | Rápidos: estado del proyecto, prioridad y estado activo/archivado (`is_active`); avanzados disponibles en servicio: cliente, intermediario. Valores validados contra las opciones oficiales antes de consultar. |
| Consulta optimizada | Dos consultas por página (COUNT + página), sin N+1; JOINs a `clients`/`users`; índices existentes en `client_id`, `intermediary_id` y `status`. |
| DataTable | Reutiliza el DataTable compartido (TanStack Table) con paginación manual (`totalCount`, `pageIndex`), estado de filtros en URL y filas seleccionables con `getRowId` estable. |
| Acciones masivas | Selección múltiple → "Archive selected" / "Restore selected" según composición de la selección; confirmación previa; acción `bulkToggleProjectsActive` con auditoría `archived_project` / `restored_project`. |
| Columnas configurables | Toggle "Columns" del toolbar del DataTable; columnas Selection y Actions no ocultables (`enableHiding: false`). |
| Permisos | Página protegida con `requirePermission("projects.read")`, visibilidad de datos con `projectScope` en el servicio y controles gated por `projects.create` / `projects.update` en la UI. |

## 2. Arquitectura

```
features/projects/service        consultas, búsqueda, conteo total y scope de datos
actions/projects.ts              bulkToggleProjectsActive: guard + auditoría + respuesta tipada
components/tables/data-table     extensión getRowId para selección estable por id
app/dashboard/projects           Server Component (página) + Client Component (tabla)
```

La acción masiva devuelve `{ success } | { error }` en lugar de lanzar; el feedback llega como texto amigable con `aria-live` sin exponer stack traces.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16, Turbopack) compilando y generando rutas | PASS |

## 4. Checklist manual (rol Developer)

### Escenario A — Búsqueda y filtros

- [ ] Buscar por nombre parcial → resultados filtrados; URL contiene `?search=...`; recargar mantiene el filtro.
- [ ] Buscar por código de proyecto y por empresa del cliente → coincidencias correctas.
- [ ] Filtrar por Status/Priority/State → combinaciones se acumulan (AND) y resetean la paginación.
- [ ] Sin resultados → empty state "No results found." visible.

### Escenario B — Paginación

- [ ] Con más proyectos que `pageSize` → paginador muestra total real; cambiar de página actualiza `?page=`.
- [ ] Aplicar un filtro mientras se está en página > 1 → vuelve a la primera página.

### Escenario C — Acciones masivas

- [ ] Seleccionar varias filas activas → aparece "Archive selected (n)"; confirmar → mensaje "n projects archived.", filas desaparecen con filtro Active y auditoría registra `archived_project` por cada proyecto.
- [ ] Seleccionar filas archivadas (filtro State = Archived) → "Restore selected (n)" funciona y audita `restored_project`.
- [ ] Cancelar el confirm → sin cambios ni llamadas al servidor.

### Escenario D — Permisos

- [ ] Usuario sin `projects.read` → redirección a `/unauthorized`.
- [ ] Usuario sin `projects.update` → sin checkboxes ni columna Actions ni botones masivos.
- [ ] Cliente/Intermediario solo ve proyectos dentro de su `projectScope` (intentos de acceso directo incluidos).
- [ ] Usuario con `projects.create` pero sin `clients.read` → modal de creación sin selector de clientes.

### Escenario E — Responsive

- [ ] Mobile (< 640 px): filtros apilados en una columna, tabla con scroll horizontal, acciones accesibles.
- [ ] Tablet/Desktop: filtros en grilla de 2–3 columnas alineada con el botón New Project.

## 5. Notas

1. La selección usa `getRowId` (id real del proyecto) para que la selección sobreviva refetches y cambios de página; el botón masivo opera solo sobre filas presentes en la página actual, consistente con el modelo client-side de TanStack Table.
2. La auditoría de acciones masivas escribe un evento por proyecto (trazabilidad individual en timelines de cliente/proyecto).
3. El modal de creación reutiliza `useQueuedFormAction` (cola offline solo para `project.update`, igual que antes de esta historia); la creación requiere conexión.
4. QA manual pendiente de ejecución; la verificación automatizada cubre compilación, tipado y lint.
