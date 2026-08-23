# QA — Historia 4.4: Archivar Cliente

Historia: BACKLOG.md → Épica 4 / Historia 4.4 (Archivar Cliente)

Fecha: 2026-08-22

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Cambio de estado | `ClientsService.archive` / `restore`: soft-delete (`is_active = 0`, `deleted_at`) y restauración (`is_active = 1`, `deleted_at = NULL`) con `updated_at`. |
| Validar proyectos activos | Regla de negocio en la capa de datos (`features/clients/clients.service.ts`): un cliente con proyectos activos no puede archivarse (`getActiveProjectsCount`: `deleted_at IS NULL AND is_active = 1 AND status NOT IN ('Completed', 'Cancelled', 'Archived')`, misma definición de "activo" que dashboard/reports). `archive()` lanza error controlado antes del UPDATE. |
| Registrar auditoría | `ActivityService.log` en `toggleClientActive`: `action = archived_client` / `restored_client`, `entity = Client`, `entity_id`, `old_value`/`new_value` con `is_active`. Fallos de auditoría no bloquean la operación. |
| Confirm Dialog | Confirmación nativa antes de archivar ("Archive client …? You can restore it later."); la restauración no la requiere. |
| Indicador visual | Badge Active/Archived en tabla y detalle; feedback inline de éxito/error sobre la tabla con `aria-live` para accesibilidad. |

## 2. Arquitectura

```
features/clients/service     regla de negocio (bloqueo por proyectos activos) + persistencia
actions/clients.ts           guard requirePermission("clients.update") + auditoría + respuesta tipada
services/activity.service    escritura en activity_logs
app/dashboard/clients        UI: confirmación, feedback de éxito/error y sincronía vía router.refresh()
```

La acción devuelve `{ success } | { error }` en lugar de lanzar: el mensaje de restricción llega como texto amigable a la UI sin exponer stack traces.

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16, Turbopack) compilando y generando rutas | PASS |

## 4. Checklist manual (rol Developer)

### Escenario A — Cliente archivado

- [ ] Archivar cliente sin proyectos → confirmación visible, mensaje "Client archived.", badge pasa a Archived.
- [ ] Fila en `activity_logs`: `action = 'archived_client'`, `entity = 'Client'`, `entity_id` correcto, `user_id` del actor, `old_value.is_active = true`, `new_value.is_active = false`.
- [ ] Registro en `clients`: `is_active = 0`, `deleted_at` con timestamp UTC.
- [ ] Cancelar el confirm → sin cambios ni llamadas al servidor.

### Escenario B — Cliente restaurado

- [ ] Restaurar cliente archivado → mensaje "Client restored.", badge vuelve a Active.
- [ ] Registro en `clients`: `is_active = 1`, `deleted_at = NULL`.
- [ ] Fila en `activity_logs`: `action = 'restored_client'`, `new_value.is_active = true`.

### Escenario C — Restricciones funcionando

- [ ] Cliente con proyecto en estado activo (p. ej. Development) → botón Archive muestra error "This client has active projects and cannot be archived."; el cliente permanece activo y no se escribe auditoría de archivo.
- [ ] Tras completar/cancelar/archivar todos sus proyectos → el mismo cliente ya puede archivarse.
- [ ] Intento sin permiso `clients.update` (rol Client/Intermediary vía acción forzada) → redirección a `/unauthorized` sin cambios.

## 5. Notas

1. La validación vive en el servicio (no en la acción ni en la UI): cualquier caller futuro hereda la regla, consistente con la defensa en capa de datos del proyecto.
2. La definición de "proyecto activo" reutiliza la de `DashboardService`/reports: excluye Completed, Cancelled y Archived.
3. La restauración de un cliente archivado queda bloqueada para roles no Developer si el scope de visibilidad filtra clientes inactivos; comportamiento existente de `auth-scope`, fuera de alcance aquí.
