# QA — Historia 4.12: Auditoría del Cliente

Historia: BACKLOG.md → Épica 4 / Historia 4.12 (Auditoría del Cliente)

Fecha: 2026-08-22

---

## 1. Alcance implementado

| Evento | Acción | Registro en `activity_logs` |
| --- | --- | --- |
| Creación | `createClient` (guard `clients.create`) | `created_client`, `entity='Client'`, `new_value` con datos principales. |
| Actualización | `updateClient` (guard `clients.update`) | `updated_client` con diff `old_value`/`new_value` solo de campos modificados. |
| Archivado | `toggleClientActive(id, false)` | `archived_client`, `old_value.is_active=true`, `new_value.is_active=false`. |
| Restauración | `toggleClientActive(id, true)` | `restored_client`, `new_value.is_active=true`. |
| Asignación de intermediarios | `assignClientIntermediary` / `removeClientIntermediary` | `assigned_intermediary` / `removed_intermediary` con id y nombre. |
| Subida de archivos | `uploadFile` / `deleteFile` | `uploaded_file` / `deleted_file`; entidad normalizada (`client` → `Client`, etc.) vía `toActivityEntity`. |
| Comentarios | `createProjectCommentAction`; comentarios de cliente (Historia 4.9) | `created_comment` (`entity='Comment'`, unido a proyecto→cliente); `created_client_comment` / `replied_client_comment` / `updated_client_comment` / `deleted_client_comment` (`entity='Client'`). |
| Creación de proyectos | `createProject` (guard `projects.create`) | `created_project`, `entity='Project'`, `entity_id` del proyecto, `new_value.client_id`. |

## 2. Arquitectura

```
services/activity.service    ActivityService.log: INSERT en activity_logs; fallos de auditoría
                             se registran en consola y nunca bloquean la operación principal
actions/clients.ts           eventos de ciclo de vida e intermediarios (con requirePermission)
actions/files.ts             eventos de archivos + toActivityEntity (normalización de entidad)
actions/projects.ts          created_project + revalidación de la página del cliente
actions/comments.ts          created_comment para comentarios de proyecto; eventos 4.9 para cliente
features/clients/...         lectura consolidada para el historial (getClientHistory)
```

Toda escritura ocurre en la capa de Server Actions tras `requirePermission` (RBAC server-side); la UI no puede saltarse la auditoría. Los valores sensibles nunca se registran (solo nombres, ids y estados).

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS |
| `npm run lint` sin errores ESLint | PASS |
| `npm run build` (Next.js 16) compilando y generando rutas | PASS |

## 4. Checklist manual (rol Developer)

- [ ] Crear cliente → fila con `action='created_client'`, `user_id` del actor, `ip_address`/`user_agent` según contexto.
- [ ] Editar dos campos del cliente → `updated_client` con exactamente esos campos en `old_value`/`new_value`.
- [ ] Editar sin cambios reales → no se escribe evento (diff vacío).
- [ ] Archivar/restaurar → `archived_client` / `restored_client` con transición `is_active`.
- [ ] Asignar y remover intermediario → `assigned_intermediary` / `removed_intermediary`.
- [ ] Subir archivo al cliente → `uploaded_file` con `entity='Client'` (mayúscula) y metadatos en `new_value`.
- [ ] Eliminar archivo → `deleted_file` con filename en `old_value`.
- [ ] Comentar proyecto del cliente → `created_comment` con `project_id` en `new_value`.
- [ ] Comentar el cliente (Historia 4.9) → `created_client_comment` (o `replied_client_comment` si es respuesta).
- [ ] Crear proyecto del cliente → `created_project` con `client_id` en `new_value`.
- [ ] Intentar acción sin permiso (rol Client) → la acción se bloquea por RBAC y no se registra evento de negocio.
- [ ] Vista global `/dashboard/activity` → los eventos siguen filtrando por entidad correctamente tras la normalización.

## 5. Notas

1. La auditoría de archivos previa a este cambio usaba `entity='client'` (minúscula); los registros históricos no se reescriben.
2. La actualización de proyectos, archivado/restauración de proyectos y edición/eliminación de comentarios corresponden a las épicas de Proyectos/Comentarios y no forman parte de esta historia.
3. `ActivityService.log` es fire-and-forget por diseño: una caída de Turso durante el log no revierte la operación de negocio (consistente con Historias 2.11 y 4.4).
