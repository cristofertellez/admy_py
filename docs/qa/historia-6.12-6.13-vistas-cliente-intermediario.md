# QA — Historias 6.12 + 6.13: Vista del Cliente y del Intermediario

Historias: BACKLOG.md → Épica 6 / Historia 6.12 (Vista del Cliente) e Historia 6.13 (Vista del Intermediario)

Fecha: 2026-08-25

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Información general / Estado / Progreso | Cabecera del proyecto + KPIs + widgets "Current Status", "Progress" y "Effort" (Historia 6.8), visibles para Client e Intermediary. |
| Próximas entregas | Widget "Upcoming Deliveries" con los próximos hitos del proyecto. |
| Timeline | Pestañas Timeline (cronograma de hitos) y Activity (eventos del proyecto). |
| Archivos compartidos | Pestaña Documents con `attachmentScope`: cada rol solo ve/descarga lo autorizado; descarga con permiso `files.download`. |
| Comentarios autorizados | Pestaña Comments con `projectScope` en el servicio; crear/responder según `comments.create`. |
| Tareas / Indicadores | Pestañas Tasks (solo lectura para estos roles) e Indicators (PRD: cliente e intermediario consultan progreso/métricas). |
| El cliente nunca modifica información estructural | Sin `projects.update`/`tasks.create`/`tasks.update`, todos los server actions estructurales (`updateProject`, `assignProjectMembers`, `createMilestone`, etc.) redirigen a `/unauthorized`; la UI oculta botones vía RBAC y las pestañas Kanban (gestión) no se renderizan para Client ni Intermediary (`visibleTabsForRole`). |
| Vista del intermediario | Mismo set de pestañas de monitoreo; puede subir archivos si tiene `files.upload` y exportar reportes con `reports.export`. Solo ve proyectos de sus clientes asignados vía `assertProjectVisible` / `projectScope`. |

Archivo clave: `app/dashboard/projects/[id]/project-tabs.tsx` → `visibleTabsForRole(role)` (Developer: todas; Client/Intermediary: overview, indicators, tasks, milestones, timeline, documents, comments, activity).

## 2. Autorización en capas

1. Middleware/auth: sesión obligatoria.
2. Capa de datos: toda consulta pasa por `projectScope` / `assertProjectVisible` / `attachmentScope` — un Client solo accede a proyectos de su cliente y un Intermediary a los de sus clientes asignados.
3. Acciones: `requirePermission` por acción; sin permisos estructurales no hay mutación posible aunque se falsifique la UI.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16) compilando rutas | PASS |

## 4. Checklist manual (tres sesiones)

### Escenario A — Rol Client

- [ ] Ve Overview, Indicators, Tasks, Milestones, Timeline, Documents, Comments y Activity; NO ve Kanban ni controles de creación/edición.
- [ ] "Upcoming Deliveries" muestra los hitos pendientes del proyecto.
- [ ] Intento directo de `updateProject`/`assignProjectMembers` sin permiso → `/unauthorized`.
- [ ] Proyectos de otros clientes → `/unauthorized` (scope de datos).

### Escenario B — Rol Intermediary

- [ ] Mismo set de pestañas que el cliente; puede comentar y descargar archivos.
- [ ] Si tiene `files.upload`, puede subir documentos al proyecto desde Documents.
- [ ] Proyectos fuera de su cartera → `/unauthorized`.

### Escenario C — Rol Developer

- [ ] Conserva las nueve pestañas incluida Kanban con drag & drop operativo.
