# QA — Historias 3.1, 3.6, 3.10 y 3.12: Usuarios, Roles y Administración

Historias: BACKLOG.md → Épica 3 (Administración de Usuarios, Asignación de Roles, Dashboard Administrativo, Auditoría Administrativa)

Fecha: 2026-10-04

Sesión de QA independiente (solo verificación, sin cambios de código).

---

## 1. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm run lint` (ESLint) | PASS |
| `npm run build` (Next.js 16) | PASS |
| Consulta de solo lectura a la BD (roles, conteos de usuarios, eventos de auditoría) | PASS |

## 2. Historia 3.1 — Administración de Usuarios

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Verificar paginación | PASS | Server-side real: `UsersService.list` con `total` (COUNT con los mismos filtros) + `LIMIT/OFFSET`, estado en URL (`page`), `manualPagination` en el DataTable compartido y paginador con ventanas de 7 páginas (`data-table-pagination.tsx`). Nota: la BD actual tiene 6 usuarios (una sola página); la página 2 no es ejercitable con datos reales, verificación a nivel de implementación. |
| Verificar búsqueda | PASS | Debounce 400 ms (`use-debounce`) → estado en URL (`search`) → `LOWER(first_name/last_name/email) LIKE ?` server-side. `manualFiltering` activo, sin filtrado cliente duplicado. Placeholder "Search by name or email..." coherente con los campos buscados. |
| Verificar filtros | **FAIL (filtro por rol)** | Filtro de estado (active/inactive) PASS. Filtro por rol roto: la UI envía el `role_id` (UUID) en el parámetro `role` (`users-table.tsx`, `value={r.id}`), pero `UsersService.list` resuelve el filtro con `SELECT id FROM roles WHERE name = ?` usando ese UUID (`users.service.ts:68`). Los roles tienen IDs UUID (migraciones 00001/00007), por lo que la consulta no encuentra coincidencia y el filtro se ignora silenciosamente: al elegir un rol se muestran todos los usuarios. Probe en BD: `WHERE name = <uuid>` → 0 filas; `WHERE id = <uuid>` → 1 fila. |

### Hallazgo 3.1-A (bug, medio): filtro por rol no filtra

- Reproducción: `/dashboard/users` → seleccionar cualquier rol en el selector "Role" → la tabla muestra todos los usuarios en lugar de solo los del rol.
- Causa: desalineación UI (envía `role_id`) vs servicio (resuelve por `name`).
- Corrección sugerida (fuera de alcance de esta sesión): resolver en el servicio por `WHERE id = ?` (o alternativamente enviar el nombre del rol desde la UI, pero id es más estable).
- Observación menor (no bloqueante): el ordenamiento por columnas es cliente-side dentro de la página actual (20 filas), no global; el servicio sí soporta `sortBy/sortOrder` pero la página no los expone en la URL.

## 3. Historia 3.6 — Asignación de Roles

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Cambio correcto | PASS | `updateUser` valida con Zod (`updateUserSchema`, `role_id` UUID) y `UsersService.update` persiste `role_id`; auditoría `changed_role` con old/new (nombre del rol). |
| Cambio reflejado inmediatamente | PASS | `revalidatePath("/dashboard/users")` + `router.refresh()` al cerrar el modal; el modal exige confirmación explícita ("Confirm Role Change") mostrando rol actual → rol nuevo antes de aplicar. |
| Actualización de permisos | PASS | `getUser` (`lib/auth.ts`) consulta el rol y sus datos en la BD en cada request (sin caché de sesión), por lo que el usuario afectado obtiene los permisos del rol nuevo en su siguiente request, sin necesidad de re-login. RBAC resuelto por `PERMISSION_HIERARCHY` en cada llamada a `requirePermission`/`hasPermission`. |

## 4. Historia 3.10 — Dashboard Administrativo

| Requisito QA | Resultado | Evidencia |
| --- | --- | --- |
| Actualización automática | PASS (ya verificado) | `AutoRefresh` cada 60 s respetando `document.visibilityState`. |
| Responsive | PASS (ya verificado) | Grids `sm:grid-cols-2 lg:grid-cols-3`, fecha de último acceso oculta en móvil (`hidden md:block`). |
| Información correcta | **WARN (hallazgo 3.10-A)** | Widgets presentes: usuarios activos/inactivos/totales, roles, logins hoy/semana, distribución por rol, últimos accesos, estadísticas de plataforma. Los contadores de login se alimentan de `activity_logs.action='logged_in'` (auditoría real). Hallazgo: la tarjeta "Inactive Users" siempre muestra 0 aunque existan usuarios inactivos (ver abajo). |

