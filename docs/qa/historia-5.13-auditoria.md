# QA — Historia 5.13: Auditoría (Intermediarios)

Historia: BACKLOG.md → Épica 5 / Historia 5.13 (Auditoría)

Fecha: 2026-08-23

---

## 1. Alcance implementado

| Evento | Acción | Registro en `activity_logs` |
| --- | --- | --- |
| Inicio/cierre de sesión | `actions/auth.ts` (previo) | `logged_in` / `logged_out`. |
| Asignación de clientes | `assignClientsToIntermediary` / `removeClientFromIntermediary` / `assignClientIntermediary` (previo) | `assigned_intermediary` / `removed_intermediary`. |
| Comentarios | `actions/comments.ts` (previo) | `created_comment`, `created_client_comment`, `replied_client_comment`, `updated_client_comment`, `deleted_client_comment`. |
| Descarga de archivos | `getFileUrl` (`actions/files.ts`) — **nuevo** | `downloaded_file`, entidad normalizada vía `toActivityEntity` (`client` → `Client`, etc.), `new_value.filename`; se emite tras generar la URL firmada y cubre descarga y vista previa. |
| Consulta de proyectos | `/dashboard/projects/[id]` — **nuevo** | `viewed_project` vía `ActivityService.logAccessOnce` con deduplicación por usuario/acción/entidad en ventana de 60 s; `new_value.name`; solo tras pasar `assertProjectVisible`. |
| Cambios de perfil | `actions/profile.ts` (previo) | `updated_profile`, `changed_password`, `updated_avatar`. |

## 2. Arquitectura

```
services/activity.service    ActivityService.log (INSERT) + logAccessOnce
                             (deduplicación de eventos de acceso; fallos de auditoría
                             nunca bloquean la operación principal)
actions/files.ts             downloaded_file tras emitir la URL firmada
                             (auth + assertEntityVisible previos, capa de datos)
app/dashboard/projects/[id]  viewed_project al renderizar la página de detalle,
                             después del check de visibilidad y del fetch principal
features/activity            ACCESS_AUDIT_ACTIONS: eventos de acceso solo-auditoría
features/clients/...         getClientHistory/getLastActivity excluyen ACCESS_AUDIT_ACTIONS
features/intermediaries/...  getHistory/getLastActivity excluyen ACCESS_AUDIT_ACTIONS
```

La autorización ocurre siempre antes del registro: la descarga pasa por `assertEntityVisible` (dentro de `FilesService.getById`) y la consulta por `assertProjectVisible` (dentro de `ProjectsService.getById`, con redirect a `/unauthorized` si falla). Los valores registrados no contienen datos sensibles (solo nombres de archivo/proyecto e ids).

## 3. Verificación automatizada

| Verificación | Resultado |
| --- | --- |
| `npx tsc --noEmit` sin errores de TypeScript | PASS (2026-08-23) |
| `npm run lint` + `eslint features/ services/ actions/` sin errores | PASS (2026-08-23) |
| `npm run build` (Next.js 16) compilando y generando rutas | PASS (2026-08-23) |
| Suite SQLite en memoria (esquema real replicado): historial sin filtros excluye `viewed_project`/`downloaded_file` | PASS (2026-08-23) |
| Historial con filtro de categoría: orden de parámetros scopes → exclusión → filtros correcto | PASS (2026-08-23) |
| Historial con búsqueda por usuario: orden de parámetros correcto | PASS (2026-08-23) |
| Last Activity cliente e intermediario: ignora consultas/descargas y respeta parámetros | PASS (2026-08-23) |
| Dedupe `logAccessOnce`: detecta evento dentro de ventana, permite fuera de ventana y es por usuario | PASS (2026-08-23) |

Nota: durante la verificación funcional se detectó que insertar la exclusión dentro de la plantilla previa de agrupación (`join(") OR (")`) cambiaba la asociación del `AND` al último scope; las consultas fueron reescritas con agrupación explícita (`(${scopes.join(" OR ")}) AND exclusion AND filters`) y cubiertas por la suite anterior.

## 4. Checklist manual

- [ ] Developer descarga un documento desde `/dashboard/files` o la pestaña Documents del cliente → fila `action='downloaded_file'`, `entity='Client'|'Project'|...`, filename en `new_value`.
- [ ] Vista previa del archivo → mismo evento (misma URL firmada); dos clics consecutivos generan eventos independientes (acción explícita del usuario).
- [ ] Visitar `/dashboard/projects/[id]` → fila `viewed_project` con nombre del proyecto.
- [ ] Refrescar la página dentro de 60 s → no se duplica el evento (`logAccessOnce`).
- [ ] Refrescar pasados 60 s → se registra una nueva consulta.
- [ ] Usuario sin acceso al proyecto (rol Client/Intermediary fuera de alcance) → redirect a `/unauthorized` y ningún evento `viewed_project`.
- [ ] Timeline del cliente (`/dashboard/clients/[id]`) y del intermediario (`/dashboard/intermediaries/[id]`) → los eventos `viewed_project`/`downloaded_file` no aparecen (excluidos por `ACCESS_AUDIT_ACTIONS`).
- [ ] Widget "Last Activity" de cliente/intermediario → no muestra consultas/descargas como última actividad.
- [ ] `/dashboard/activity` → las nuevas acciones son visibles, buscables y filtrables junto al resto.

## 5. Notas

1. La deduplicación de 60 s colapsa refrescos y prefetch del App Router; cada consulta real fuera de la ventana queda auditada.
2. Los eventos de acceso viven únicamente en la auditoría global (`/dashboard/activity`): los historiales 4.7/5.5 mantienen su alcance de eventos de negocio definido en el BACKLOG.
3. `logAccessOnce` es fire-and-forget por diseño (consistente con `ActivityService.log`): una caída de Turso durante el log no rompe la navegación.
4. La exclusión aplica también a registros futuros de la misma familia; añadir nuevos eventos de acceso solo requiere extender `ACCESS_AUDIT_ACTIONS`.
