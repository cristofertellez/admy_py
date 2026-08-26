# QA — Historia 6.7: Asignación de Responsables

Historia: BACKLOG.md → Épica 6 / Historia 6.7 (Asignación de Responsables)

Fecha: 2026-08-25

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Asignar Developers | `ProjectsService.assignMembers` valida que cada usuario sea Developer activo (`roles.name = 'Developer'`, `is_active = 1`, sin soft-delete) antes de insertar en `project_members`. |
| Asignar Intermediarios | Misma validación con `roles.name IN ('Developer', 'Intermediary')`; el cliente sigue asignado vía `projects.client_id` (ya implementado). |
| Selector múltiple | Modal con checkboxes agrupados por rol (Developers / Intermediaries) en `team-section.tsx`; envía `user_ids[]` al server action. |
| Gestión de miembros | Tarjeta "Team" en la pestaña Overview del proyecto: listado agrupado por rol, badge "Inactive" para miembros desactivados y botón Remove con confirmación previa. |
| Permisos | `assignProjectMembers` / `removeProjectMember` exigen `requirePermission("projects.update")` (solo Developer); el servicio revalida `assertProjectVisible`. La UI solo muestra la tarjeta con `projects.update`. |
| Duplicados | Constraint `UNIQUE(project_id, user_id)` en la migración + verificación previa en el servicio; los ya asignados se omiten sin fallar ("Those members are already assigned."). |

## 2. Arquitectura

```
turso/migrations/00006_project_members_sqlite.sql   tabla project_members (FK a projects/users, UNIQUE anti-duplicados, índices por proyecto y usuario)
features/projects/projects.service.ts               listMembers / listAvailableMembers / assignMembers / removeMember + assertMemberInputValid
schemas/project.ts                                  assignProjectMembersSchema (project_id UUID + user_ids array 1..50)
actions/projects.ts                                 assignProjectMembers / removeProjectMember (guard + auditoría + revalidatePath)
app/dashboard/projects/[id]/team-section.tsx        UI: selector múltiple, gestión y confirmaciones
```

Auditoría (Historia 6.14): eventos `assigned_project_member` (con nombres y roles) y `removed_project_member` (nombre del miembro) en `activity_logs`.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16) compilando rutas | PASS |
| Migración aplicada (`npm run db:migrate`) | PASS — tabla e índices verificados en Turso |

## 4. Checklist manual (rol Developer)

### Escenario A — Asignación múltiple

- [ ] Overview del proyecto → tarjeta Team → "Assign Members" abre el modal con Developers e Intermediaries activos disponibles.
- [ ] Seleccionar varios miembros → mensaje "N members assigned." y la lista se actualiza agrupada por rol.
- [ ] Fila en `activity_logs`: `action = 'assigned_project_member'`, `new_value.members` con los nombres.

### Escenario B — Duplicados

- [ ] Reasignar un miembro ya presente → "Those members are already assigned." sin filas nuevas.
- [ ] Intento directo a la BD violando UNIQUE → rechazado por el constraint.

### Escenario C — Remoción

- [ ] Remove sobre un miembro → confirmación previa; tras aceptar desaparece de la tarjeta y queda evento `removed_project_member`.

### Escenario D — Permisos

- [ ] Rol Client/Intermediary no ve la tarjeta Team ni el modal (sin `projects.update`).
- [ ] Invocar las acciones sin permiso → redirección a `/unauthorized`; sin cambios.

## 5. Notas

1. Los clientes no se registran en `project_members`: su acceso se resuelve por `projects.client_id` y el scope de datos existente.
2. Miembros desactivados permanecen visibles con badge "Inactive" para trazabilidad; solo usuarios activos pueden asignarse.
