# QA — Historia 2.10: Control de Acceso a Datos

Historia: BACKLOG.md → Épica 2 / Historia 2.10 (Control de Acceso a Datos)

Fecha: 2026-08-22

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Control de acceso en consultas a tablas sensibles | `lib/auth-scope.ts`: cláusulas de visibilidad reutilizables (`projectScope`, `clientScope`, `attachmentScope`) aplicadas dentro de los servicios, no en la UI. |
| Reglas por rol | Developer: sin filtro (acceso total). Intermediary: solo proyectos/clientes de sus clientes asignados (`clients.intermediary_id = usuario`). Client: solo datos vinculados al cliente cuyo email coincide con su sesión. Cualquier otro rol: sin acceso (`1 = 0`). |
| Validar intentos de acceso indebido | Cada denegación registra un log en `activity_logs` (`action = access_denied`, entidad, entity_id y rol del actor) mediante `ActivityService`, y lanza `AccessDeniedError`. |
| Extensión del alcance previo | La nota del backlog indicaba que `lib/auth-scope.ts` cubría parcialmente proyectos/tareas. Se extendió a clientes, milestones y adjuntos (por tipo de entidad), y se auditó el resto de servicios/acciones. |

## 2. Arquitectura

```
lib/auth-scope.ts            scopes SQL + asserts + auditoría de denegaciones
features/*/service           aplican los scopes en cada consulta (defensa en la capa de datos)
actions/*.ts                 guards requirePermission (RBAC) antes de cualquier mutación
services/activity.service    persistencia de intentos denegados (access_denied)
```

Superficies protegidas en esta historia:

| Superficie | Protección |
| --- | --- |
| Búsqueda global (`actions/search.ts`) | Proyectos/tareas/milestones filtrados por proyectos visibles; clientes por clientes visibles. |
| Clients (`list`/`getById`) | Scope por rol + `assertClientVisible`. |
| Projects (`list`/`getById`) | Scope por rol + `assertProjectVisible`. |
| Milestones (`listByProject`/`getById`) | `assertProjectVisible` vía proyecto padre; excluye soft-deleted. |
| Files/attachments (`list`/`getById`/`delete`) | Scope polimórfico project/task/milestone/client + whitelist de tipos al subir. |
| Dashboard y Reports | `DashboardService.getStats(user)` calcula métricas acotadas al rol; contadores globales (p. ej. intermediarios activos) solo Developer. |
| Reportes de proyecto / logs de actividad | Visibilidad del recurso requerida; logs solo de entidades visibles. |
| Notificaciones | `markAsRead` exige `receiver_id = usuario` (antes cualquiera podía marcar ajenas). |
| Mutaciones administrativas | `requirePermission` en clients, projects, tasks, checklists, time-entries, users, roles, intermediaries y files (subir/borrar). Jerarquía ampliada con `roles.*` y `time-entries.*` para Developer. |

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| ESLint adicional sobre `features/*` y `actions/*` modificados | PASS |

## 4. Checklist manual (build producción, tres sesiones: Developer / Intermediary / Client)

### Escenario A — Cliente

- [ ] `/dashboard/projects`: solo proyectos de su cliente.
- [ ] `/dashboard/tasks`, comentarios, checklists, archivos: solo los de proyectos visibles.
- [ ] `/dashboard/search`: sin resultados de otros clientes (probar nombre de proyecto ajeno).
- [ ] Acceso directo por URL a proyecto/task/client ajeno → redirección a `/unauthorized`.
- [ ] `markAsRead` de una notificación ajena no modifica datos (UPDATE filtrado por receiver_id).

### Escenario B — Intermediary

- [ ] `/dashboard/clients`: únicamente sus clientes asignados.
- [ ] `/dashboard/projects` y búsqueda: solo proyectos de sus clientes.
- [ ] Intento de crear/editar cliente o proyecto (vía acción) → bloqueado por `requirePermission`.
- [ ] Archivos: solo adjuntos de entidades de sus clientes.

### Escenario C — Developer

- [ ] Ve todos los clientes, proyectos, tareas, archivos y métricas globales.
- [ ] Puede crear/editar/archivar en todos los módulos.

### Escenario D — Auditoría de denegaciones

- [ ] Provocar un acceso indebido (URL directa o acción forzada).
- [ ] Verificar fila en `activity_logs` con `action='access_denied'`, entidad, entity_id, user_id y rol.
- [ ] Verificar que el mensaje mostrado es genérico ("You do not have access to …") sin detalles internos.

## 5. Notas

1. El control vive en la capa de datos: aunque una página olvide el guard de UI, las consultas ya vienen filtradas (defensa en profundidad).
2. Los asserts lanzan `AccessDeniedError`; las páginas de detalle lo convierten en redirect a `/unauthorized` para no exponer errores crudos.
3. Fuera de alcance para esta historia: tests automatizados de integración por rol; el checklist manual cubre la validación exigida por la historia.
