# QA — Historia 5.14: Restricciones del Rol (Intermediary)

Historia: BACKLOG.md → Épica 5 / Historia 5.14 (Restricciones del Rol)

Fecha: 2026-08-23

---

## 1. Alcance implementado

Verificación de que el rol **Intermediary** NO puede realizar ninguna de las acciones restringidas, con defensa en profundidad en tres capas:

| Capa | Mecanismo |
| --- | --- |
| RBAC (permisos) | `PERMISSION_HIERARCHY` en `lib/auth.ts`: Intermediary solo tiene `projects.read`, `clients.read`, `tasks.read`, `comments.create`, `comments.read`, `files.download`, `reports.view`, `reports.export`. Todos los guards usan `requirePermission` / `hasPermission`. |
| Autorización de datos | `lib/auth-scope.ts`: `projectScope`, `clientScope`, `attachmentScope`, `assertProjectVisible`, `assertClientVisible`, `assertTaskVisible`, `assertMilestoneVisible`; denegaciones auditadas (`access_denied` en `activity_logs`). |
| Rutas / UI | `proxy.ts` + `lib/routes.ts` bloquean rutas administrativas por rol; páginas administrativas repiten el guard server-side; las tablas ocultan acciones sin permiso (props `canCreate`/`canUpdate`/… calculadas con `hasPermission` desde Server Components). |

## 2. Matriz de restricciones

| # | Restricción | Enforcement server-side | Ocultamiento UI |
| --- | --- | --- | --- |
| 1 | Crear usuarios | `createUser` exige `users.create` (`actions/users.ts`); `/dashboard/users` exige `users.read`; ruta en `ADMIN_ONLY_ROUTES` | Sidebar filtra con `canAccessRoute` |
| 2 | Eliminar clientes | No existe acción de borrado físico; archivar/restaurar/editar exigen `clients.update` (`actions/clients.ts`) que el rol no tiene; `assertClientVisible` en capa de datos | `ClientsTable` recibe `canUpdate=false` → sin Edit/Archive/Restore; `canCreate=false` → sin "Add Client" (`app/dashboard/clients/page.tsx`) |
| 3 | Modificar permisos | `updateRolePermissions` exige `roles.update`; `deleteRole` exige `roles.delete` (`actions/roles.ts`); solo Developer tiene `roles.*` | `/dashboard/roles` inaccesible (`users.read` + ruta admin) |
| 4 | Cambiar roles | `updateUser` exige `users.update`; auditoría `changed_role` (`actions/users.ts`) | `/dashboard/users` inaccesible para el rol |
| 5 | Ver proyectos no asignados | `ProjectsService.list/getById` aplican `projectScope`/`assertProjectVisible` (solo proyectos de clientes con `intermediary_id = usuario`); ídem tasks, milestones, comments, checklists, adjuntos, búsqueda global y dashboards | Las listas ya llegan filtradas desde el servicio |
| 6 | Acceder a información interna del Developer | `/dashboard/users`, `/dashboard/roles`, `/dashboard/admin`, `/dashboard/activity` exigen `users.read`; `/dashboard/settings` exige `settings.read`; middleware redirige a `/unauthorized`; logs de actividad de entidades ajenas bloqueados por `assertEntityVisible` (`ReportsService.getActivityLogs`) | Ítems de navegación ocultos vía `canAccessRoute` |
| 7 | Modificar configuraciones globales | `updateSetting` exige `settings.update` (`actions/settings.ts`) | Página de settings inaccesible (`settings.read`) |

## 3. Cambios de esta historia

UI sin permisos ahora oculta las opciones prohibidas (antes se mostraban y fallaban al invocar la acción):

- `app/dashboard/clients/page.tsx` + `clients-table.tsx`: `canCreate` / `canUpdate`.
- `app/dashboard/projects/page.tsx` + `projects-table.tsx`: `canCreate` / `canUpdate`.
- `app/dashboard/tasks/page.tsx`, `app/dashboard/projects/[id]/tasks/page.tsx` + `tasks-table.tsx`: `canCreate` / `canUpdate`.
- `app/dashboard/files/page.tsx` + `files-table.tsx`: `canUpload` / `canDelete` (Download permanece visible).
- `app/dashboard/projects/[id]/page.tsx` + `project-tabs.tsx`: `canCreateTasks`, `canUpdateTasks` (New/Edit task, kanban drag, completar), `canManageMilestones` (`projects.update`).
- `app/dashboard/tasks/[id]/page.tsx` + `task-detail.tsx`: `canCreateTasks` / `canUpdateTasks` (completar tarea/subtarea, editar, subtareas, dependencias, checklist).

Los modales dependen de los botones gated, por lo que quedan inaccesibles; los server actions siguen siendo la barrera final.

## 4. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (producción, Turbopack) sin errores | PASS |

## 5. Checklist manual (tres sesiones: Developer / Intermediary / Client)

### Escenario A — Intermediary

- [ ] `/dashboard/users`, `/dashboard/roles`, `/dashboard/settings`, `/dashboard/activity`, `/dashboard/admin` por URL directa → redirect a `/unauthorized`.
- [ ] Sidebar no muestra los ítems anteriores ni "Add Client"/"New Project"/"New Task"/"Upload File".
- [ ] `/dashboard/clients`: lista solo clientes asignados; sin botones Edit/Archive/Restore/Add.
- [ ] `/dashboard/projects`: solo proyectos de sus clientes; sin New Project/Edit/Archive.
- [ ] URL directa a proyecto no asignado → `/unauthorized` + evento `access_denied` en `activity_logs`.
- [ ] Kanban sin arrastre operativo; detalle de tarea sin completar/editar/subtareas/dependencias/checklist.
- [ ] Archivos: puede descargar; sin Upload/Delete.
- [ ] Forzar `updateRolePermissions` / `createUser` / `updateSetting` desde consola → redirect a `/unauthorized` (guard) sin mutación.

### Escenario B — Developer

- [ ] Ve y usa todos los botones (crear/editar/archivar en clientes, proyectos, tareas, archivos, hitos).
- [ ] Puede gestionar usuarios, roles, permisos y settings.

### Escenario C — Client

- [ ] Solo lectura de sus proyectos/tareas + comentarios; sin botones de gestión.

### Escenario D — Auditoría

- [ ] Cada intento indebido sobre entidades genera `activity_logs.action = 'access_denied'` con entidad, entity_id y rol.

## 6. Notas

1. El gating de UI usa props booleanas calculadas en Server Components con `hasPermission` (mismo patrón ya usado en `clients/[id]` e `intermediaries/[id]`); no introduce estado global.
2. La jerarquía de permisos vive en `lib/auth.ts`; si se migra a permisos 100% BD (Historia 3.7), `hasPermission` es el único punto a cambiar.
3. Fuera de alcance: menciones en comentarios (4.9) y descarga de archivos/consulta de proyectos en auditoría 5.13 (quedan como pendientes de su historia).
