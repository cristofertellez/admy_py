# QA — Historia 4.7: Historial del Cliente

Historia: BACKLOG.md → Épica 4 / Historia 4.7 (Historial del Cliente)

Fecha: 2026-08-22

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Registrar creación | `created_client` en `actions/clients.ts` (existente, Historia 4.2). |
| Registrar edición | `updated_client` con diff `old_value`/`new_value` por campo modificado (existente). |
| Registrar cambio de estado | `archived_client` / `restored_client` en `toggleClientActive` (existente, Historia 4.4). |
| Registrar nuevos proyectos | `created_project` en `actions/projects.ts` (`entity='Project'`, con `client_id` en `new_value`); el historial del cliente lo resuelve vía JOIN con `projects.client_id`. |
| Registrar comentarios | `created_comment` en `actions/comments.ts` para comentarios de proyecto; comentarios del cliente (`created_client_comment`, `replied_client_comment`, etc.) vía Historia 4.9 con `entity='Client'`. |
| Registrar archivos | `uploaded_file` / `deleted_file` en `actions/files.ts`; entidad normalizada a mayúscula inicial (`toActivityEntity`) para que la consulta del historial los incluya. |
| Registrar asignaciones | `assigned_intermediary` / `removed_intermediary` (existente, Historia 4.6). |
| Timeline cronológico | Pestaña Timeline de `/dashboard/clients/[id]` reutilizando `ActivityTimeline` (agrupación por día Today/Yesterday/fecha), ahora con paginación real. |
| Filtros | Selector "Event type" (`history-filters.tsx`) mapeado a categorías de `CLIENT_HISTORY_ACTIONS`: Client management, Projects, Files, Comments, Intermediaries. |
| Búsqueda | Búsqueda debounced (400 ms) server-side sobre `action`, nombre del usuario y contenido JSON de `old_value`/`new_value`. |
| Orden correcto | `ORDER BY al.created_at DESC` en la consulta del servicio. |

## 2. Arquitectura

```
features/clients/clients.types.ts    CLIENT_HISTORY_ACTIONS (categoría → acciones) + tipos de filtros/resultado
features/clients/clients.service.ts  getClientHistory: agregación Client + proyectos + comentarios,
                                     búsqueda LIKE server-side, filtro por categoría, COUNT + LIMIT/OFFSET
app/dashboard/clients/[id]/page.tsx  estado del timeline en URL (tab/q/category/page) + fetch del historial
app/dashboard/clients/[id]/client-tabs.tsx      pestañas URL-driven + navegación con router.replace
app/dashboard/clients/[id]/history-filters.tsx  búsqueda debounced + selector de categoría (URL state)
services/activity.service            escritura en activity_logs (fire-and-forget)
```

El historial agrega en una sola consulta los eventos donde: (a) `entity='Client' AND entity_id=cliente`, o (b) el evento es de un proyecto del cliente, o (c) el evento es un comentario asociado a un proyecto del cliente o al cliente. La pestaña activa vive en la URL, por lo que una vista filtrada/paginada es compartible y sobrevive recargas.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16) compilando y generando rutas | PASS |

## 4. Checklist manual (rol Developer)

### Escenario A — Timeline cronológico

- [ ] Abrir `/dashboard/clients/[id]` → pestaña Timeline muestra eventos agrupados por día, más reciente primero.
- [ ] Verificar en BD que el orden coincide con `ORDER BY created_at DESC` de `activity_logs`.
- [ ] Más de 15 eventos → aparece paginación (Previous/Next) y "Page X of Y · N events".

### Escenario B — Eventos completos

- [ ] Crear/editar/archivar/restaurar el cliente → cada acción aparece en el timeline.
- [ ] Crear un proyecto para el cliente → `created_project` visible en el timeline del cliente.
- [ ] Subir y eliminar un documento del cliente → `uploaded_file` / `deleted_file` visibles.
- [ ] Comentar en un proyecto del cliente → `created_comment` visible; comentar en el cliente (4.9) → `created_client_comment` visible.
- [ ] Asignar/remover intermediario → eventos visibles.

### Escenario C — Filtros y búsqueda

- [ ] Seleccionar "Files" → solo `uploaded_file`/`deleted_file`; "Projects" → solo proyectos; etc.
- [ ] Buscar por nombre de usuario → filtra eventos del usuario (coincidencia parcial).
- [ ] Buscar texto presente en `new_value` (p. ej. nombre de archivo) → filtra correctamente.
- [ ] Limpiar búsqueda → se elimina `q` de la URL y vuelve el listado completo.
- [ ] Aplicar filtro y recargar → filtro y página se mantienen (estado en URL).
- [ ] Sin resultados → empty state "No activity found for the selected filters."

## 5. Notas

1. Los eventos antiguos de archivos registrados antes de la normalización usan `entity='client'` (minúscula) y no aparecerán retroactivamente en el historial; solo afecta datos históricos previos a este cambio.
2. Los comentarios de tarea no se incluyen en el historial del cliente (viven bajo milestones/tareas); quedan cubiertos por la auditoría general cuando exista.
3. La consulta usa LEFT JOINs por clave primaria, por lo que no produce duplicados ni requiere DISTINCT; los índices `idx_activity_logs_entity` y `idx_projects_client_id` soportan el acceso principal.
