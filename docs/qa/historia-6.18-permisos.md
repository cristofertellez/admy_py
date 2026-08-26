# QA — Historia 6.18: Permisos (Gestión de Proyectos)

Historia: BACKLOG.md → Épica 6 / Historia 6.18 (Permisos)

Fecha: 2026-08-25

---

## 1. Alcance implementado

Matriz de permisos del módulo de proyectos con defensa en profundidad en tres capas:

| Capa | Mecanismo |
| --- | --- |
| RBAC (permisos) | `PERMISSION_HIERARCHY` en `lib/auth.ts`: Developer y Super Administrator con comodines de todos los módulos; Administrator con `projects.*`, `clients.*`, `intermediaries.*`, `tasks.*`, `comments.*`, `files.*`, `reports.*`, `time-entries.*` (sin `users.*`/`roles.*`/`settings.*`, que quedan como configuración del sistema); Intermediary y Client con permisos de solo lectura/colaboración. Todos los guards usan `requirePermission` / `hasPermission`. |
| Autorización de datos | `lib/auth-scope.ts`: los roles de acceso pleno (`hasFullAccess` en `lib/roles.ts`: Developer, Administrator, Super Administrator) omiten el filtrado; Client e Intermediary pasan por `projectScope`, `clientScope`, `attachmentScope` y los asserts `assertProjectVisible` / `assertTaskVisible` / `assertMilestoneVisible` / `assertClientVisible`. Las denegaciones se auditan como `access_denied` en `activity_logs`; los roles desconocidos quedan denegados por defecto (`1 = 0`). |
| Rutas / UI | `proxy.ts` + `lib/routes.ts` (`ADMIN_ROLES`) permiten las rutas administrativas a Developer, Administrator y Super Administrator; las páginas repiten guards server-side; las tablas y pestañas ocultan acciones sin permiso (props `canCreate*`/`canUpdate*` calculadas con `hasPermission`; pestañas Kanban/gestión reservadas a `hasFullAccess`). |

## 2. Matriz de permisos por rol

| Rol | Alcance de proyectos | Crear / Editar / Archivar | Enforcement server-side |
| --- | --- | --- | --- |
| Developer | Todos | Sí | Comodín `projects.*` + bypass de scope en capa de datos |
| Administrator | Todos | Sí | `projects.*` + bypass de scope; sin gestión de usuarios/roles/settings |
| Super Administrator | Todos | Sí | Idéntico a Developer (acceso total) |
| Intermediary | Solo proyectos asignados (clientes de su cartera: `clients.intermediary_id = usuario`) | No (solo lectura + comentarios + subida/descarga de archivos + exportar reportes) | `projectScope` / `assertProjectVisible` filtran cada consulta; `projects.create/update/delete/archive` fuera de su jerarquía |
| Client | Solo sus proyectos (cliente vinculado por email) | No (lectura + comentarios + descarga de archivos) | Ídem; sin `files.upload`, sin `reports.export` |

## 3. Cambios de esta historia

- `lib/roles.ts` (nuevo): `FULL_ACCESS_ROLES` y `hasFullAccess(role)` como fuente única compartida (segura para cliente y servidor).
- `lib/auth.ts`: jerarquía ampliada con `Administrator` y `"Super Administrator"`.
- `lib/auth-scope.ts`: el bypass de visibilidad ya no es exclusivo de Developer (`isFullAccessUser` usa `hasFullAccess`); fallbacks `1 = 0` intactos.
- `app/dashboard/projects/[id]/project-tabs.tsx`: pestañas de gestión (Kanban) visibles para los tres roles de acceso pleno.
- Consistencia transversal con la misma semántica de "acceso pleno": moderación/borrado de comentarios (`features/comments/comments.service.ts`), reporte global (`actions/reports.ts`), estadísticas del dashboard (`features/dashboard/dashboard.service.ts`), widget de intermediarios en Reports (`app/dashboard/reports/page.tsx`) y borrado de registros de horas ajenos (`features/time-entries/service.ts`).
- `turso/migrations/00007_admin_roles_sqlite.sql` (nueva): siembra idempotente de los roles Administrator y Super Administrator (preparados en Historia 2.7 pero ausentes del esquema).

## 4. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (producción, Turbopack) sin errores | PASS |

## 5. Checklist manual (cinco sesiones: una por rol)

### Escenario A — Developer

- [ ] Ve todas las acciones (crear/editar/archivar/restaurar proyectos) y todos los proyectos.
- [ ] URL directa a cualquier proyecto → acceso normal.

### Escenario B — Administrator

- [ ] `/dashboard/projects`: lista completa; botones New/Edit/Archive operativos (`projects.*`).
- [ ] Sin Kanban oculto: pestaña Kanban visible y operativa.
- [ ] `/dashboard/users`, `/dashboard/roles`, `/dashboard/settings` por URL directa → redirect a `/unauthorized` (fuera de su jerarquía).
- [ ] Exportación de proyecto permitida (`reports.export`).

### Escenario C — Super Administrator

- [ ] Igual que Developer, incluidos usuarios, roles y settings (acceso total).

### Escenario D — Intermediary

- [ ] `/dashboard/projects`: solo proyectos de sus clientes asignados; URL directa a un proyecto ajeno → `/unauthorized` + evento `access_denied`.
- [ ] Sin New/Edit/Archive ni Kanban; puede comentar, subir/descargar archivos y exportar reportes.

### Escenario E — Client

- [ ] Solo sus proyectos; URL directa a proyecto ajeno → `/unauthorized` + `access_denied`.
- [ ] Solo lectura (Tasks/Milestones/Timeline/Documents/Comments/Activity), sin Kanban ni controles de gestión; puede comentar y descargar archivos.

### Escenario F — Auditoría

- [ ] Cada intento indebido sobre entidades genera `activity_logs.action = 'access_denied'` con entidad, entity_id y rol.

## 6. Notas

1. La distinción Administrator vs Super Administrator sigue la historia: "gestión completa" (módulos operativos) frente a "acceso total" (incluye configuración del sistema). Si el negocio decide lo contrario, solo cambia `PERMISSION_HIERARCHY`.
2. Los roles nuevos existen ahora en BD (migración 00007); crear usuarios de prueba con esos roles vía `/dashboard/users` o `scripts/create-user.mjs`.
3. El gating de UI usa props booleanas calculadas en Server Components con `hasPermission`/`hasFullAccess`; no introduce estado global.
