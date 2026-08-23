# QA — Historia 4.2: Crear Cliente

Historia: BACKLOG.md → Épica 4 / Historia 4.2 (Crear Cliente)

Fecha: 2026-08-22

---

## 1. Alcance implementado

| Requisito | Implementación |
| --- | --- |
| Server Action con RBAC | `actions/clients.ts` → `createClient` con guard `requirePermission("clients.create")` antes de cualquier operación. |
| Validar información | Esquema Zod compartido `schemas/client.ts` (`clientSchema`): `company_name` requerido (trim, máx. 200), email y website con formato válido, límites por campo, `status` restringido a `active`/`inactive`. La acción devuelve el primer error de campo (mismo patrón que `users.ts`). Se eliminó el esquema duplicado local de la acción. |
| Registrar cliente | `ClientsService.create` con `created_by`/`updated_by` del actor, `is_active = true` explícito y default activo en la capa de datos. Campos opcionales vacíos se normalizan a `null`. |
| Registrar auditoría | `ActivityService.log` tras la creación: `action = created_client`, `entity = Client`, `entity_id`, y `new_value` con los datos principales. Fallos de auditoría no bloquean la operación (registrados en logs del servidor). |
| Confirmación de creación | Modal muestra mensaje de éxito ("Client created.") con botón de cierre; la tabla se sincroniza con los datos revalidados del servidor (`useEffect` sobre `initialClients`) para que el nuevo cliente aparezca sin recargar. |

## 2. Arquitectura

```
schemas/client.ts            validación compartida cliente/servidor (fuente única)
actions/clients.ts           guard RBAC + validación + normalización + auditoría
features/clients/service     persistencia (is_active activo por defecto)
services/activity.service    escritura en activity_logs
app/dashboard/clients        UI: DataTable + modal de creación con confirmación
```

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| ESLint adicional sobre `actions/clients.ts`, `features/clients`, `schemas/client.ts` | PASS |
| `npm run build` (Next.js 16, Turbopack) compilando y generando rutas | PASS |

## 4. Checklist manual (rol Developer)

### Escenario A — Validar campos requeridos

- [ ] Enviar el formulario vacío → error "Company name is required"; no se crea registro.
- [ ] Email inválido (p. ej. "cliente@") → error "Invalid email".
- [ ] Website inválido (p. ej. "misitio") → error "Invalid URL".
- [ ] Nombre de empresa > 200 caracteres → error de longitud máxima.
- [ ] Espacios solo en "Company Name" → rechazado por trim (min 1).

### Escenario B — Validar creación

- [ ] Creación válida → mensaje "Client created." en el modal y cierre con "Done".
- [ ] El nuevo cliente aparece en la tabla inmediatamente (sin recargar).
- [ ] Registro en `clients` con `is_active = 1`, `status = 'active'`, campos opcionales vacíos como NULL.
- [ ] `created_by` y `updated_by` con el id del usuario autenticado.
- [ ] Fila en `activity_logs`: `action = 'created_client'`, `entity = 'Client'`, `entity_id` correcto y `user_id` del actor.
- [ ] Intento de creación sin permiso (rol Intermediary/Client vía acción forzada) → redirección a `/unauthorized` sin crear registro.

## 5. Notas

1. Duplicados: la historia marca "Validar duplicados" como verificado previamente; no existe restricción de unicidad definida en PRD para clientes (dos empresas pueden compartir nombre/correo), por lo que no se añadió regla nueva.
2. La edición de clientes usa el mismo esquema compartido, pero excluye `status` e `intermediary_id` del payload: esos cambios pertenecen a flujos propios (archivar/restaurar H4.4, asignación H4.6) y conservan su comportamiento anterior.
3. Fuera de alcance de esta historia: auditoría de edición/archivado (H4.3/H4.4/H4.12).