### Hallazgo 3.10-A (inconsistencia, medio): "Inactive Users" siempre en 0

- `toggleActive(id, false)` desactiva al usuario **y además marca `deleted_at`** (`users.service.ts:272-279`).
- El dashboard solo cuenta usuarios con `deleted_at IS NULL` (`dashboard.service.ts:974-975`) y calcula `inactiveUsers = totalUsers - activeUsers`, por lo que los usuarios desactivados quedan excluidos de ambas cantidades → "Inactive Users" = 0.
- Mientras tanto, `/dashboard/users` (3.1) sí lista a esos usuarios con badge "Inactive" (su consulta no filtra `deleted_at`), y su filtro de estado "inactive" los encuentra.
- Resultado: dos superficies reportan estados distintos para los mismos usuarios. Con los datos actuales (6 usuarios, todos activos) no es observable, pero la aritmética garantiza el fallo al desactivar el primer usuario.
- Corrección sugerida (fuera de alcance): desacoplar `deleted_at` (baja lógica) de `is_active` (estado) en `toggleActive`, o alinear las consultas del dashboard con la semántica de la lista de usuarios.
- Observación menor: el widget "Actividad reciente" de la historia se representa con "Recent Sign-ins" + contadores de logins; el feed completo de actividad vive en `/dashboard/activity`.

## 5. Historia 3.12 — Auditoría Administrativa

Cobertura de registro verificada en código (los 8 eventos de la historia):

| Evento | Origen | Estado |
| --- | --- | --- |
| Crear usuario (`created_user`) | `actions/users.ts` → `createUser` | PASS |
| Editar usuario (`updated_user`, solo si cambió nombre) | `actions/users.ts` → `updateUser` | PASS |
| Cambiar rol (`changed_role` con old/new) | `actions/users.ts` → `updateUser` | PASS |
| Cambiar permisos (`updated_permissions` con listas old/new ordenadas) | `actions/roles.ts` → `updateRolePermissions` | PASS |
| Activar usuario (`activated_user`) | `actions/users.ts` → `toggleUserActive` | PASS |
| Desactivar usuario (`deactivated_user`) | `actions/users.ts` → `toggleUserActive` | PASS |
| Cambiar contraseña (`changed_password`) | `actions/profile.ts` | PASS |
| Actualizar perfil (`updated_profile`, `updated_avatar`) | `actions/profile.ts` | PASS |

- Escritura centralizada vía `ActivityService.log` (INSERT en `activity_logs` con `user_id`, `entity`, `entity_id`, `old_value`/`new_value`); los fallos de auditoría no bloquean la operación principal.
- Guards RBAC en todas las acciones (`users.create/update`, `roles.update/delete`).
- Estado de la BD: solo existen eventos `logged_in` (4) en `activity_logs`; los eventos administrativos no se han ejercitado aún con datos reales en esta BD, pero la cobertura de registro está completa y el patrón de escritura es el mismo ya probado por `logged_in`.
- Nota menor (no bloqueante): `updateRolePermissions` y `deleteRole` invocan `requirePermission` dos veces (validación inicial y para obtener el actor); es redundante pero inofensivo.

## 6. Resumen de la sesión

| Historia | QA pendiente | Resultado |
| --- | --- | --- |
| 3.1 | Paginación, filtros, búsqueda | 2/3 PASS — **filtro por rol roto (3.1-A)** |
| 3.6 | Cambio correcto, reflejo inmediato, permisos | 3/3 PASS |
| 3.10 | Información correcta | **Hallazgo 3.10-A** ("Inactive Users" siempre 0); auto-actualización y responsive ya verificados |
| 3.12 | Cobertura de eventos de auditoría | PASS (8/8 eventos implementados) |

Acciones sugeridas para el equipo (no ejecutadas en esta sesión por ser QA de solo verificación):

1. Corregir el filtro por rol de `/dashboard/users` (3.1-A) y re-verificar "Verificar filtros".
2. Resolver la inconsistencia `is_active`/`deleted_at` (3.10-A) y re-verificar "Información correcta".
