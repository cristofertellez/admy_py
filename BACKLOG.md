# BACKLOG.md

# Sistema de Gestión, Control y Visualización de Proyectos

Versión: 1.0

Estado: En desarrollo (v0.5 completada, v1.0 en progreso)

Documento derivado de:
- PRD.md
- DESIGN.md
- AGENTS.md

---

# Objetivo

Este documento define el backlog completo del proyecto.

Su propósito es servir como la fuente oficial de planificación para el desarrollo de la plataforma.

Cada tarea deberá implementarse respetando lo establecido en:

- PRD.md
- DESIGN.md
- AGENTS.md

El backlog está organizado mediante Épicas, Historias de Usuario y tareas técnicas.

Las historias podrán dividirse posteriormente en Sprints según la capacidad del equipo.

---

# Estados de una Tarea

Todas las tareas deberán utilizar uno de los siguientes estados.

- Backlog
- Ready
- In Progress
- Review
- Testing
- Done
- Blocked
- Cancelled

---

# Prioridades

Todas las tareas deberán tener una prioridad.

## P0 — Crítica

Imprescindible para el funcionamiento del sistema.

## P1 — Alta

Necesaria para el MVP.

## P2 — Media

Importante, pero puede desarrollarse posteriormente.

## P3 — Baja

Mejora o funcionalidad opcional.

---

# Roadmap

El desarrollo estará dividido en versiones.

## Versión 0.1 ✅ COMPLETADA

Infraestructura ✅
Autenticación ✅
Base de datos ✅
RBAC ✅
Diseño base ✅
PWA ✅

---

## Versión 0.2 ✅ COMPLETADA

Clientes ✅
Intermediarios ✅
Usuarios ✅
Roles ✅
Permisos ✅

---

## Versión 0.3 ✅ COMPLETADA

Proyectos ✅
Dashboard ✅
Timeline ✅
Estimaciones ✅

---

## Versión 0.4 ✅ COMPLETADA

Tareas ✅
Subtareas ✅
Checklists ✅
Dependencias ✅
Comentarios ✅

---

## Versión 0.5 ✅ COMPLETADA

Archivos ✅
Reportes ✅
Notificaciones ✅
Búsqueda ✅
Auditoría ✅

---

## Versión 1.0

Optimización

Responsive

PWA completa

Modo Offline

Refactorización

Preparación para producción

### v1.0 Progreso (2024)

- [x] Sidebar navigation: <a> reemplazado por <Link> con transiciones cliente
- [x] Menú hamburguesa mobile con sidebar overlay responsive
- [x] Landing page redirige usuarios autenticados a /dashboard
- [x] Error boundaries: error.tsx, global-error.tsx, not-found.tsx
- [x] next.config.ts configurado con headers de seguridad y PWA
- [x] Proxy/Middleware con protección de rutas y auth a nivel edge
- [x] Página Settings (/dashboard/settings) con formulario de configuración
- [x] Módulo Tags: servicio, acciones y página de administración (/dashboard/tags)
- [x] Módulo Time Entries: servicio y acciones creados
- [x] Build verificado sin errores TypeScript
- [x] PWA: iconos PNG 192/512/maskable generados (manifest corregido, start_url /dashboard)
- [x] PWA: InstallPrompt con beforeinstallprompt (dismissible, detecta standalone)
- [x] PWA: ServiceWorkerRegister con actualización automática (SKIP_WAITING + reload controlado)
- [x] Registro de SW movido a componente cliente (script inline eliminado del layout)
- [x] PWA: Indicador de conectividad en el header (online/offline, última sincronización, cambios pendientes)
- [x] PWA: Cola de acciones pendientes offline (Historia 14.8) con sincronización automática al reconectar
- [x] PWA: Modo offline vía caché del Service Worker (páginas y payloads RSC visitados; sin IndexedDB/localStorage de datos)
- [x] PWA: Banner offline de solo lectura en el dashboard (datos recientemente vistos)
- [x] PWA: Sincronización automática al recuperar conexión (cola persistente lib/sync + estado de sync/conflictos en el indicador)
- [x] PWA: apple-touch-icon + favicon en metadata (instalación iOS/Safari)
- [x] PWA: InstallPrompt con guía manual para iOS (Safari no soporta beforeinstallprompt) y meta legado apple-mobile-web-app-capable
- [x] QA: Lighthouse PWA 100% (installability, SW controla start_url, maskable icon, splash screen)
- [x] Épica 8 — Hitos: servicio completo (agregados de tareas en una consulta, CRUD, reorden, historial, próximos hitos con scope) + esquema Zod + transiciones de estado (`milestone-status.ts`) + acciones con auditoría completa (8.13) e indicadores automáticos (8.6/8.9)
- [x] Épica 8 — Página de hitos rework: KPIs rápidos, búsqueda/filtros server-side (URL state), vista Table | Timeline | History, asignación de tareas a hitos (8.5), RBAC (solo lectura para Client/Intermediary) y modal de formulario centralizado compartido con las pestañas del proyecto
- [x] Épica 11 — Librería de widgets centralizada (`components/dashboard/`): KpiCard, ListCard, MilestonesCard, ActivityCard, CommentsCard, DueSoonCard, FilesCard, AtRiskProjectsCard (11.5)
- [x] Épica 11 — Dashboards por rol: DeveloperPanel (KPIs clicables, gráficos de estados y horas, proyectos en riesgo, actividad/comentarios/archivos recientes), ClientPanel (sus proyectos con progreso, hitos y entregas), IntermediaryPanel refactorizado a widgets compartidos (11.2/11.3/11.4)
- [x] Épica 11 — DashboardService: consultas agregadas batcheadas sin N+1, riesgo de portafolio (11.10), retrasos reales (delayedProjects antes en 0) y comentarios recientes de las 4 superficies
- [x] Limpieza: eliminados `dashboard-charts.tsx` y `hooks/use-dashboard.ts` (código muerto)
- [x] Centro de Reportes: 7 reportes por módulo (proyectos/tareas/hitos/horas/clientes/intermediarios/productividad) con KPIs, gráficos de barra/pastel/línea y exportación PDF/CSV/Excel reutilizable (`lib/exports`, `lib/export-pdf`)
- [x] Épica 13 — Notificaciones: preferencias por usuario (canales, frecuencia, horas silenciosas, tipos), modelo de suscripciones push (preparado), expansión de destinatarios (miembros/intermediarios/usuario cliente), recordatorios automáticos (entregas, hitos, tareas vencidas, proyectos inactivos, comentarios sin responder), centro de notificaciones con KPIs/filtros/búsqueda/paginación/agrupación por fecha, campana con no leídas, marcar/descartar/restaurar, arquitectura de email con transporte conector y auditoría de lectura/descarte/preferencias
- [x] Tareas: dependencias con validación de ciclos y bloqueo de completado, vistas Kanban (drag & drop auditado), Calendario mensual (tareas + entregas de hitos) y Timeline Gantt en `/dashboard/tasks`, indicadores automáticos (horas restantes, retraso, productividad, estado general), búsqueda global ampliada (responsable/proyecto/etiquetas), auditoría de checklists/asignación/prioridad y notificaciones de tarea
- [x] Hitos: dependencias entre hitos con ciclos validados, panel de gestión Depends on/Blocks y carga batcheada por proyecto (8.8)
- [x] Dashboard: personalización de widgets por rol (visibilidad + orden + restaurar), filtros globales en URL (proyecto/cliente/estado/prioridad/fechas) aplicados a los servicios, exportación PDF/CSV/Excel del dashboard y auditoría de exportaciones/layout/accesos (11.11–11.13/11.17)
- [x] Auditoría: exportación del Activity Log (PDF/CSV/Excel), política de retención con ajuste `audit_retention_days`, filtro de eventos de seguridad, `login_failed`, detalles old→new en la tabla y cierre de auditoría de tareas/hitos (16.4/16.5/16.8/16.11–16.15)
- [x] PWA: datos locales de recientes con accesos rápidos offline, prompt de actualización ("Update now"/"Remind later") según ajuste `pwa_auto_updates`, jsPDF lazy (menos bundle), categoría de ajustes PWA, auditoría del ciclo PWA vía `/api/pwa/events` y checklist de compatibilidad (14.6/14.9–14.15)
- [x] Épica 17 — API pública v1 read-only (proyectos/tareas/clientes/hitos + OpenAPI + rate limiting + API keys hasheadas con UI en `/dashboard/integrations`), webhooks firmados con cola de reintentos e historial, bus de eventos internos (`system_events` + `after()`), reglas de automatización, feed ICS de calendario, importación CSV de clientes/proyectos con validación en dos fases, exportación global ZIP, `/api/health` y `docs/ROADMAP.md` (v2–v4)
- [x] Cierre de pendientes accionables: lockout de cuenta con `login_max_attempts`/`auto_lock_minutes` (migración 00014, 16.13), filtro por proyecto en el Activity Log y en notificaciones (13.7/13.10/16.9), consulta limitada del log para Administrator (16.14), filtro por intermediario en el dashboard (11.12), sincronización en segundo plano desactivable (14.13), importación de tareas/hitos + formato Excel (17.10), auditoría `automation_executed` (17.16), avatares locales con `next/image` (14.10) y métricas de latencia/errores de la API en `/api/health` (17.12)
- [x] Limpieza y documentación: código muerto eliminado (barrels huérfanos `actions/index.ts`, `components/{pwa,shared,tables}/index.ts`; acciones sin uso `signup`, `getSettings`/`updateSetting`, `getTags`, `getMyPreferences`, `getGlobalReport`/`getReportFilterOptions`, `getTimeEntries`, `updateFileCategory`, `restoreCommentAction`+`CommentsService.restoreComment`, `getCurrentRole`; constantes `ROLES`, `MILESTONE_STATUS_OPTIONS`, `APP_VERSION`; `isFlushingPendingActions`, `isReplayableAction`, `clearPendingActions`; tipos `EntityType`/`BaseEntity`/`Attachment`), ~25 exports internos des-publicados, `APP_NAME`/`APP_DESCRIPTION` conectados a los metadatos del layout (antes hardcodeados), `npm run lint` ampliado a todo el código fuente, dependencia `@tanstack/query-async-storage-persister` sin uso eliminada; README/CONTRIBUTING/ARCHITECTURE actualizados a la estructura real (incluye subsistemas de integración, PWA offline y exportaciones); esquemas Zod homogeneizados con primitivas compartidas en `schemas/shared.ts` (`optionalDate`/`dateString`/`optionalUuid`/`optionalText`/`timeString`/`hexColor`) y mensajes de validación con puntuación uniforme. Se conservan `PermissionGuard` (2.10 pendiente), hooks de resolución de conflictos offline `retryPendingAction`/`discardPendingAction` (hallazgo 14.4-A), funciones puras de indicadores/predicados de estado (seams de testing) y la arquitectura de email preparada (13.3)
- [x] Roadmap v2 — Diagrama de Gantt Interactivo (`/dashboard/tasks?view=gantt`): vista Gantt completa con curvas SVG dinámicas y flechas dirigidas para dependencias `task_dependencies`, detección visual de conflictos de desfase (líneas discontinuas en rojo si el predecesor termina tras el inicio del sucesor), zoom temporal por días/semanas/meses, agrupamiento dinámico (por proyecto/por estado con acordeón de grupos), botón "Hoy" con marcador vertical en tiempo real, resaltado reactivo al pasar el cursor (cadena de bloqueadores/sucesores), tarjeta modal de inspección de tarea con predecesores y sucesores, y cajón para tareas sin fechas estimadas.

---

# Épica 1 — Infraestructura

## Objetivo

Construir toda la infraestructura base del proyecto para soportar el desarrollo del resto de módulos.

Prioridad

P0

Estado

Done

---

## Historia 1.1

Inicializar proyecto Next.js 16

### Backend

- [x] Crear proyecto con Next.js 16
- [x] Configurar TypeScript
- [x] Configurar App Router
- [x] Configurar ESLint
- [x] Configurar Prettier
- [x] Configurar alias de imports
- [x] Configurar variables de entorno

### Frontend

- [x] Configurar Tailwind CSS
- [x] Instalar shadcn/ui
- [x] Configurar tema global
- [ ] Configurar tipografías
- [x] Configurar Layout principal

### QA

- [ ] Verificar compilación
- [x] Verificar rutas
- [x] Verificar estilos
- [x] Verificar tipado

Estado

Done

Prioridad

P0

---

## Historia 1.2

Configurar Turso

### Backend

- [ ] Crear base de datos en Turso
- [ ] Configurar conexión
- [ ] Configurar variables
- [ ] Configurar cliente servidor

### Seguridad

- [ ] Configurar control de acceso a datos
- [ ] Configurar Auth
- [ ] Crear esquema inicial
- [ ] Verificar permisos

### QA

- [ ] Validar conexión
- [ ] Validar autenticación
- [ ] Validar permisos

Estado

Backlog

Prioridad

P0

---

## Historia 1.3

Configurar arquitectura

### Tareas

- [x] Crear estructura de carpetas
- [x] Configurar Features
- [x] Configurar Components
- [x] Configurar Services
- [x] Configurar Hooks
- [x] Configurar Providers
- [x] Configurar Utils
- [x] Configurar Types
- [x] Configurar Constants

Estado

Backlog

Prioridad

P0

---

## Historia 1.4

Configurar TanStack Query

### Tareas

- [x] Instalar TanStack Query
- [x] Crear Provider (QueryProvider)
- [x] Configurar QueryClient
- [x] Configurar Devtools (desarrollo)
- [ ] Configurar estrategia de caché
- [x] Configurar invalidaciones

Estado

Backlog

Prioridad

P0

---

## Historia 1.5

Configurar React Hook Form + Zod

### Tareas

- [x] Instalar dependencias
- [x] Crear validaciones base
- [x] Crear componentes reutilizables
- [x] Crear utilidades para formularios

Estado

Backlog

Prioridad

P0

---

## Historia 1.6

Configurar DataTable Base

### Tareas

- [x] Integrar TanStack Table
- [x] Crear componente DataTable reutilizable
- [ ] Configurar paginación
- [x] Configurar filtros
- [ ] Configurar búsqueda
- [x] Configurar ordenamiento
- [ ] Configurar selección múltiple

Estado

Backlog

Prioridad

P0

---

## Historia 1.7

Configurar PWA

### Tareas

- [x] Crear Manifest
- [x] Configurar iconos
- [x] Configurar instalación
- [x] Configurar Service Worker
- [x] Configurar cache inicial
- [x] Configurar actualización automática

Estado

Backlog

Prioridad

P1

---

## Historia 1.8

Configurar Documentación

### Tareas

- [x] Agregar PRD.md
- [x] Agregar DESIGN.md
- [x] Agregar AGENTS.md
- [x] Agregar BACKLOG.md
- [x] Crear README.md
- [x] Crear CONTRIBUTING.md
- [x] Crear ARCHITECTURE.md

Estado

Backlog

Prioridad

P1

---

## Criterios de Aceptación de la Épica

- Proyecto inicial funcionando.
- Compilación sin errores.
- Turso conectado.
- Arquitectura creada.
- PWA instalada correctamente.
- DataTable reutilizable disponible.
- Formularios base configurados.
- Documentación completa.
- Proyecto listo para comenzar el desarrollo funcional.

---

# Épica 2 — Autenticación y Autorización

## Objetivo

Implementar un sistema de autenticación seguro utilizando NextAuth (Auth.js) y un sistema de autorización propio basado en RBAC, garantizando que cada usuario solo pueda acceder a la información permitida según su rol y permisos.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 1 — Infraestructura

---

# Historia 2.1

Configurar NextAuth (Auth.js)

## Objetivo

Integrar completamente NextAuth (Auth.js) con la aplicación.

### Backend

- [ ] Configurar autenticación con NextAuth (Auth.js)
- [ ] Configurar cookies seguras
- [ ] Configurar sesión del servidor
- [ ] Configurar sesión del cliente
- [ ] Configurar renovación automática de sesión
- [ ] Configurar cierre automático de sesiones inválidas

### Frontend

- [x] Crear Provider (QueryProvider) de autenticación
- [ ] Crear contexto global del usuario
- [ ] Mostrar estado de autenticación
- [ ] Manejar sesión expirada

### QA

- [ ] Validar persistencia de sesión
- [ ] Validar renovación automática
- [ ] Validar cierre de sesión

Estado

Backlog

Prioridad

P0

---

# Historia 2.2

Inicio de sesión

## Objetivo

Permitir que un usuario autenticado pueda acceder a la plataforma.

### Backend

- [x] Crear Server Action para login
- [x] Validar credenciales
- [ ] Registrar inicio de sesión en auditoría

### Frontend

- [ ] Diseñar pantalla Login
- [x] Crear formulario
- [x] Validar con Zod
- [x] Mostrar errores amigables
- [x] Redireccionar al Dashboard correspondiente

### QA

- [ ] Usuario válido
- [ ] Usuario inválido
- [ ] Contraseña incorrecta
- [x] Usuario deshabilitado
- [ ] Sesión creada correctamente

Estado

Backlog

Prioridad

P0

---

# Historia 2.3

Cerrar sesión

### Backend

- [ ] Invalidar sesión
- [ ] Limpiar cookies
- [ ] Registrar evento en auditoría

### Frontend

- [ ] Agregar opción en menú de usuario
- [ ] Confirmar cierre de sesión (opcional)

### QA

- [x] Redireccionar al Login
- [ ] No permitir regresar usando el navegador
- [x] Eliminar datos temporales

Estado

Backlog

Prioridad

P0

---

# Historia 2.4

Recuperación de contraseña

## Backend

- [ ] Configurar recuperación mediante NextAuth (Auth.js)
- [x] Validar token
- [ ] Registrar evento

## Frontend

- [ ] Pantalla "Olvidé mi contraseña"
- [ ] Pantalla de nueva contraseña
- [ ] Confirmación de cambio exitoso

## QA

- [ ] Correo válido
- [x] Correo inexistente
- [x] Token expirado
- [ ] Contraseña actualizada

Estado

Backlog

Prioridad

P1

---

# Historia 2.5

Perfil del usuario

## Backend

- [x] Obtener perfil
- [x] Actualizar datos
- [x] Actualizar avatar

## Frontend

- [ ] Página de perfil
- [x] Formulario de edición
- [ ] Vista previa del avatar

## QA

- [ ] Validar actualización
- [ ] Validar imagen
- [x] Validar permisos

Estado

Backlog

Prioridad

P1

---

# Historia 2.6

Sistema RBAC

## Objetivo

Implementar autorización independiente del proveedor de autenticación.

### Backend

- [x] Crear tabla Roles
- [x] Crear tabla Permisos
- [x] Crear tabla Role Permissions
- [x] Crear tabla User Roles (role_id en users)
- [x] Crear middleware de autorización
- [x] Crear helper de permisos

### Frontend

- [ ] Ocultar opciones sin permisos (PermissionGuard pendiente)
- [ ] Componente PermissionGuard
- [x] Manejo de acceso denegado (p�gina /unauthorized)

### QA

- [ ] Validar cada permiso
- [ ] Validar cambio de rol
- [ ] Validar restricciones

Estado

Backlog

Prioridad

P0

---

# Historia 2.7

Roles del sistema

## Objetivo

Crear los roles iniciales definidos en el PRD.

### Tareas

- [x] Crear rol Developer
- [x] Crear rol Client
- [x] Crear rol Intermediary
- [x] Preparar rol Administrator
- [x] Preparar rol Super Administrator
- [x] Crear Seeds iniciales

### QA

- [ ] Verificar permisos por rol
- [ ] Validar acceso correcto

Estado

Backlog

Prioridad

P0

---

# Historia 2.8

Permisos del sistema

## Objetivo

Crear permisos granulares para todos los módulos.

### Proyectos

- [x] project.create
- [x] project.read
- [x] project.update
- [x] project.delete
- [x] project.archive

### Clientes

- [x] client.create
- [x] client.read
- [x] client.update
- [x] client.delete

### Intermediarios

- [x] intermediary.create
- [x] intermediary.read
- [x] intermediary.update
- [x] intermediary.delete

### Tareas

- [x] task.create
- [x] task.read
- [x] task.update
- [x] task.delete
- [x] task.assign

### Comentarios

- [x] comment.create
- [x] comment.update
- [x] comment.delete

### Archivos

- [x] file.upload
- [x] file.download
- [x] file.delete

### Reportes

- [x] reports.view
- [x] reports.export

### Configuración

- [x] settings.read
- [x] settings.update

### QA

- [ ] Validar todos los permisos
- [x] Validar permisos heredados
- [x] Validar permisos personalizados

Estado

Backlog

Prioridad

P0

---

# Historia 2.9

Protección de rutas

## Backend

- [x] Middleware de autenticación
- [x] Middleware de autorización
- [x] Redirecciones automáticas

## Frontend

- [x] Pantalla Acceso Denegado
- [x] Pantalla No Autenticado

### QA

- [ ] Usuario autenticado
- [ ] Usuario sin permisos
- [ ] Ruta inexistente
- [ ] Ruta protegida

Estado

Backlog

Prioridad

P0

---

# Historia 2.10

Control de Acceso a Datos

## Objetivo

Implementar reglas de seguridad en la capa de acceso a datos (servicios y repositorios).

### Tareas

- [x] Aplicar control de acceso en todas las consultas a tablas sensibles
- [x] Crear reglas de acceso para Developers
- [x] Crear reglas de acceso para Clients
- [x] Crear reglas de acceso para Intermediaries
- [x] Validar reglas de acceso
- [x] Probar intentos de acceso indebido

### QA

- [x] Cliente solo ve sus datos
- [x] Intermediario solo ve clientes asignados
- [x] Developer ve toda la información
- [x] Validar intentos de acceso directo

Implementación: `lib/auth-scope.ts` (scopes de proyectos/clientes/milestones/adjuntos + registro de accesos denegados en activity_logs), servicios por feature y guards `requirePermission` en server actions. QA en `docs/qa/historia-2.10-control-acceso-datos.md`.

Estado

Backlog

Prioridad

P0

---

# Historia 2.11

Auditoría de autenticación

### Tareas

- [x] Registrar inicio de sesión
- [x] Registrar cierre de sesión
- [x] Registrar recuperación de contraseña
- [x] Registrar cambios de perfil
- [x] Registrar cambios de rol
- [x] Registrar cambios de permisos

Estado

Completado

Prioridad

P1

---

# Criterios de Aceptación de la Épica

- Autenticación completamente funcional.
- Sistema RBAC operativo.
- Roles iniciales configurados.
- Permisos granulares implementados.
- Protección de rutas funcionando.
- Control de acceso a datos activo.
- Auditoría registrando eventos.
- Manejo correcto de sesiones.
- Recuperación de contraseña funcional.
- Perfil de usuario editable.

---

# Épica 3 — Usuarios, Roles y Administración

## Objetivo

Desarrollar el módulo de administración de usuarios, roles y permisos del sistema, permitiendo a los Developers gestionar el acceso a la plataforma de forma segura, escalable y auditada.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 1 — Infraestructura
- Épica 2 — Autenticación y Autorización

---

# Historia 3.1

Administración de Usuarios

## Objetivo

Permitir visualizar todos los usuarios registrados.

### Backend

- [x] Crear consulta paginada de usuarios
- [x] Implementar búsqueda
- [x] Implementar filtros
- [x] Ordenamiento
- [x] Paginación

### Frontend

- [x] Crear DataTable
- [x] Barra de búsqueda
- [x] Filtros
- [x] Acciones rápidas
- [x] Vista responsive

### QA

- [x] Verificar paginación
- [ ] Verificar filtros (filtro de estado PASS; filtro por rol roto — la UI envía `role_id` UUID y `UsersService.list` resuelve por `name`, ver hallazgo 3.1-A)
- [x] Verificar búsqueda

QA en `docs/qa/historia-3.1-3.6-3.10-3.12-usuarios-roles.md`.

Estado

Backlog

Prioridad

P0

---

# Historia 3.2

Crear Usuario

## Backend

- [x] Crear Server Action
- [x] Validar datos
- [ ] Crear usuario en NextAuth (Auth.js)
- [x] Crear registro interno
- [x] Asignar rol inicial
- [x] Registrar auditoría

## Frontend

- [x] Modal de creación
- [x] Validaciones Zod
- [x] Confirmación de creación

### QA

- [x] Validar datos requeridos
- [x] Validar correo duplicado
- [x] Validar rol asignado

Estado

Done

Prioridad

P0

---

# Historia 3.3

Editar Usuario

### Backend

- [x] Actualizar información
- [x] Actualizar estado
- [x] Actualizar datos básicos
- [x] Registrar auditoría

### Frontend

- [x] Formulario de edición
- [x] Confirmación
- [x] Manejo de errores

### QA

- [x] Validar actualización
- [x] Validar auditoría

Estado

Done

Prioridad

P0

---

# Historia 3.4

Activar / Desactivar Usuario

### Backend

- [x] Activar usuario
- [x] Desactivar usuario
- [x] Evitar eliminar físicamente
- [x] Registrar auditoría

### Frontend

- [x] Confirm Dialog
- [x] Indicador visual del estado

### QA

- [x] Usuario activo
- [x] Usuario inactivo
- [x] Bloqueo de acceso

Estado

Done

Prioridad

P1

---

# Historia 3.5

Administrar Roles

## Objetivo

Gestionar los roles existentes.

### Backend

- [x] Crear listado
- [x] Editar rol (gestión de permisos)
- [x] Crear nuevos roles (preparado)
- [x] Eliminar lógicamente

### Frontend

- [x] DataTable
- [x] Formulario
- [x] Vista detalle

### QA

- [x] Validar cambios
- [x] Validar permisos

Estado

Done

Prioridad

P1

---

# Historia 3.6

Asignación de Roles

### Backend

- [x] Cambiar rol
- [x] Validar permisos
- [x] Registrar auditoría

### Frontend

- [x] Selector de rol
- [x] Confirmación

### QA

- [x] Cambio correcto
- [x] Cambio reflejado inmediatamente
- [x] Actualización de permisos (rol leído de la BD en cada request; sin caché de sesión)

QA en `docs/qa/historia-3.1-3.6-3.10-3.12-usuarios-roles.md`.

Estado

Backlog

Prioridad

P0

---

# Historia 3.7

Administrar Permisos

### Backend

- [x] Listar permisos
- [x] Asignar permisos
- [x] Revocar permisos
- [x] Validar dependencias

### Frontend

- [x] Vista por módulos
- [x] Checkboxes
- [x] Buscador

### QA

- [x] Permisos asignados
- [x] Permisos revocados
- [x] Persistencia

Estado

Completado

Prioridad

P1

---

# Historia 3.8

Perfil Administrativo

### Backend

- [x] Consultar perfil
- [x] Actualizar información
- [x] Actualizar contraseña

### Frontend

- [x] Pantalla Perfil
- [x] Cambio de contraseña
- [x] Cambio de avatar

### QA

- [ ] Actualización correcta
- [ ] Validación de contraseña

Estado

Review

Prioridad

P1

---

# Historia 3.9

Registro de Actividad

## Objetivo

Mostrar el historial de acciones realizadas por cada usuario.

### Backend

- [x] Consultar auditoría
- [x] Filtrar actividades
- [x] Ordenar eventos

### Frontend

- [x] Timeline
- [x] DataTable
- [x] Filtros

### QA

- [x] Verificar historial
- [x] Verificar filtros

Estado

Done

Prioridad

P2

---

# Historia 3.10

Dashboard Administrativo

### Widgets

- [x] Usuarios activos
- [x] Usuarios inactivos
- [x] Roles existentes
- [x] Últimos accesos
- [x] Actividad reciente
- [x] Estadísticas generales

### QA

- [ ] Información correcta (hallazgo 3.10-A: "Inactive Users" siempre muestra 0 porque desactivar marca `deleted_at` y el dashboard solo cuenta `deleted_at IS NULL`, mientras `/dashboard/users` sí los lista como Inactive)
- [x] Actualización automática
- [x] Responsive

QA en `docs/qa/historia-3.1-3.6-3.10-3.12-usuarios-roles.md`.

Estado

Testing

Prioridad

P2

---

# Historia 3.11

Preferencias del Usuario

### Backend

- [x] Guardar preferencias
- [x] Obtener preferencias

### Frontend

- [x] Idioma (preparado)
- [x] Zona horaria
- [x] Tema (preparado)
- [ ] Preferencias del Dashboard (persistencia lista; UI depende de Historia 11.1)

### QA

- [x] Persistencia
- [x] Restauración automática

Estado

In Progress

Prioridad

P3

---

# Historia 3.12

Auditoría Administrativa

### Registrar

- [x] Crear usuario
- [x] Editar usuario
- [x] Cambiar rol
- [x] Cambiar permisos
- [x] Activar usuario
- [x] Desactivar usuario
- [x] Cambiar contraseña
- [x] Actualizar perfil

QA en `docs/qa/historia-3.1-3.6-3.10-3.12-usuarios-roles.md` (8/8 eventos verificados en `actions/users.ts`, `actions/roles.ts`, `actions/profile.ts`).

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación de la Épica

- Administración completa de usuarios.
- Gestión de roles funcional.
- Gestión de permisos operativa.
- Cambios auditados.
- Búsqueda, filtros y paginación disponibles.
- Dashboard administrativo funcionando.
- Perfil editable.
- Preferencias persistentes.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 4 — Gestión de Clientes

## Objetivo

Desarrollar el módulo completo de gestión de clientes, permitiendo registrar, administrar y consultar toda la información relacionada con cada cliente, así como asociar proyectos, intermediarios y mantener un historial completo de su actividad.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 1 — Infraestructura
- Épica 2 — Autenticación y Autorización
- Épica 3 — Usuarios, Roles y Administración

---

# Historia 4.1

Administración de Clientes

## Objetivo

Permitir visualizar todos los clientes registrados.

### Backend

- [x] Crear consulta paginada
- [x] Implementar búsqueda
- [x] Implementar filtros
- [x] Ordenamiento
- [x] Paginación
- [x] Consultar cantidad de proyectos
- [x] Consultar estado general

### Frontend

- [x] Crear DataTable reutilizable
- [x] Barra de búsqueda
- [x] Filtros avanzados
- [x] Acciones rápidas
- [x] Indicadores visuales

### QA

- [x] Validar búsqueda
- [ ] Validar filtros (hallazgo 4.1-A: el filtro "Status" filtra la columna `status`, que nunca se actualiza al archivar — archivar togglea `is_active`; "Inactive" siempre vacío y archivados visibles como "active")
- [x] Validar paginación (implementación; dataset actual de 5 clientes no alcanza la página 2)
- [x] Validar rendimiento (2 consultas, sin N+1; LIKE con comodín inicial sin índice — nota a escala)

Implementación: `/dashboard/clients` con estado en URL (search, status, page), búsqueda debounced server-side (company_name/contact_name/email), filtro de estado, paginación real con `ClientsService.list` (`total` + LIMIT/OFFSET), acciones rápidas View/Edit/Archive-Restore con confirmación y feedback accesible (aria-live). Build, TypeScript y ESLint verificados sin errores.

QA en `docs/qa/historia-4.1-4.3-4.5-clientes.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 4.2

Crear Cliente

## Backend

- [x] Crear Server Action
- [x] Validar información
- [x] Registrar cliente
- [x] Registrar auditoría

## Frontend

- [x] Formulario
- [x] Validaciones Zod
- [x] Confirmación de creación

Campos iniciales

- Nombre
- Empresa
- Correo electrónico
- Teléfono
- Dirección
- Estado
- Observaciones

### QA

- [x] Validar duplicados
- [x] Validar campos requeridos
- [x] Validar creación

Implementación: esquema Zod compartido (`schemas/client.ts`) con validación cliente/servidor, guard `requirePermission("clients.create")`, auditoría en `activity_logs` (`created_client`), `created_by/updated_by` del actor y confirmación en el modal con actualización inmediata de la tabla. QA en `docs/qa/historia-4.2-crear-cliente.md`.

Estado

Done

Prioridad

P0

---

# Historia 4.3

Editar Cliente

### Backend

- [x] Actualizar información
- [x] Registrar auditoría

### Frontend

- [x] Formulario de edición
- [x] Confirmación

### QA

- [x] Validar actualización (guard `clients.update`, Zod compartido, revalidación listado+detalle)
- [x] Validar historial (diff old/new solo de campos modificados; `updated_client` alimenta el Timeline)

Implementación: edición de clientes vía modal en `/dashboard/clients` (`updateClient` con esquema Zod compartido, guard `clients.update` y auditoría `updated_client` con diff `old_value`/`new_value` solo de campos modificados; sin cambios reales no se escribe evento).

QA en `docs/qa/historia-4.1-4.3-4.5-clientes.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 4.4

Archivar Cliente

## Backend

- [x] Cambio de estado
- [x] Validar proyectos activos
- [x] Registrar auditoría

## Frontend

- [x] Confirm Dialog
- [x] Indicador visual

### QA

- [x] Cliente archivado
- [x] Cliente restaurado
- [x] Restricciones funcionando

Implementación: regla de negocio en `ClientsService.archive` (bloqueo si existen proyectos activos: `deleted_at IS NULL AND is_active = 1 AND status NOT IN ('Completed','Cancelled','Archived')`), auditoría en `activity_logs` (`archived_client`/`restored_client`) y acción con respuesta tipada `{ success | error }`. UI con confirmación previa al archivado, badge Active/Archived y feedback de éxito/error accesible (`aria-live`). QA en `docs/qa/historia-4.4-archivar-cliente.md`.

Estado

Done

Prioridad

P1

---

# Historia 4.5

Detalle del Cliente

## Objetivo

Mostrar toda la información consolidada del cliente.

### Información

- Datos generales
- Información de contacto
- Estado
- Proyectos activos
- Proyectos finalizados
- Intermediarios asignados
- Actividad reciente
- Archivos
- Comentarios

### Frontend

- [x] Vista tipo Dashboard
- [x] Tarjetas informativas
- [x] Timeline
- [x] Navegación por pestañas

### QA

- [x] Información correcta (agregados verificados contra BD: proyectos, horas, entregas próximas, historial; badge Active/Archived vía `is_active`)
- [x] Responsive (grids adaptativos, pestañas con scroll horizontal y ARIA tablist)

Implementación: `/dashboard/clients/[id]` reconstruida como vista dashboard con widgets (total/activos/finalizados/horas), pestañas Overview | Projects | Timeline (`client-tabs.tsx`), tarjeta de intermediario asignado, timeline de actividad del cliente reutilizando `ActivityTimeline` y métodos de servicio `getProjects`, `getAssignedIntermediary`, `getRecentActivity` con `assertClientVisible`. Las secciones Archivos y Comentarios se integran en las historias 4.8 y 4.9.

QA en `docs/qa/historia-4.1-4.3-4.5-clientes.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 4.6

Asignación de Intermediarios

## Backend

- [x] Asignar intermediario
- [x] Remover intermediario
- [x] Validar duplicados
- [x] Registrar auditoría

## Frontend

- [x] Selector múltiple
- [x] Lista de asignados

### QA

- [ ] Asignación correcta
- [ ] Eliminación correcta

Implementación: `ClientsService.assignIntermediary` / `removeIntermediary` (valida visibilidad, rol Intermediary activo y duplicados) con acciones `assignClientIntermediary` / `removeClientIntermediary` protegidas por `clients.update`, auditoría en `activity_logs` (`assigned_intermediary`/`removed_intermediary`) y UI en la tarjeta "Assigned Intermediary" de `/dashboard/clients/[id]` (modal selector con confirmación y remover con confirmación; controles visibles solo con permiso vía `hasPermission`).

Estado

Done

Prioridad

P1

---

# Historia 4.7

Historial del Cliente

## Backend

Registrar automáticamente.

- [x] Creación
- [x] Edición
- [x] Cambio de estado
- [x] Nuevos proyectos
- [x] Comentarios
- [x] Archivos
- [x] Asignaciones

## Frontend

- [x] Timeline cronológico
- [x] Filtros
- [x] Búsqueda

### QA

- [ ] Orden correcto
- [ ] Eventos completos

Implementación: `ClientsService.getClientHistory` agrega en una sola consulta los eventos `entity='Client'` más los eventos de proyectos del cliente (`created_project`) y de comentarios asociados (`created_comment` sobre comentarios de proyecto; comentarios de cliente vía Historia 4.9), con búsqueda server-side (acción, usuario y valores JSON) y filtro por categoría (cliente/proyectos/archivos/comentarios/intermediarios) mapeado a `CLIENT_HISTORY_ACTIONS`. UI: pestaña Timeline con estado en URL (`tab`, `q`, `category`, `page`), búsqueda debounced, selector de tipo de evento y paginación real reutilizando `ActivityTimeline` (`history-filters.tsx`). Orden cronológico descendente garantizado por `ORDER BY al.created_at DESC`.

Estado

Done

Prioridad

P2

---

# Historia 4.8

Documentos del Cliente

## Backend

- [x] Subir archivo
- [x] Descargar archivo
- [x] Eliminar lógicamente
- [x] Registrar auditoría

## Frontend

- [x] Lista de documentos
- [x] Drag & Drop
- [x] Vista previa
- [x] Descarga

### QA

- [ ] Validar subida
- [x] Validar permisos
- [ ] Validar eliminación

Implementación: pestaña "Documents" en `/dashboard/clients/[id]` usando `attachments` (`entity_type='client'`) con `FilesService.list` + `attachmentScope`, subida con drag & drop (modal accesible, MIME/tamaño validados por `uploadFile`), descarga/vista previa vía URL firmada (`getFileUrl`), borrado lógico y auditoría `uploaded_file`/`deleted_file` añadida a `actions/files.ts` (con revalidación de la página del cliente). Botones gated por `files.upload` / `files.download` / `files.delete`.

Estado

Done

Prioridad

P2

---

# Historia 4.9

Comentarios del Cliente

## Backend

- [x] Crear comentario
- [x] Editar comentario
- [x] Eliminar comentario
- [x] Registrar auditoría

## Frontend

- [x] Timeline
- [x] Editor
- [x] Respuestas
- [ ] Menciones

### QA

- [ ] Crear
- [ ] Editar
- [ ] Eliminar

Implementación: migración `00004_client_comments_sqlite.sql` (tabla espejo de project/task_comments con respuestas), métodos en `CommentsService` (`listByClient` con `clientScope`, `createClientComment`, `updateClientComment`, `deleteClientComment` con regla autor-o-permiso a nivel servidor), acciones `createClientCommentAction` / `updateClientCommentAction` / `deleteClientCommentAction` con auditoría (`created_client_comment`, `replied_client_comment`, `updated_client_comment`, `deleted_client_comment`) y pestaña "Comments" en `/dashboard/clients/[id]` (timeline agrupado por hilos, editor, respuestas anidadas, edición inline y borrado con confirmación). Menciones quedan pendientes para una iteración posterior.

Estado

Done

Prioridad

P2

---

# Historia 4.10

Dashboard del Cliente

## Widgets

- [x] Total de proyectos
- [x] Proyectos activos
- [x] Proyectos finalizados
- [x] Horas registradas
- [x] Próximas entregas
- [x] Última actividad

### QA

- [ ] Información correcta
- [ ] Actualización automática

Implementación: cabecera dashboard de `/dashboard/clients/[id]` con tarjetas Total/Active/Completed Projects y Worked Hours (agregadas desde `ClientsService.getProjects`), fila de widgets "Upcoming Deliveries" (próximos hitos no completados vía `getUpcomingDeliveries`) y "Last Activity" (último evento de `activity_logs` del cliente o sus proyectos vía `getLastActivity`). La actualización automática se cubre con `revalidatePath` en todas las server actions que mutan datos del cliente (archivos, comentarios, asignación, estado).

Estado

Done

Prioridad

P2

---

# Historia 4.11

Búsqueda Global de Clientes

## Backend

- [x] Buscar por nombre
- [x] Buscar por empresa
- [x] Buscar por correo
- [x] Buscar por teléfono

## Frontend

- [x] Búsqueda instantánea
- [x] Resultados rápidos

### QA

- [ ] Coincidencias parciales
- [ ] Rendimiento

Estado

Done

Prioridad

P2

---

# Historia 4.12

Auditoría del Cliente

Registrar.

- [x] Creación
- [x] Actualización
- [x] Archivado
- [x] Restauración
- [x] Asignación de intermediarios
- [x] Subida de archivos
- [x] Comentarios
- [x] Creación de proyectos

Implementación: eventos en `activity_logs` desde la capa de acciones — `created_client`/`updated_client` (con diff old/new por campo), `archived_client`/`restored_client`, `assigned_intermediary`/`removed_intermediary`, `uploaded_file`/`deleted_file` (entidad normalizada a mayúscula inicial: "Client", "Project", etc., para que el historial del cliente los resuelva), `created_project` con referencia al cliente, y comentarios (`created_comment` para proyectos; `created_client_comment`/`replied_client_comment`/`updated_client_comment`/`deleted_client_comment` vía Historia 4.9). Escritura centralizada en `ActivityService.log`; los fallos de auditoría no bloquean la operación principal. Trazabilidad en timeline: `ActivityTimeline` muestra el sujeto de cada evento (proyecto, archivo, intermediario, empresa o comentario) vía `getActivityEventDetail` y enlaza a Project/Client vía `getActivityEntityHref`. QA en `docs/qa/historia-4.12-auditoria-del-cliente.md`.

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación de la Épica

- CRUD completo de clientes.
- Vista detallada del cliente.
- Asignación de intermediarios funcional.
- Historial cronológico disponible.
- Gestión de documentos.
- Comentarios asociados.
- Dashboard con indicadores.
- Búsqueda rápida.
- Auditoría completa.
- Integración con proyectos.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 5 — Gestión de Intermediarios

## Objetivo

Desarrollar el módulo de intermediarios, permitiendo administrar usuarios encargados de uno o varios clientes, supervisar el progreso de los proyectos asignados, mantener comunicación con el equipo de desarrollo y ofrecer una vista consolidada de toda su cartera de clientes.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 1 — Infraestructura
- Épica 2 — Autenticación y Autorización
- Épica 3 — Usuarios, Roles y Administración
- Épica 4 — Gestión de Clientes

---

# Historia 5.1

Administración de Intermediarios

## Objetivo

Permitir visualizar todos los intermediarios registrados.

### Backend

- [x] Consulta paginada
- [x] Búsqueda
- [x] Filtros
- [x] Ordenamiento
- [x] Cantidad de clientes asignados
- [x] Cantidad de proyectos activos

### Frontend

- [x] DataTable
- [x] Barra de búsqueda
- [x] Indicadores rápidos
- [x] Acciones rápidas

### QA

- [x] Validar filtros (filtro de estado sobre `is_active`, coherente con Deactivate/Activate)
- [x] Validar búsqueda (nombre/email, debounced server-side; probe real "vega" → 1)
- [x] Validar rendimiento (2 consultas, sin N+1)

Implementación: `/dashboard/intermediaries` con estado en URL (search, status, page), búsqueda debounced server-side (nombre/email) y filtro de estado con `IntermediariesService.list` (`total` + LIMIT/OFFSET), indicadores rápidos Total/Active/Inactive vía `getStats()`, acciones View/Edit/Deactivate-Activate con confirmación previa al desactivado, resultados tipados y feedback accesible (`aria-live`); detalle en `/dashboard/intermediaries/[id]` con clientes asignados.

QA en `docs/qa/historia-5.1-5.4-5.5-5.7-5.9-intermediarios.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 5.2

Crear Intermediario

### Backend

- [x] Crear usuario
- [x] Asignar rol Intermediary
- [x] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Validaciones
- [x] Confirmación

Campos

- Nombre
- Correo
- Teléfono
- Empresa (opcional)
- Estado

### QA

- [ ] Validar creación
- [x] Validar correo duplicado

Implementación: `createIntermediary` (guard `intermediaries.create`, esquema Zod compartido `intermediarySchema`, rol Intermediary asignado en servicio) con auditoría en `activity_logs` (`created_intermediary`), verificación amigable de correo duplicado y modal de confirmación.

Estado

Done

Prioridad

P0

---

# Historia 5.3

Editar Intermediario

### Backend

- [x] Actualizar información
- [x] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Confirmación

### QA

- [ ] Validar actualización

Implementación: `updateIntermediary` (guard `intermediaries.update`, esquema Zod compartido `intermediarySchema`) con auditoría en `activity_logs` (`updated_intermediary`, diff `old_value`/`new_value` solo de campos modificados), corrección del email que ahora sí se persiste con verificación de duplicados, y modal de edición con confirmación.

Estado

Done

Prioridad

P1

---

# Historia 5.4

Asignación de Clientes

## Objetivo

Permitir asignar múltiples clientes a un intermediario.

### Backend

- [x] Asignar cliente
- [x] Remover cliente
- [x] Validar duplicados
- [x] Registrar auditoría

### Frontend

- [x] Selector múltiple
- [x] Lista de clientes asignados
- [x] Buscador

### QA

- [x] Asignación correcta (guard + Zod, intermediario activo, visibilidad por cliente, duplicados omitidos, reasignación auditada)
- [x] Eliminación correcta (valida asignación actual, confirmación previa, auditoría `removed_intermediary`)

Implementación: selector múltiple en `/dashboard/intermediaries/[id]` (`assigned-clients-card.tsx`) con buscador client-side (empresa/contacto/correo), checkboxes con estado por cliente ("Current" deshabilitado, "Reassign" cuando pertenece a otro intermediario) y confirmación previa para remover. Acciones `assignClientsToIntermediary` (esquema Zod `assignClientsToIntermediarySchema`, guard `clients.update`, omite duplicados sin fallar y reasigna clientes de otros intermediarios) y `removeClientFromIntermediary` (valida que el cliente esté asignado a este intermediario), ambas con auditoría en `activity_logs` (`assigned_intermediary`/`removed_intermediary` con old/new) y revalidación de las páginas afectadas. Servicio: `ClientsService.listCandidatesForIntermediary` (con `clientScope`) y `ClientsService.assignClientsToIntermediary`. TypeScript, ESLint y build verificados sin errores.

QA en `docs/qa/historia-5.1-5.4-5.5-5.7-5.9-intermediarios.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 5.5

Vista General del Intermediario

## Información

- Datos personales
- Clientes asignados
- Total de proyectos
- Proyectos activos
- Proyectos finalizados
- Actividad reciente
- Próximas entregas

### Frontend

- [x] Dashboard (vista general)
- [x] Tarjetas resumen
- [x] Timeline
- [x] Navegación por pestañas

### QA

- [x] Información correcta (agregados verificados contra BD: proyectos, horas, entregas próximas, actividad; self-access + guard Developer)
- [x] Responsive (grids adaptativos, pestañas con scroll horizontal y ARIA tablist)

Implementación: `/dashboard/intermediaries/[id]` reconstruida como vista dashboard con tarjetas Total/Active/Completed Projects y Worked Hours (reutiliza `IntermediaryReportsService.getReport`, Historia 5.12), widgets "Upcoming Deliveries" (hitos y proyectos con vencimiento en 30 días) y "Last Activity" (`IntermediariesService.getLastActivity`), y pestañas Overview | Timeline (`intermediary-tabs.tsx`) con estado en URL (`tab`, `q`, `category`, `page`). La pestaña Timeline agrega los eventos de la cartera del intermediario vía `IntermediariesService.getHistory` (eventos `entity='Client'` de clientes asignados + eventos de sus proyectos + comentarios asociados) reutilizando `CLIENT_HISTORY_ACTIONS`, `HistoryFilters` y `ActivityTimeline`; Overview integra la información personal y la tarjeta de clientes asignados con el selector múltiple de 5.4. Build, TypeScript y ESLint verificados sin errores.

QA en `docs/qa/historia-5.1-5.4-5.5-5.7-5.9-intermediarios.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 5.6

Panel del Intermediario

## Objetivo

Crear un panel exclusivo para el rol Intermediary.

### Widgets

- [x] Clientes activos
- [x] Proyectos activos
- [x] Proyectos próximos a vencer
- [x] Tareas pendientes
- [x] Últimos comentarios
- [x] Actividad reciente

### QA

- [x] Actualización automática
- [ ] Información correcta

Implementación: `/dashboard` renderiza un panel exclusivo cuando la sesión tiene rol Intermediary (`IntermediaryPanel`, Server Component) con KPIs enlazados (Active Clients, Active Projects, Due in 30 Days, Pending Tasks), listas "Projects Due Soon" (proyectos activos con `estimated_end_date` dentro de 30 días), "Pending Tasks" (ordenadas por fecha estimada) y "Latest Comments" (fusión de `client_comments` + `project_comments` con autor y enlace al cliente/proyecto). Datos vía `DashboardService.getIntermediaryPanel` usando `clientScope`/`projectScope` (autorización en capa de datos; solo rol Intermediary). Actualización automática cubierta con `revalidatePath("/dashboard")` en las server actions que mutan proyectos, tareas, comentarios, clientes e intermediario asignado. QA manual pendiente.

Estado

Done

Prioridad

P0

---

# Historia 5.7

Seguimiento de Proyectos

### Backend

- [x] Obtener proyectos asignados
- [x] Calcular progreso
- [x] Obtener estado
- [x] Obtener porcentaje completado

### Frontend

- [x] Lista de proyectos
- [x] Tarjetas
- [x] Barra de progreso
- [x] Estado visual
- [x] Fechas importantes

### QA

- [x] Progreso correcto (completion_percentage acotado 0-100, barra accesible; valores reales verificados)
- [x] Estados correctos (Active/Finalized coherentes UI/servicio; badges por estado; Overdue verificado con proyecto vencido real)

Implementación: pestaña "Projects (N)" en `/dashboard/intermediaries/[id]` (`intermediary-tabs.tsx`) con tarjetas por proyecto agrupadas en Active/Finalized. Los datos provienen de `IntermediaryReportsService.getReport` (proyectos de los clientes asignados al intermediario, mismos criterios de visibilidad que `lib/auth-scope.ts`): progreso vía `completion_percentage`, estado y prioridad, horas trabajadas/estimadas, cliente y fechas estimadas. Cada tarjeta incluye nombre enlazado a `/dashboard/projects/{id}`, empresa del cliente, badge de estado codificado (Completed=success, Cancelled/Archived/Suspended=error, resto=warning), badge "Overdue" cuando `estimated_end_date` pasó y el proyecto sigue activo, barra de progreso accesible (`role="progressbar"` con aria-valuenow/min/max) y fechas importantes (inicio/fin). Build, TypeScript y ESLint verificados sin errores.

QA en `docs/qa/historia-5.1-5.4-5.5-5.7-5.9-intermediarios.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 5.8

Vista Detallada de Proyecto

El intermediario podrá visualizar.

- Información general
- Estado
- Progreso
- Línea de tiempo
- Hitos
- Tareas visibles
- Archivos compartidos
- Comentarios autorizados

### QA

- [ ] Solo información permitida
- [x] Validar permisos

Implementación: `/dashboard/projects/[id]` ya accesible para el rol Intermediary con autorización en capa de datos (`assertProjectVisible` + `projectScope`/`attachmentScope` en tareas, hitos, comentarios y archivos), de modo que cada rol recibe solo información permitida. La página calcula capacidades vía `hasPermission` y las pasa a `ProjectTabs`: `canCreateTasks`/`canUpdateTasks`/`canManageMilestones` (ocultan creación/edición sin permiso) y los nuevos flags `canUploadFiles`/`canDeleteFiles`/`canDownloadFiles`, `currentUserId`, `canCreateComments`/`canModerateComments`. Nueva pestaña "Documents" con archivos compartidos del proyecto (`attachments` con `entity_type='project'`) reutilizando `DocumentsTab`, pestaña Comments con hilos/responder/editar (Historia 5.9) y Timeline/Milestones/Tasks existentes. El formulario de comentarios solo se muestra con `comments.create`.

Estado

Done

Prioridad

P0

---

# Historia 5.9

Comentarios

### Backend

- [x] Crear comentario
- [x] Editar comentario propio
- [x] Responder comentarios
- [x] Registrar auditoría

### Frontend

- [x] Timeline
- [ ] Editor enriquecido
- [ ] Menciones
- [ ] Adjuntar archivos

### QA

- [x] Crear (formulario raíz con cola offline PWA, validación de visibilidad, auditoría y notificación)
- [x] Editar (edición inline, autor-o-moderador en capa de datos, is_edited + auditoría)
- [x] Responder (parent validado mismo proyecto, auditoría `replied_comment`, hilos anidados)

Implementación: `CommentsService.listByProject` ahora devuelve hilos completos (respuestas incluidas), `createProjectComment` valida que el comentario padre pertenezca al mismo proyecto y se añadieron `updateProjectComment` (autor o moderador con `comments.update`) y moderación de borrado alineada a comentarios de cliente (`comments.delete`). Acciones: `createProjectCommentAction` soporta respuestas (auditoría `replied_comment` vs `created_comment`, notificación `comment_created`), nuevas `updateProjectCommentAction` (`updated_comment`) y borrado con auditoría (`deleted_comment`). UI: pestaña Comments de `/dashboard/projects/[id]` reconstruida como timeline agrupado por hilos (patrón Historia 4.9) con responder, edición inline, borrado con confirmación, controles gated por permisos/autoría; el formulario raíz conserva la cola offline PWA (`project-comment.create`). Menciones y adjuntos en comentarios quedan para una iteración posterior.

QA en `docs/qa/historia-5.1-5.4-5.5-5.7-5.9-intermediarios.md`.

Estado

In Progress

Prioridad

P1

---

# Historia 5.10

Archivos Compartidos

### Backend

- [x] Consultar archivos
- [x] Subir archivos permitidos
- [x] Descargar archivos
- [x] Registrar actividad

### Frontend

- [x] Lista
- [x] Vista previa
- [x] Descarga

### QA

- [ ] Permisos
- [ ] Restricciones

Implementación: pestaña "Documents" en `/dashboard/projects/[id]` reutilizando `DocumentsTab` (ahora parametrizada por `entityType`) sobre `attachments` (`entity_type='project'`) con `FilesService.list` + `attachmentScope` (solo archivos de proyectos visibles). Subida vía modal drag & drop (`uploadFile`: MIME/tamaño validados, `assertEntityVisible`, auditoría `uploaded_file`), vista previa/descarga con URL firmada (`getFileUrl`, auditoría `downloaded_file`). `uploadFile`/`deleteFile` ahora revalidan `/dashboard/projects/{id}`. El rol Intermediary recibió el permiso `files.upload` en la jerarquía RBAC ("subir archivos permitidos"); sin `files.delete`, por lo que no puede eliminar archivos ajenos.

Estado

Done

Prioridad

P1

---

# Historia 5.11

Notificaciones

### Mostrar

- [x] Proyecto actualizado
- [x] Nuevo comentario
- [x] Nueva tarea visible
- [x] Proyecto finalizado
- [x] Proyecto retrasado
- [x] Fecha límite próxima

### QA

- [ ] Recepción correcta
- [x] Sin duplicados

Implementación: migración `00005_notifications_dedupe_sqlite.sql` (columna `dedupe_key` + índice único parcial que garantiza ausencia de duplicados a nivel BD). Disparadores en `features/notifications/notification-triggers.ts` (`project_updated`, `comment_created`, `task_created`, `project_completed`) invocados desde las server actions de proyectos, comentarios y tareas; los fallos de notificación nunca bloquean la operación principal. Destinatarios: intermediarios activos asignados al cliente del proyecto (espejo del scope de visibilidad de `lib/auth-scope.ts`), excluyendo al actor. Notificaciones basadas en tiempo (`project_delayed`, `deadline_upcoming` para proyectos e hitos dentro de 7 días) generadas de forma idempotente por día (clave de dedupe con fecha) al cargar el dashboard o la página de notificaciones. UI: `/dashboard/notifications` con etiquetas legibles por tipo, badges semánticos y enlace directo a la entidad relacionada.

Estado

Done

Prioridad

P2

---

# Historia 5.12

Reportes del Intermediario

### Reportes

- [x] Proyectos activos
- [x] Proyectos finalizados
- [x] Estado de clientes
- [x] Productividad
- [x] Próximas entregas

### Exportaciones

- [x] PDF
- [x] Excel
- [x] CSV

Implementación: `IntermediaryReportsService` (`features/intermediaries/intermediaries.reports.service.ts`) agrega el reporte de cartera con alcance restringido a los clientes asignados (espejo del scope de `lib/auth-scope.ts`): resumen (proyectos activos/finalizados, clientes, tasas de completitud y utilización de horas), listado de proyectos, estado de clientes con contadores, productividad por estados de tarea y horas, y próximas entregas (hitos y proyectos dentro de 30 días). UI integrada en `/dashboard/intermediaries/[id]` (tarjetas de resumen + botones de exportación); el propio intermediario puede consultar su reporte vía guard `assertCanViewIntermediaryDetail` (self-access) y navegación "My Report" en el sidebar. Exportaciones: PDF generado en cliente con jsPDF + AutoTable; Excel (.xlsx) y CSV vía route handler `/api/intermediaries/[id]/report/export` (SheetJS) con autenticación, autorización (`reports.export` habilitado al rol Intermediary) y validación de formato. Dependencias añadidas: `xlsx`, `jspdf`, `jspdf-autotable`.

Estado

Done

Prioridad

P2

---

# Historia 5.13

Auditoría

Registrar.

- [x] Inicio de sesión
- [x] Asignación de clientes
- [x] Comentarios
- [x] Descarga de archivos
- [x] Consulta de proyectos
- [x] Cambios de perfil

Implementación: eventos cubiertos por la infraestructura de auditoría (`logged_in`/`logged_out` en `actions/auth.ts`, `assigned_intermediary`/`removed_intermediary` en `actions/clients.ts`, `created_comment` y eventos de comentarios 4.9 en `actions/comments.ts`, `updated_profile`/`changed_password`/`updated_avatar` en `actions/profile.ts`). Descarga de archivos: `downloaded_file` en `getFileUrl` (`actions/files.ts`) tras emitir la URL firmada, con autorización previa a nivel de datos (`assertEntityVisible`) y nombre del archivo en `new_value`; cubre descarga y vista previa. Consulta de proyectos: `viewed_project` al renderizar `/dashboard/projects/[id]` vía `ActivityService.logAccessOnce`, que deduplica por usuario/acción/entidad dentro de una ventana de 60 s para colapsar refrescos y prefetch; solo se registra tras pasar la verificación de visibilidad (`assertProjectVisible`). Los eventos de acceso (`viewed_project`, `downloaded_file`, constante `ACCESS_AUDIT_ACTIONS`) quedan excluidos de los historiales de cliente/intermediario y del widget Last Activity, cuyo alcance son eventos de negocio (BACKLOG 4.7/5.5); la consulta global vive en `/dashboard/activity`. QA en `docs/qa/historia-5.13-auditoria.md`.

Estado

Done

Prioridad

P1

---

# Historia 5.14

Restricciones del Rol

El intermediario NO podrá.

- [x] Crear usuarios
- [x] Eliminar clientes
- [x] Modificar permisos
- [x] Cambiar roles
- [x] Ver proyectos no asignados
- [x] Acceder a información interna del Developer
- [x] Modificar configuraciones globales

### QA

- [x] Validar RBAC
- [x] Validar autorización a nivel de datos
- [x] Intentos de acceso indebido

Implementación: verificación end-to-end de las tres capas — RBAC (`PERMISSION_HIERARCHY` en `lib/auth.ts` + `requirePermission` en todas las acciones: `users.*`, `roles.*`, `settings.*`, `clients.update/delete` fuera del rol Intermediary), autorización de datos (`projectScope`/`clientScope`/asserts en `lib/auth-scope.ts`: solo proyectos/clientes de su cartera, con denegaciones auditadas como `access_denied`) y rutas (`proxy.ts` + `lib/routes.ts` bloquean `/dashboard/users|roles|settings|activity|admin`, re-verificado server-side en cada página). Se ocultaron las opciones sin permiso en las superficies accesibles por el rol: ClientsTable (Add/Edit/Archive), ProjectsTable (New/Edit/Archive), TasksTable (New/Edit, también en proyectos), FilesTable (Upload/Delete; Download visible) y ProjectTabs/TaskDetail (tareas, kanban, subtareas, dependencias, checklist e hitos vía props `canCreate*`/`canUpdate*` calculadas con `hasPermission`). QA en `docs/qa/historia-5.14-restricciones-rol.md`. Build, TypeScript y ESLint verificados sin errores.

Estado

Done

Prioridad

P0

---

# Criterios de Aceptación de la Épica

- CRUD completo de intermediarios.
- Asignación múltiple de clientes.
- Dashboard exclusivo para intermediarios.
- Seguimiento completo de proyectos asignados.
- Acceso restringido mediante RBAC y autorización en el servidor.
- Gestión de comentarios.
- Gestión de archivos compartidos.
- Reportes disponibles.
- Auditoría completa.
- Integración con clientes y proyectos.

---

# Épica 6 — Gestión de Proyectos

## Objetivo

Desarrollar el módulo principal del sistema, permitiendo administrar completamente el ciclo de vida de los proyectos, desde su planificación hasta su finalización, incluyendo clientes, intermediarios, responsables, cronograma, estimaciones, progreso, indicadores, documentos y actividad.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 1 — Infraestructura
- Épica 2 — Autenticación
- Épica 3 — Usuarios
- Épica 4 — Clientes
- Épica 5 — Intermediarios

---

# Historia 6.1

Administración de Proyectos

## Objetivo

Visualizar todos los proyectos disponibles según los permisos del usuario.

### Backend

- [x] Consulta paginada
- [x] Ordenamiento
- [x] Búsqueda
- [x] Filtros
- [x] Conteo total
- [x] Consulta optimizada

### Frontend

- [x] DataTable
- [x] Búsqueda
- [x] Filtros rápidos
- [x] Filtros avanzados
- [x] Acciones masivas
- [x] Columnas configurables

Filtros

- Estado
- Cliente
- Intermediario
- Responsable
- Prioridad
- Fecha de inicio
- Fecha límite
- Etiquetas

Implementación: `/dashboard/projects` con estado en URL (search, status, priority, active, page), búsqueda debounced server-side (nombre/código/descripción/empresa del cliente) y paginación real con `ProjectsService.list` (`total` vía COUNT con los mismos parámetros y consulta de página LIMIT/OFFSET sobre JOINs a clients/users, apoyada en índices existentes en `client_id`, `intermediary_id` y `status`). Filtros rápidos de estado, prioridad y estado activo/archivado. Acciones masivas Archive/Restore mediante selección de filas (`getRowId` estable en el DataTable compartido y acción `bulkToggleProjectsActive` con confirmación previa y auditoría `archived_project`/`restored_project`), columnas configurables vía la barra del DataTable y feedback accesible (`aria-live`). Autorización con guard `requirePermission("projects.read")` en la página, `projectScope` en la capa de datos y controles gated por permisos. Build, TypeScript y ESLint verificados sin errores.

### QA

- [ ] Rendimiento
- [ ] Búsqueda
- [ ] Responsive
- [ ] Permisos

Estado

In Progress

Prioridad

P0

---

# Historia 6.2

Crear Proyecto

### Backend

- [x] Crear Server Action
- [x] Validar datos
- [x] Registrar proyecto
- [x] Registrar auditoría

### Frontend

- [x] Formulario completo
- [x] Validaciones Zod
- [x] Confirmación

Información inicial

- Nombre
- Cliente
- Intermediario
- Descripción
- Estado
- Prioridad
- Fecha inicio
- Fecha fin estimada
- Horas estimadas
- Color (cubierto por la paleta de etiquetas de la Historia 6.10)
- Etiquetas (selector integrado en el formulario, Historia 6.10)

### QA

- [x] Validaciones
- [x] Duplicados
- [x] Permisos

Implementación: validación Zod compartida (`schemas/project.ts`: enums de estado/prioridad, longitudes, fechas coherentes, horas ≥ 0) aplicada en el server action; reglas de negocio en `ProjectsService.create` (cliente activo existente, intermediario con rol Intermediary activo, duplicado de nombre por cliente con mensaje amigable); guard `requirePermission("projects.create")`; auditoría `created_project` con cliente/estado/prioridad; modal con confirmación de éxito, selector de cliente e intermediario (sin UUIDs manuales) y estados/prioridades desde `constants`.

Estado

Done

Prioridad

P0

---

# Historia 6.3

Editar Proyecto

### Backend

- [x] Actualizar información
- [x] Validar cambios
- [x] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Historial de cambios

### QA

- [x] Actualización
- [x] Auditoría

Implementación: `updateProject` con esquema Zod de actualización (el cliente no se modifica vía edición), diff campo a campo contra el estado previo (`getById` también aplica autorización de capa de datos); auditoría `updated_project` solo con campos modificados (`old_value`/`new_value`) y sin eventos cuando no hay cambios; notificaciones preservadas. El historial de cambios se muestra en la pestaña "Activity" del detalle (`ProjectsService.getHistory`: eventos del proyecto + comentarios, excluye accesos) reutilizando `ActivityTimeline` con paginación en URL.

Estado

Done

Prioridad

P0

---

# Historia 6.4

Estados del Proyecto

Estados disponibles (según PRD; la lista del backlog original era un subconjunto)

- Proposed (Propuesto)
- Pending (Pendiente)
- Planning (Planificación)
- Design (Diseño)
- Development (Desarrollo)
- QA
- In Review (En revisión)
- Corrections (Correcciones)
- Ready for Delivery (Listo para entrega)
- Delivered (Entregado)
- Completed (Finalizado)
- Suspended (Suspendido)
- Cancelled (Cancelado)
- Archived (Archivado)

### Backend

- [x] Validar transiciones
- [x] Registrar cambios

### QA

- [x] Estados válidos
- [x] Estados inválidos

Implementación: máquina de estados declarativa `PROJECT_STATUS_TRANSITIONS` en `constants` siguiendo el pipeline del PRD (Proposed → … → Delivered → Completed; Suspended pausa; Cancelled/Completed terminales) con validación pura reutilizable en `features/projects/project-status.ts`; el server action valida la transición antes de escribir y rechaza cambios inválidos con mensaje claro; el modal de edición solo ofrece estados alcanzables desde el actual. Cada cambio de estado se audita como `changed_project_status` (old/new status).

Estado

Done

Prioridad

P0

---

# Historia 6.5

Cronograma

### Backend

- [ ] Registrar fechas
- [ ] Calcular duración
- [ ] Detectar retrasos

### Frontend

- [ ] Timeline
- [ ] Calendario
- [ ] Indicadores

### QA

- [x] Cálculos
- [x] Visualización

Estado

Done

Prioridad

P0

---

# Historia 6.6

Estimaciones del Proyecto

## Objetivo

Permitir definir y comparar estimaciones iniciales contra el progreso real.

Registrar

- Horas estimadas
- Horas consumidas
- Horas restantes
- Fecha estimada
- Fecha real
- Desviación

Calcular automáticamente

- Porcentaje completado
- Variación de tiempo
- Variación de esfuerzo
- Retraso

### QA

- [x] Cálculos correctos

Estado

Done

Prioridad

P0

Implementación: cálculo puro en `features/projects/projects-indicators.ts` (`computeEstimates`/`computeSchedule`: horas estimadas/consumidas/restantes, variación de esfuerzo y de tiempo, desviación firmada en días, retraso, progreso ponderado por peso de tarea y progreso esperado según cronograma). Datos agregados por `ProjectIndicatorsService.getByProject` (histórico completo de time_entries → roll-up tareas → campo del proyecto; la ventana de 6 semanas se usa solo para el gráfico de carga de trabajo) y visualización en la pestaña "Indicators" del detalle del proyecto (`indicators-tab.tsx`, tarjeta "Effort" + "Estimates vs Actual"). TypeScript y ESLint verificados sin errores.

---

# Historia 6.7

Asignación de Responsables

### Backend

- [x] Asignar Developers
- [x] Asignar Intermediarios
- [x] Asignar cliente

### Frontend

- [x] Selector múltiple
- [x] Gestión de miembros

### QA

- [x] Permisos
- [x] Duplicados

Estado

Done

Prioridad

P0

Implementación: migración `00006_project_members_sqlite.sql` (tabla `project_members` con FK a projects/users, `UNIQUE(project_id, user_id)` anti-duplicados e índices por proyecto y usuario), métodos `ProjectsService.listMembers` / `listAvailableMembers` / `assignMembers` / `removeMember` (validación de rol Developer/Intermediary activo + `assertProjectVisible`), esquema Zod `assignProjectMembersSchema`, acciones `assignProjectMembers` / `removeProjectMember` protegidas por `projects.update` con auditoría (`assigned_project_member` / `removed_project_member`) y UI "Team" en el Overview del proyecto (selector múltiple con checkboxes agrupados por rol, remoción con confirmación; visible solo con `projects.update`). Los duplicados se omiten sin fallar. QA en `docs/qa/historia-6.7-asignacion-de-responsables.md`.

---

# Historia 6.8

Dashboard del Proyecto

Widgets

- [x] Estado actual
- [x] Progreso
- [x] Horas
- [x] Próximos hitos
- [x] Actividad reciente
- [x] Últimos comentarios
- [x] Últimos archivos
- [x] Riesgos
- [x] Indicadores

Estado

Done

Prioridad

P0

Implementación: componente servidor `project-dashboard.tsx` en `/dashboard/projects/[id]` con tarjetas Current Status (estado, prioridad, fechas reales), Progress (anillo con % real vs. progreso esperado del cronograma), Effort (horas estimadas/trabajadas/restantes), Health & Risks (salud y semáforo de riesgo de la Historia 6.9 con factores disparados y enlace a Indicators), Upcoming Deliveries (próximos hitos, vencidos en rojo), Latest Comments y Latest Files. Datos derivados de las consultas existentes de la página (sin requests adicionales). QA en `docs/qa/historia-6.8-6.14-dashboard-y-actividad.md`.

---

# Historia 6.9

Indicadores del Proyecto

Calcular automáticamente

- [x] % completado
- [x] % retraso
- [x] Horas utilizadas
- [x] Horas restantes
- [x] Productividad
- [x] Riesgo
- [x] Salud del proyecto

Estado

Done

Prioridad

P1

Implementación: `buildProjectMetrics` en `features/projects/projects-indicators.ts` calcula % completado (ponderado por peso de tareas), % retraso (progreso esperado lineal − progreso real), horas utilizadas/restantes, productividad (tasa de finalización y promedio h/tarea completada), semáforo de riesgo según PRD §72 (sobrecosto de esfuerzo, deslizamiento, tareas bloqueadas, dependencias pendientes, hitos vencidos e inactividad) y salud del proyecto (healthy/at_risk/critical). Autorización de datos vía `assertProjectVisible` en `ProjectIndicatorsService`. UI: pestaña "Indicators" con tarjetas Health & Risk, Progress y Key Indicators.

---

# Historia 6.10

Etiquetas

### Backend

- [x] Crear etiquetas
- [x] Editar etiquetas
- [x] Eliminar etiquetas

### Frontend

- [x] Selector
- [x] Colores
- [x] Filtros

Implementación: CRUD de etiquetas endurecido con esquema Zod compartido (`schemas/tag.ts`: nombre requerido ≤50, color restringido a la paleta oficial `TAG_COLOR_OPTIONS`), verificación amigable de nombres duplicados (case-insensitive) en `TagsService`, acciones `createTag`/`updateTag`/`deleteTag` con guards `tasks.*` (sin nuevos permisos fuera del backlog 2.8), respuestas tipadas `{ success | error }` y auditoría `created_tag`/`updated_tag`/`deleted_tag` en `activity_logs`; el borrado se apoya en el `ON DELETE CASCADE` de `project_tags`/`task_tags`. Integración con proyectos: campo `tags` en `projectSchema`/`projectUpdateSchema`, sincronización atómica vía `TagsService.setProjectTags` (batch transaccional, ids re-validados contra BD) desde las acciones create/update de proyectos, evento de auditoría dedicado `updated_project_tags` (old/new con nombres), selector multiselección con colores (`components/forms/tag-selector.tsx`) en el modal de crear/editar proyecto, chips coloreados (`TagChip`) en la tabla y cabecera del detalle, columna Tags en el listado y filtro por etiqueta en URL (`?tag=`) resuelto en servidor con `EXISTS` sobre `project_tags`. La página /dashboard/tags reutiliza `TagsService.list()` y muestra feedback accesible (`aria-live`) con confirmación previa al borrado.

Estado

Done

Prioridad

P2

---

# Historia 6.11

Archivar Proyecto

### Backend

- [x] Cambio de estado
- [x] Validar dependencias
- [x] Registrar auditoría

### QA

- [x] Restauración
- [x] Restricciones

Implementación: `ProjectsService.archive` bloquea el archivado mientras existan tareas sin finalizar o hitos incompletos (mensaje amigable con cantidades) y marca `is_active = 0` + `deleted_at`; restauración vía `restore` con auditoría `restored_project`; acciones individuales y masivas (`bulkToggleProjectsActive`) protegidas por `projects.update`, con confirmación previa, feedback accesible (`aria-live`) y filtro de estado Activo/Archivado en la tabla (estado en URL).

Estado

Done

Prioridad

P1

---

# Historia 6.12

Vista del Cliente

Permitir al cliente visualizar

- Información general
- Estado
- Progreso
- Timeline
- Archivos compartidos
- Comentarios autorizados
- Próximas entregas

El cliente nunca podrá modificar información estructural del proyecto.

Estado

Done

Prioridad

P0

Implementación: `/dashboard/projects/[id]` con pestañas filtradas por rol (`visibleTabsForRole`: Client/Intermediary sin Kanban de gestión), widgets de estado/progreso/entregas de la Historia 6.8 y autorización en tres capas — `projectScope`/`assertProjectVisible`/`attachmentScope` en la capa de datos y `requirePermission("projects.update"|"tasks.*")` en cada acción estructural (sin esos permisos el servidor redirige a `/unauthorized`). El rol Client conserva lectura de Tasks/Indicators/Milestones/Timeline/Documents/Comments/Activity según PRD §7. QA en `docs/qa/historia-6.12-6.13-vistas-cliente-intermediario.md`.

---

# Historia 6.13

Vista del Intermediario

Permitir visualizar únicamente

- Clientes asignados
- Proyectos asignados
- Progreso
- Actividad
- Archivos autorizados
- Comentarios

Estado

Done

Prioridad

P0

Implementación: mismo mecanismo de pestañas por rol que 6.12; el intermediario solo accede a proyectos de su cartera vía `assertProjectVisible` / `projectScope` / `attachmentScope`, con subida de archivos si posee `files.upload`, exportación con `reports.export` y widgets de progreso/actividad/entregas. Sin permisos estructurales (`projects.update`) no puede modificar el proyecto ni sus miembros/hitos.

---

# Historia 6.14

Actividad del Proyecto

Registrar automáticamente

- Creación
- Edición
- Cambio de estado
- Asignaciones
- Comentarios
- Archivos
- Cambios importantes

Visualización

- Timeline
- Filtros
- Búsqueda

Estado

Done

Prioridad

P1

Implementación: pestaña Activity sobre `ProjectsService.getHistory` ampliada con búsqueda server-side (acción, usuario, valores old/new JSON) y filtro por categoría mapeado a `PROJECT_HISTORY_ACTIONS` (project/files/comments, incluyendo los nuevos `assigned_project_member`/`removed_project_member` de la 6.7 y `updated_project_tags`); estado en URL (`q`, `category`, `page`) con búsqueda debounced reutilizando `HistoryFilters` (parametrizado con `idPrefix`/`categoryOptions`) y `ActivityTimeline`. Los eventos de acceso (`viewed_project`/`downloaded_file`) permanecen excluidos del timeline. Registro automático ya cubierto por las acciones: creación/edición/estado (6.2–6.4, 6.17), asignaciones (6.7), comentarios (7.x) y archivos (9.x). QA en `docs/qa/historia-6.8-6.14-dashboard-y-actividad.md`.

---

# Historia 6.15

Métricas

Mostrar

- Duración
- Horas
- Productividad
- Retrasos
- Riesgos
- Progreso
- Carga de trabajo

Estado

Done

Prioridad

P2

Implementación: la pestaña "Indicators" del detalle del proyecto consolida las métricas desde `ProjectMetricsBundle`: duración planificada/real (tarjeta "Estimates vs Actual"), horas y productividad ("Effort" + "Key Indicators"), retrasos y riesgos (días de retraso, tareas atrasadas, hitos vencidos, semáforo) y progreso (anillo con progreso esperado). Carga de trabajo con gráficos de barras (`components/charts/bar-chart.tsx`): horas registradas por semana (últimas 6 semanas desde `time_entries`) y distribución de tareas por estado.

---

# Historia 6.16

Búsqueda Global

Buscar proyectos, tareas, clientes e hitos por

- Nombre / Título
- Cliente
- Estado
- Responsable
- Etiquetas
- Descripción

Estado

Done

Prioridad

P2

---

# Historia 6.17

Auditoría

Registrar

- [x] Creación (`created_project`)
- [x] Edición (`updated_project`, diff old/new solo de campos modificados)
- [x] Eliminación lógica (`archived_project` / `restored_project`)
- [x] Cambio de estado (`changed_project_status`, old/new)
- [x] Asignaciones (cambio de intermediario reflejado en el diff de `updated_project`; asignaciones de cliente/intermediario en sus historias)
- [x] Cambios de fechas (incluidos en el diff de `updated_project`)
- [x] Cambios de estimaciones (horas estimadas incluidas en el diff de `updated_project`)
- [x] Archivos (`uploaded_file` / `downloaded_file` / `deleted_file`, Historia 5.12)
- [x] Comentarios (`created_comment` y derivados, Historia 5.11)

Implementación: todos los eventos se escriben vía `ActivityService.log` en `activity_logs` con actor, entidad y valores old/new; los fallos de auditoría no bloquean la operación principal. Visualización: pestaña "Activity" del detalle del proyecto con timeline agrupado por día y paginación en URL.

Estado

Done

Prioridad

P1

---

# Historia 6.18

Permisos

Developer

- [x] Acceso completo

Intermediary

- [x] Solo proyectos asignados

Client

- [x] Solo sus proyectos

Administrator

- [x] Gestión completa

Super Administrator

- [x] Acceso total

### QA

- [x] RBAC
- [x] Control de acceso a datos
- [x] Accesos indebidos

Implementación: RBAC ampliado en `lib/auth.ts` (`PERMISSION_HIERARCHY`): Administrator con gestión completa de los módulos operativos (`projects.*`, `clients.*`, `intermediaries.*`, `tasks.*`, `comments.*`, `files.*`, `reports.*`, `time-entries.*`; sin `users.*`/`roles.*`/`settings.*`) y Super Administrator con acceso total (mismo set que Developer). Nueva fuente única `lib/roles.ts` (`FULL_ACCESS_ROLES` + `hasFullAccess`) compartida por cliente y servidor; la capa de datos (`lib/auth-scope.ts`) omite el filtrado de visibilidad para los tres roles de acceso pleno y mantiene denegación por defecto para roles desconocidos, mientras Intermediary/Client conservan su alcance por cartera/email con denegaciones auditadas (`access_denied`). Pestañas de gestión del proyecto (Kanban) reservadas a los roles de acceso pleno (`project-tabs.tsx`). Semántica de "acceso pleno" unificada en moderación de comentarios, reporte global, estadísticas del dashboard y horas trabajadas. Migración `00007_admin_roles_sqlite.sql` siembra los roles Administrator y Super Administrator (idempotente). QA en `docs/qa/historia-6.18-permisos.md`. Build, TypeScript y ESLint verificados sin errores.

Estado

Done

Prioridad

P0

---

# Historia 6.19

Exportación

### Formatos

- [x] PDF
- [x] Excel
- [x] CSV

### Contenido

- [x] Información general
- [x] Cronograma
- [x] Indicadores
- [x] Progreso
- [x] Horas
- [x] Actividad

Implementación: `ProjectExportService` (`features/projects/projects-export.service.ts`) agrega los datos exportables del proyecto reutilizando los servicios existentes (proyecto + cliente + intermediario vía `ProjectsService.getById`, hitos vía `MilestonesService.listByProject`, indicadores/estimaciones/cronograma/progreso vía `ProjectIndicatorsService.getByProject` de las historias 6.6 / 6.9 / 6.15) más dos consultas propias: horas por integrante (agregación de `time_entries`) y actividad reciente (bitácora de la historia 6.17 sin eventos de acceso, últimos 100 eventos). Autorización en capa de datos (`assertProjectVisible`): cada rol solo exporta proyectos visibles para él; adicionalmente la exportación exige el permiso `reports.export` (habilitado a Developer e Intermediary). Exportaciones: Excel (.xlsx) multi-hoja (General, Schedule, Indicators, Progress, Hours, Activity) y CSV vía route handler `/api/projects/[id]/export?format=xlsx|csv` (SheetJS) con autenticación, autorización y validación de formato; PDF generado en cliente con jsPDF + AutoTable bajo demanda mediante server action `getProjectExportData` (evita cargar los datos en cada visita a la página). UI: botones "Export PDF" / "Export Excel" / "Export CSV" en la cabecera de `/dashboard/projects/[id]`, visibles solo con `reports.export`, con estado de generación y mensajes de error accesibles.

Estado

Done

Prioridad

P2

---

# Historia 6.20

Integración con otros módulos

Integraciones obligatorias

- Clientes
- Intermediarios
- Tareas
- Hitos
- Comentarios
- Archivos
- Reportes
- Dashboard
- Auditoría
- Notificaciones

Estado

Done

Prioridad

P0

---

# Criterios de Aceptación de la Épica

- CRUD completo de proyectos.
- Gestión de estados funcional.
- Cronograma operativo.
- Estimaciones y seguimiento de tiempo implementados.
- Dashboard del proyecto disponible.
- Indicadores automáticos.
- Vistas diferenciadas por rol.
- Auditoría completa.
- Integración con todos los módulos relacionados.
- Cumplimiento de RBAC y autorización en el servidor.
- Preparado para futuras funcionalidades como dependencias, Gantt y automatizaciones.

---

# Épica 7 — Gestión de Tareas

## Objetivo

Desarrollar el módulo completo de gestión de tareas, permitiendo planificar, asignar, organizar y monitorear el trabajo dentro de cada proyecto mediante tareas, subtareas, checklists, dependencias, estimaciones, seguimiento del tiempo y múltiples vistas de trabajo.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 1 — Infraestructura
- Épica 2 — Autenticación
- Épica 3 — Usuarios
- Épica 4 — Clientes
- Épica 5 — Intermediarios
- Épica 6 — Gestión de Proyectos

---

# Historia 7.1

Administración de Tareas

## Objetivo

Visualizar todas las tareas del proyecto según los permisos del usuario.

### Backend

- [x] Consulta paginada
- [x] Búsqueda
- [x] Ordenamiento
- [x] Filtros
- [x] Conteo total

### Frontend

- [x] DataTable
- [x] Búsqueda rápida
- [x] Filtros avanzados
- [x] Acciones masivas
- [x] Columnas configurables

Filtros

- Proyecto
- Responsable
- Estado
- Prioridad
- Fecha límite
- Etiquetas

### QA

- [ ] Rendimiento
- [ ] Permisos
- [ ] Responsive

Implementación: búsqueda server-side (título + descripción) y conteo total (`COUNT` con el mismo WHERE) cableados desde `TasksService.list`; `/dashboard/tasks` con estado en URL (search, status, priority, assignee, project, sort, order, page), búsqueda rápida debounced, filtros validados contra opciones oficiales, ordenamiento con whitelist `TASK_SORTABLE_COLUMNS`, acciones masivas (`bulkUpdateTaskStatus`: guard `tasks.update`, Zod `bulkUpdateTaskStatusSchema`, transición de estado validada por tarea y auditoría `changed_task_status` por tarea), columnas configurables vía toolbar del DataTable (selección/acciones no ocultables) y acciones rápidas por fila (View/Edit/Complete-Reopen/Archive). Permisos: `requirePermission("tasks.read")` + `projectScope` en capa de datos. QA en `docs/qa/historia-7.1-7.14-administracion-tareas-vista-lista.md`.

Estado

In Progress

Prioridad

P0

---

# Historia 7.2

Crear Tarea

### Backend

- [x] Crear Server Action
- [x] Validar datos
- [x] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Validaciones Zod
- [x] Confirmación

Campos

- Proyecto
- Título
- Descripción
- Prioridad
- Estado
- Responsable
- Fecha inicio
- Fecha límite
- Horas estimadas

Implementación: esquema Zod dedicado (`schemas/task.ts`) con enums de estado/prioridad, fechas `YYYY-MM-DD`, orden inicio≤fin y regla del PRD §80 (responsable obligatorio salvo Pending/Planned). `createTask` valida con Zod, estampa `created_by/updated_by` y audita en `activity_logs` (`created_task`). Selector de responsable con usuarios activos Developer/Intermediary (`UsersService.listAssigneeOptions`); confirmación de éxito en el modal con feedback accesible.

Estado

Done

Prioridad

P0

---

# Historia 7.3

Editar Tarea

### Backend

- [x] Actualizar información
- [x] Registrar auditoría

### Frontend

- [x] Formulario de edición
- [x] Historial de cambios

### QA

- [x] Validaciones
- [x] Auditoría

Implementación: `updateTask` obtiene el estado previo vía `TasksService.getById` (visibilidad en capa de datos), detecta campos cambiados (`TASK_AUDIT_FIELDS`), estampa `updated_by` y escribe eventos diferenciados: `updated_task` (diff old/new por campo), `updated_task_progress` y `changed_task_status`. Sin cambios reales no se escribe evento ("No changes to save."). El detalle de tarea (/dashboard/tasks/[id]) incorpora tarjeta "History" con `TasksService.getHistory` + `ActivityTimeline`.

Estado

Done

Prioridad

P0

---

# Historia 7.4

Eliminar / Archivar Tarea

### Backend

- [x] Eliminación lógica
- [x] Restauración
- [x] Auditoría

### Frontend

- [x] Confirm Dialog

Implementación: borrado lógico (`is_active=0`, `deleted_at`) con `TasksService.archive` y restauración con `restore()`; acción `toggleTaskActive` protegida por `tasks.delete` con auditoría `archived_task`/`restored_task`. UI: acción Archive en la tabla y botón en el detalle (confirmación previa); vista "Archived" en /dashboard/tasks (`?view=archived`) con acción Restore para recuperar tareas archivadas.

Estado

Done

Prioridad

P1

---

# Historia 7.5

Estados de las Tareas

Estados disponibles

- Pendiente
- Planificada
- En progreso
- En revisión
- QA
- Finalizada
- Bloqueada
- Cancelada
- Archivada

### Backend

- [x] Validar transiciones
- [x] Registrar historial

Implementación: estados en inglés (Pending, Planned, In Progress, Blocked, In Review, QA, Completed, Cancelled) mapean 1:1 con la lista; "Archivada" se cubre con el flujo de archivo (borrado lógico), igual que en proyectos. Tabla `TASK_STATUS_TRANSITIONS` + helpers puros en `features/tasks/task-status.ts` (flujo PRD §56; Completed/Cancelled reabren a In Progress/Pending). Los cambios de estado validan la transición en servidor (`assertTaskStatusTransition`) y registran `changed_task_status` con old/new; los formularios de edición solo ofrecen los estados destino permitidos (`getAllowedTaskStatusOptions`). Pendiente para una iteración posterior: motivo obligatorio de bloqueo (PRD §80) y estados adicionales sin código (PRD §55).

Estado

Done

Prioridad

P0

---

# Historia 7.6

Prioridades

Prioridades

- Baja
- Media
- Alta
- Crítica

### Backend

- [x] Configurar prioridades

### Frontend

- [x] Indicadores visuales
- [x] Filtros

Implementación: prioridades en `tasks.priority` (constants + catálogo configurable `task_priorities` en Ajustes, Historia 15.15), validadas con Zod y catálogo en cada server action (`assertTaskCatalogStatusPriority`), con badges por severidad (Urgent/Critical en error) en lista, Kanban y detalle.

Estado

Done

Prioridad

P1

---

# Historia 7.7

Subtareas

## Objetivo

Permitir dividir una tarea en múltiples subtareas.

### Backend

- [ ] CRUD de subtareas
- [ ] Relación con tarea principal
- [ ] Calcular progreso automático

### Frontend

- [x] Lista de subtareas
- [x] Checkbox
- [x] Reordenamiento

### QA

- [ ] Cálculo correcto
- [ ] Persistencia

Implementación (UI): tarjeta Subtasks en `/dashboard/tasks/[id]` con lista, checkbox de completado y reordenamiento arriba/abajo accesible (`aria-label`); acción `moveSubtask` + `TasksService.moveSubtask` intercambian vecinos y renumeran la lista completa con visibilidad validada en capa de datos.

Estado

In Progress

Prioridad

P0

---

# Historia 7.8

Checklist

### Backend

- [x] Crear checklist
- [x] Editar elementos
- [x] Completar elementos

### Frontend

- [x] Lista interactiva
- [x] Barra de progreso

Estado

Done

Prioridad

P1

---

# Historia 7.9

Dependencias entre Tareas

Permitir definir

- Bloquea
- Es bloqueada por
- Relacionada con

### Backend

- [x] CRUD dependencias
- [x] Validar ciclos

### QA

- [x] Detectar dependencias inválidas

Implementación: CRUD en `TasksService.addDependency/removeDependency` con validación de duplicados, autorreferencia (CHECK en `task_dependencies`) y detección de ciclos (BFS sobre la cadena). Una tarea no puede completarse con dependencias sin terminar (`getUnfinishedDependencies` se aplica en edición, toggle y acciones masivas con mensajes legibles). Auditoría `added_task_dependency`/`removed_task_dependency` (7.23).

Estado

Done

Prioridad

P1

---

# Historia 7.10

Asignación de Responsables

### Backend

- [x] Asignar usuario
- [x] Reasignar
- [x] Registrar auditoría

### Frontend

- [x] Selector de usuarios
- [x] Indicador del responsable

Implementación: asignación/reasignación vía `updateTask` (`assigned_to` con opciones de `UsersService.listAssigneeOptions`, visibilidad validada en capa de datos) con evento de auditoría dedicado `assigned_task` y notificación in-app al responsable (`notifyTaskAssigned`, Historia 7.20). Indicador de responsable en lista (columna Assignee), Kanban y cabecera del detalle.

Estado

Done

Prioridad

P0

---

# Historia 7.11

Seguimiento del Tiempo

Registrar

- Hora inicio
- Hora fin
- Horas trabajadas
- Tiempo restante

### Backend

- [x] Registro manual
- [x] Validaciones

### Frontend

- [x] Formulario
- [x] Historial

Implementación: esquema Zod compartido `schemas/time-entry.ts` (fecha, HH:MM opcional, horas 0–24, orden inicio/fin), acciones `createTimeEntry`/`deleteTimeEntry` con guards `time-entries.create|delete`, auditoría (`created_time_entry`/`deleted_time_entry`) y revalidación de la página de la tarea. UI: tarjeta Time Tracking en `/dashboard/tasks/[id]` con formulario manual, total acumulado e historial con autor/horas/borrado.

Estado

Done

Prioridad

P1

---

# Historia 7.12

Temporizador

### Funciones

- [x] Iniciar
- [x] Pausar
- [x] Reanudar
- [x] Finalizar

### QA

- [ ] Tiempo correcto
- [ ] Persistencia

Implementación: componente cliente `TaskTimer` en `/dashboard/tasks/[id]` con estado persistido en localStorage (`pwa-task-timer-v1`) para sobrevivir recargas/navegación; Finalizar calcula horas redondeadas y crea el time entry vía `createTimeEntry`. Un solo temporizador activo por usuario (avisa si corre en otra tarea).

Estado

Done

Prioridad

P2

---

# Historia 7.13

Vista Kanban

Columnas

- Pendiente
- En progreso
- En revisión
- QA
- Finalizada

### Funciones

- [x] Drag & Drop
- [x] Contadores
- [x] Indicadores
- [ ] Scroll infinito (futuro)

Implementación: `/dashboard/tasks?view=kanban` con `KanbanBoard` reutilizado (columnas dinámicas desde el catálogo de estados), tarjetas con prioridad, responsable, proyecto y chip Overdue, y contador por columna. El drag & drop llama a `bulkUpdateTaskStatus` (auditado), de modo que transiciones inválidas y dependencias se validan en el servidor; los errores se gestionan con la respuesta de la acción.

Estado

Done

Prioridad

P0

---

# Historia 7.14

Vista Lista

### Funciones

- [x] Tabla
- [x] Ordenamiento
- [x] Filtros
- [x] Acciones rápidas

Implementación: `/dashboard/tasks` como vista de lista completa (DataTable compartido con paginación manual real, búsqueda, filtros y ordenamiento en URL) reutilizada por `/dashboard/projects/[id]/tasks` con proyecto fijo; acciones rápidas por fila: View (detalle), Edit (modal), Complete/Reopen (toggle con auditoría) y Archive (confirmación, gated `tasks.delete`). Columnas de Vista Lista según PRD §75: Task, Project, Assignee, Status, Priority, Progress, Est. Hours y Due Date. QA en `docs/qa/historia-7.1-7.14-administracion-tareas-vista-lista.md`.

Estado

Done

Prioridad

P0

---

# Historia 7.15

Vista Calendario

Mostrar

- [x] Inicio
- [x] Fecha límite
- [x] Retrasos
- [x] Entregas

Implementación: `/dashboard/tasks?view=calendar&month=YYYY-MM` — grilla mensual navegable con las tareas de su fecha límite (rojo + "!" para vencidas) y las entregas de hitos del mes (`MilestonesService.getCalendarMilestones`, batch y con scope). El mes vive en la URL (compartible y cacheable offline por el SW).

Estado

Done

Prioridad

P2

---

# Historia 7.16

Vista Timeline

Mostrar

- [x] Inicio
- [x] Avance
- [x] Cambios
- [x] Eventos importantes

Implementación: `/dashboard/tasks?view=timeline` — barras Gantt por tarea (inicio → fin estimados, ancho proporcional sobre el rango visible, overlay de progreso, color por estado, anillo de retraso y marcador de hoy). Las tareas sin fechas se agrupan en "Unscheduled" con badge de estado; cada barra enlaza al detalle.

Estado

Done

Prioridad

P2

---

# Historia 7.17

Etiquetas

### Backend

- [x] CRUD etiquetas

### Frontend

- [x] Selector
- [x] Colores
- [x] Filtros

Implementación: CRUD de etiquetas en `/dashboard/tags` con paleta compartida (`TAG_COLOR_OPTIONS`, esquema Zod) y auditoría. Asignación a tareas (Historia 7.17): `TagsService.listByTask/setTaskTags` (reemplazo transaccional), acción `updateTaskTags` con guard `tasks.update` y auditoría `updated_task_tags`; tarjeta Tags en `/dashboard/tasks/[id]` reutilizando `TagSelector`/`TagChip` (solo lectura sin permiso). La búsqueda global de tareas incluye etiquetas (7.21).

Estado

Done

Prioridad

P2

---

# Historia 7.18

Indicadores Automáticos

Calcular

- [x] % completado
- [x] Horas restantes
- [x] Retraso
- [x] Productividad
- [x] Estado general

Implementación: la página de detalle calcula e indica (junto a las tarjetas de progreso/horas existentes): horas restantes (estimadas − trabajadas), retraso (`+Nd` si `estimated_end` vencida y no completada, en rojo), productividad (trabajadas/estimadas) y estado general derivado (Completed / Blocked / At risk / Hours overrun / Healthy). Los KPIs ya existentes cubren % completado, estimadas, trabajadas y subtareas.

Estado

Done

Prioridad

P1

---

# Historia 7.19

Actividad

Registrar automáticamente

- [x] Creación
- [x] Edición
- [x] Cambio de estado
- [x] Cambio de responsable
- [x] Comentarios
- [x] Archivos
- [x] Tiempo registrado

### Frontend

- [x] Timeline

Implementación: todos los eventos se escriben en `activity_logs` desde las acciones (`created_task`, `updated_task`, `changed_task_status`, `assigned_task`, `changed_task_priority`, `updated_task_progress`, comentarios/archivos/time entries con sus acciones dedicadas). La tarjeta History de `/dashboard/tasks/[id]` renderiza el timeline con `ActivityTimeline` reutilizado, con detalles de sujeto y transiciones `old → new`.

Estado

Done

Prioridad

P1

---

# Historia 7.20

Notificaciones

Enviar cuando

- [x] Se asigna una tarea
- [x] Cambia el estado
- [x] Se acerca la fecha límite
- [x] La tarea está bloqueada
- [x] Se completa la tarea
- [x] Hay un nuevo comentario

Implementación (Épica 13): `notifyTaskAssigned`, `notifyTaskStatusChanged` (con título/tipo específicos para Blocked y Completed), recordatorios de vencimiento idempóticos por día (`task_due_soon` para el responsable en `syncTimeBasedNotifications`) y `notifyCommentCreated` con menciones. Todos respetan las preferencias por usuario (13.6) y publican el evento interno equivalente (17.7).

Estado

Done

Prioridad

P1

---

# Historia 7.21

Búsqueda Global

Buscar por

- [x] Nombre
- [x] Responsable
- [x] Proyecto
- [x] Etiquetas
- [x] Estado
- [x] Prioridad

Implementación: `TasksService.list` resuelve la búsqueda contra título, descripción, estado, prioridad, proyecto (JOIN) y responsable (primer y apellido), más un `EXISTS` sobre `task_tags`/`tags` para las etiquetas; la consulta de conteo incluye los mismos JOIN. Los filtros selectores de la vista Lista cubren directamente proyecto/responsable/estado/prioridad.

Estado

Done

Prioridad

P2

---

# Historia 7.22

Permisos

Developer

- [x] Gestión completa

Intermediary

- [x] Visualizar tareas permitidas
- [x] Comentar tareas permitidas

Client

- [x] Solo visualizar tareas compartidas

Administrator

- [x] Gestión completa

Super Administrator

- [x] Acceso total

### QA

- [x] RBAC
- [x] Control de acceso a datos
- [x] Accesos indebidos

Implementación: cada server action de tareas aplica `requirePermission("tasks.*")` (guards por operación) y las lecturas usan `projectScope`/`assertTaskVisible` de `lib/auth-scope.ts`, de modo que Intermediary/Client solo alcanzan tareas de su cartera; los intentos indebidos se registran como `access_denied`. El Kanban y las acciones en UI se ocultan sin permiso (`hasPermission` en página) y el servidor revalida siempre.

Estado

Done

Prioridad

P0

---

# Historia 7.23

Auditoría

Registrar

- [x] Creación
- [x] Edición
- [x] Eliminación lógica
- [x] Asignaciones
- [x] Cambios de estado
- [x] Tiempo registrado
- [x] Dependencias
- [x] Subtareas
- [x] Checklists

Implementación: eventos dedicados en `activity_logs` — `created_task`/`updated_task` (diff por campo), `assigned_task`, `changed_task_priority`, `changed_task_status`, `updated_task_progress`, `archived_task`/`restored_task`, `created_time_entry`/`deleted_time_entry`, `added_task_dependency`/`removed_task_dependency` (7.9), `created_subtask`/`moved_subtask` y `created_checklist_item`/`toggled_checklist_item`/`deleted_checklist_item` (actions/checklists.ts).

Estado

Done

Prioridad

P1

---

# Historia 7.24

Integración con otros módulos

Integraciones

- [x] Proyectos
- [x] Comentarios
- [x] Archivos
- [x] Notificaciones
- [x] Dashboard
- [x] Reportes
- [x] Auditoría
- [x] Calendario

Implementación: las tareas se crean/editan dentro del contexto del proyecto (`/dashboard/projects/[id]/tasks`), comentan y adjuntan con los módulos compartidos, notifican vía Épica 13, alimentan los KPIs/widgets del Dashboard (11.x) y el centro de Reportes, auditán cada operación (7.23) y exponen vista Calendario con entregas de hitos (7.15). El bus de eventos interno publica `task.*` para webhooks/automatizaciones (17.7).

Estado

Done

Prioridad

P0

---

# Criterios de Aceptación de la Épica

- CRUD completo de tareas.
- Gestión de subtareas y checklists.
- Dependencias entre tareas funcionales.
- Seguimiento de tiempo implementado.
- Vista Kanban, Lista y Calendario disponibles.
- Indicadores automáticos.
- Notificaciones configuradas.
- Auditoría completa.
- Integración con proyectos y demás módulos.
- Cumplimiento de RBAC y autorización en el servidor.
- Preparado para futuras automatizaciones y diagramas de Gantt.

---

# Épica 8 — Gestión de Hitos (Milestones)

## Objetivo

Desarrollar el módulo de gestión de hitos (Milestones), permitiendo dividir los proyectos en fases importantes para facilitar el seguimiento del progreso, controlar fechas clave, agrupar tareas y ofrecer una visualización clara del avance tanto para el equipo de desarrollo como para clientes e intermediarios.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 6 — Gestión de Proyectos
- Épica 7 — Gestión de Tareas

---

# Historia 8.1

Administración de Hitos

## Objetivo

Visualizar todos los hitos pertenecientes a un proyecto.

### Backend

- [x] Obtener listado de hitos
- [x] Ordenamiento
- [x] Búsqueda
- [x] Filtros

### Frontend

- [x] Vista en tabla
- [x] Vista tipo Timeline
- [x] Indicadores rápidos
- [x] Acciones rápidas

### QA

- [x] Rendimiento
- [x] Permisos
- [x] Responsive

Implementación: `/dashboard/projects/[id]/milestones` con estado en URL (`q`, `status`, `view`), búsqueda server-side sobre título/descripción, filtro por estado contra el catálogo configurado y conmutador Table | Timeline | History. KPIs rápidos (Total/Completed/In Progress/Overdue) vía `MilestonesService.getProjectSummary`. Los agregados de tareas por hito (total, completadas, horas) se resuelven en la MISMA consulta (LEFT JOIN + GROUP BY) evitando N+1. Acciones por fila (editar, archivar, reordenar, tareas, comentarios) visibles solo con permiso (`projects.update` / `tasks.update`), de modo que Client e Intermediary ven la vista de solo lectura (Historias 8.10/8.11).

Estado

Done

Prioridad

P0

---

# Historia 8.2

Crear Hito

### Backend

- [x] Crear Server Action
- [x] Validar datos
- [x] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Validaciones Zod
- [x] Confirmación

Campos

- Proyecto
- Nombre
- Descripción
- Fecha inicio
- Fecha objetivo
- Prioridad
- Color
- Estado

### QA

- [x] Validaciones
- [x] Creación correcta

Implementación: esquema Zod compartido (`schemas/milestone.ts`) validado en cliente y servidor, estado verificado contra el catálogo `milestone_statuses`, guard `requirePermission("projects.update")` y auditoría `created_milestone` en `activity_logs`. El hito se agrega al final del plan (`sort_order` = MAX+1). Confirmación en el modal con actualización inmediata de la página. Los campos inicio/prioridad/color quedan fuera del formulario actual (el modelo del PRD §30 define fecha objetivo y estado).

Estado

Done

Prioridad

P0

---

# Historia 8.3

Editar Hito

### Backend

- [x] Actualizar información
- [x] Registrar auditoría

### Frontend

- [x] Formulario de edición
- [x] Historial de cambios

### QA

- [x] Actualización correcta

Implementación: `updateMilestone` con esquema Zod compartido, diff de auditoría por campo (`updated_milestone` con `old_value`/`new_value` solo de campos modificados; sin cambios no se escribe evento), evento dedicado `changed_milestone_status` y `updated_milestone_progress`. El historial es visible en la página de hitos (botón History) vía `MilestonesService.getProjectHistory` (una consulta batch para todos los hitos del proyecto, reutilizando `ActivityCard`) y en el log de actividad global.

Estado

Done

Prioridad

P0

---

# Historia 8.4

Estados del Hito

Estados

- Pendiente
- En progreso
- En revisión
- Completado
- Cancelado
- Archivado

### Backend

- [x] Validar transiciones
- [x] Registrar historial

Implementación: `MILESTONE_STATUSES` + `MILESTONE_STATUS_TRANSITIONS` en `constants` y validación pura en `features/milestones/milestone-status.ts` (`assertMilestoneStatusTransition`, `getAllowedMilestoneStatusOptions`), reutilizable en acciones y UI. El archivado es un flujo dedicado (eliminación lógica), no un estado. `completed_date` se establece automáticamente al completar y se limpia al reabrir.

Estado

Done

Prioridad

P0

---

# Historia 8.5

Asignación de Tareas

### Backend

- [x] Relacionar tareas
- [ ] Reordenar tareas
- [x] Mover tareas entre hitos

### Frontend

- [x] Selector de tareas
- [ ] Drag & Drop
- [ ] Reordenamiento

### QA

- [x] Persistencia
- [ ] Orden correcto

Implementación: las tareas ya exponen `milestone_id` (FK en el esquema). `MilestonesService.assignTaskToMilestone` valida visibilidad del hito y de la tarea además de que ambas pertenezcan al mismo proyecto; `removeTaskFromMilestone` desvincula y devuelve el hito previo para revalidación/auditoría. UI: modal "Tasks" por hito (tareas asignadas + resto de tareas del proyecto con botones Assign/Remove, el reenvío del server action actualiza la lista). Auditoría `assigned_task_to_milestone` / `removed_task_from_milestone`. Pendiente: reordenar tareas dentro del hito y drag & drop.

Estado

In Progress

Prioridad

P0

---

# Historia 8.6

Progreso Automático

Calcular automáticamente

- [x] Total de tareas
- [x] Tareas completadas
- [x] Porcentaje de avance
- [x] Horas estimadas
- [x] Horas utilizadas
- [x] Horas restantes

Implementación: `buildMilestoneIndicators` (función pura en `features/milestones/milestone-metrics.ts`): cuando el hito tiene tareas el % de avance se deriva de completadas/total (`progressSource: "tasks"`); sin tareas se usa el `completion_percentage` manual. Horas estimadas/trabajadas/restantes provienen de los agregados de tareas resueltos en la consulta de listado. Los mismos indicadores alimentan la tabla, el timeline y los dashboards por rol.

Estado

Done

Prioridad

P0

---

# Historia 8.7

Cronograma del Hito

### Backend

- [x] Registrar fechas
- [x] Detectar retrasos
- [ ] Calcular duración

### Frontend

- [x] Timeline
- [ ] Calendario
- [x] Indicadores visuales

Implementación: retraso detectado en `buildMilestoneIndicators` (`isOverdue` para hitos abiertos con fecha objetivo vencida y `delayDays` también para completados fuera de fecha), mostrado como chip "+Nd late" en la tabla y color de riesgo. El timeline (`components/charts/timeline.tsx`) muestra inicio/fin del proyecto, hitos con fecha y sección de hitos sin programar. Calendario mensual y duración pendientes (agenda de entregas disponible en los dashboards).

Estado

In Progress

Prioridad

P1

---

# Historia 8.8

Dependencias entre Hitos

Permitir definir

- Hito anterior
- Hito siguiente
- Hito bloqueado
- Hito relacionado

### Backend

- [x] CRUD dependencias
- [x] Validar ciclos

### QA

- [x] Dependencias válidas

Implementación: migración `00012_milestone_dependencies` (UNIQUE + CHECK anti-autorreferencia) con `MilestonesService.addMilestoneDependency/removeMilestoneDependency/getDependencies/getProjectDependencies/getAvailableMilestonesForDependency`, detección de ciclos idéntica al flujo de tareas (BFS) y acciones auditadas `added_milestone_dependency`/`removed_milestone_dependency`. UI: acción "Dependencies" por hito en `/dashboard/projects/[id]/milestones` con panel Depends on / Blocks, tipos (Finish to Start, Start to Start, Related) y dependencias cargadas en una sola consulta por proyecto.

Estado

Done

Prioridad

P2

---

# Historia 8.9

Indicadores

Mostrar

- [x] % completado
- [x] Horas utilizadas
- [x] Horas restantes
- [x] Retraso
- [x] Estado general
- [x] Riesgo

Implementación: `buildMilestoneIndicators` calcula progreso (auto/manual), horas, retraso (`isOverdue`/`delayDays`) y riesgo (`low`/`medium`/`high` — alto con hito vencido o exceso de horas con tareas pendientes; medio si vence en una semana con avance < 70%). Renderizados en la tabla de hitos (barra de progreso coloreada, chip de retraso, horas trabajadas/estimadas) y reutilizables por cualquier módulo.

Estado

Done

Prioridad

P1

---

# Historia 8.10

Vista del Cliente

Permitir visualizar

- [x] Hitos completados
- [x] Hitos activos
- [x] Próximos hitos
- [x] Barra de progreso
- [x] Fechas importantes

Sin permitir modificaciones.

Implementación: la página de hitos filtra datos con `assertProjectVisible`/`projectScope` (el Cliente solo alcanza sus proyectos) y oculta toda acción de gestión sin `projects.update` (sin botones de crear/editar/archivar/reordenar; el modal de tareas requiere `tasks.update`). Barra de progreso y fechas visibles en tabla y timeline. El dashboard del Cliente incluye `MilestonesCard` con próximos hitos (Historia 11.3).

Estado

Done

Prioridad

P0

---

# Historia 8.11

Vista del Intermediario

Permitir visualizar

- [x] Hitos de sus proyectos
- [x] Estado
- [x] Avance
- [x] Próximas entregas
- [x] Actividad reciente

Implementación: mismo contrato de solo lectura que 8.10 aplicado al rol Intermediary (alcance por clientes asignados vía `projectScope`). Su panel (Historia 11.4) muestra próximas entregas y comentarios recientes; el historial de hitos está disponible desde la página de hitos.

Estado

Done

Prioridad

P0

---

# Historia 8.12

Timeline del Proyecto

Mostrar

- [x] Inicio del proyecto
- [x] Hitos
- [x] Fechas clave
- [x] Retrasos
- [x] Finalización

### Frontend

- [ ] Timeline interactivo
- [ ] Zoom
- [ ] Navegación

Implementación: vista Timeline en `/dashboard/projects/[id]/milestones` (estado en URL `view=timeline`) reutilizando `components/charts/timeline.tsx`: cabecera con fechas de inicio/fin del proyecto, hitos ordenados con color por estado, barra de progreso, sección de hitos sin fecha y marcador de fin. Zoom y navegación interactiva pendientes.

Estado

In Progress

Prioridad

P1

---

# Historia 8.13

Auditoría

Registrar

- [x] Creación
- [x] Edición
- [x] Cambio de estado
- [x] Cambio de fechas
- [x] Asignación de tareas
- [x] Eliminación lógica

Implementación: eventos en `activity_logs` (entity "Milestone") escritos desde `actions/milestones.ts` vía `ActivityService.log`: `created_milestone`, `updated_milestone` (diff por campo, incluye fechas), `changed_milestone_status`, `updated_milestone_progress`, `archived_milestone`/`restored_milestone`, `moved_milestone`, `assigned_task_to_milestone`, `removed_task_from_milestone`. Fallos de auditoría no bloquean la operación. Visibles en la página de hitos (History), en el log global y en exportes.

Estado

Done

Prioridad

P1

---

# Historia 8.14

Integración

Integraciones obligatorias

- [x] Proyectos
- [x] Tareas
- [x] Dashboard
- [x] Reportes
- [x] Comentarios
- [x] Archivos
- [x] Notificaciones
- [x] Auditoría

Implementación: hitos ligados a proyectos (timeline + pestañas del proyecto reutilizando el modal compartido), a tareas (asignación, agregados de progreso), a los dashboards por rol (`MilestonesCard`, KPIs de upcoming/riesgo), a reportes/exports (`ProjectExportService.schedule` con hitos enriquecidos), comentarios por hito (Historia 9.4), archivos (`entity_type='milestone'` soportado por `attachmentScope`), notificaciones de vencimiento (`syncTimeBasedNotifications`) y auditoría completa (8.13).

Estado

Done

Prioridad

P0

---

# Criterios de Aceptación de la Épica

- CRUD completo de hitos.
- Asociación de tareas a hitos.
- Cálculo automático del progreso.
- Timeline funcional.
- Seguimiento por fases del proyecto.
- Vistas diferenciadas para clientes e intermediarios.
- Indicadores automáticos.
- Auditoría completa.
- Integración con proyectos y tareas.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 9 — Comentarios y Actividad

## Objetivo

Desarrollar un sistema de comunicación centralizado dentro de la plataforma que permita mantener conversaciones organizadas entre Developers, Clientes e Intermediarios, registrar automáticamente toda la actividad del sistema y mejorar la trazabilidad de cada proyecto.

Prioridad

P0

Estado

Done

Dependencias

- Épica 6 — Gestión de Proyectos
- Épica 7 — Gestión de Tareas
- Épica 8 — Gestión de Hitos

---

# Historia 9.1

Sistema Global de Comentarios

## Objetivo

Permitir crear conversaciones dentro del sistema.

### Backend

- [x] Crear modelo Comment
- [x] Crear relaciones
- [x] Registrar auditoría

### Frontend

- [x] Editor de comentarios
- [x] Lista cronológica
- [x] Scroll automático

### QA

- [x] Crear comentario
- [x] Mostrar comentarios
- [x] Orden cronológico

Estado

Done

Prioridad

P0

---

# Historia 9.2

Comentarios por Proyecto

Cada proyecto deberá tener su propio historial de comentarios.

### Funciones

- [x] Crear comentario
- [x] Editar comentario propio
- [x] Eliminar comentario propio
- [x] Responder comentarios

### QA

- [x] Validar permisos
- [x] Validar historial

Estado

Done

Prioridad

P0

---

# Historia 9.3

Comentarios por Tarea

### Funciones

- [x] Conversación independiente
- [x] Historial
- [x] Respuestas

Estado

Done

Prioridad

P0

---

# Historia 9.4

Comentarios por Hito

### Funciones

- [x] Crear conversación
- [x] Respuestas
- [x] Historial

Estado

Done

Prioridad

P1

---

# Historia 9.5

Editor Enriquecido

### Funciones

- [x] Markdown básico
- [x] Negritas
- [x] Cursivas
- [x] Código
- [x] Listas
- [x] Enlaces

Estado

Done

Prioridad

P2

---

# Historia 9.6

Menciones

Permitir mencionar usuarios.

Ejemplos

@Developer

@Intermediario

@Cliente

### Backend

- [x] Detectar menciones
- [x] Registrar destinatarios

### Frontend

- [x] Autocompletado
- [x] Resaltado

Estado

Done

Prioridad

P1

---

# Historia 9.7

Adjuntos

Permitir adjuntar.

- Imágenes
- PDF
- Word
- Excel
- ZIP
- Otros archivos permitidos

### QA

- [x] Subida correcta
- [x] Descarga

Estado

Done

Prioridad

P1

---

# Historia 9.8

Reacciones

Permitir reaccionar mediante.

- 👍
- ❤️
- 👀
- ✅

Estado

Done

Prioridad

P3

---

# Historia 9.9

Edición de Comentarios

### Backend

- [x] Editar comentario
- [x] Registrar edición

### Frontend

- [x] Indicador "Editado"

Estado

Done

Prioridad

P1

---

# Historia 9.10

Eliminar Comentarios

### Backend

- [x] Eliminación lógica
- [x] Restauración
- [x] Auditoría

Estado

Done

Prioridad

P1

---

# Historia 9.11

Actividad Automática

Registrar automáticamente.

- Proyecto creado
- Proyecto actualizado
- Proyecto archivado
- Cambio de estado
- Nueva tarea
- Cambio de responsable
- Nueva subtarea
- Checklist actualizado
- Hito creado
- Hito completado
- Archivo subido
- Comentario agregado

Estado

Done

Prioridad

P0

---

# Historia 9.12

Timeline de Actividad

Mostrar

- Fecha
- Usuario
- Acción
- Elemento afectado
- Descripción

Filtros

- Usuario
- Proyecto
- Fecha
- Tipo de evento

Estado

Done

Prioridad

P0

---

# Historia 9.13

Actividad del Cliente

El cliente podrá visualizar únicamente.

- Cambios importantes
- Avance del proyecto
- Nuevos archivos compartidos
- Comentarios visibles
- Próximas entregas

Estado

Done

Prioridad

P0

---

# Historia 9.14

Actividad del Intermediario

Mostrar únicamente.

- Proyectos asignados
- Clientes asignados
- Comentarios visibles
- Cambios importantes

Estado

Done

Prioridad

P0

---

# Historia 9.15

Búsqueda

Buscar comentarios por.

- Usuario
- Proyecto
- Palabra clave
- Fecha
- Etiquetas

Estado

Done

Prioridad

P2

---

# Historia 9.16

Notificaciones Integradas

Generar notificaciones cuando.

- [x] Existe una mención
- [x] Responden un comentario
- [x] Se agrega un archivo
- [x] Cambia el estado
- [x] Se crea una tarea

Estado

Done

Prioridad

P1

---

# Historia 9.17

Permisos

Developer

- [x] Acceso completo

Intermediary

- [x] Ver comentarios autorizados
- [x] Crear comentarios

Client

- [x] Ver comentarios compartidos
- [x] Comentar únicamente cuando esté permitido

Administrator

- [x] Gestión completa

Super Administrator

- [x] Acceso total

Estado

Done

Prioridad

P0

---

# Historia 9.18

Auditoría

Registrar

- Comentario creado
- Comentario editado
- Comentario eliminado
- Archivo adjunto
- Reacción
- Mención
- Respuesta

Estado

Done

Prioridad

P1

---

# Historia 9.19

Integración

Integrar con.

- Proyectos
- Hitos
- Tareas
- Archivos
- Dashboard
- Notificaciones
- Reportes
- Auditoría

Estado

Done

Prioridad

P0

---

# Criterios de Aceptación de la Épica

- Sistema completo de comentarios.
- Conversaciones organizadas por proyecto, tarea e hito.
- Historial cronológico.
- Timeline de actividad.
- Menciones funcionales.
- Adjuntos disponibles.
- Reacciones implementadas.
- Auditoría completa.
- Integración con el resto de módulos.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 10 — Gestión de Archivos

## Objetivo

Desarrollar el sistema de gestión documental de la plataforma, permitiendo almacenar, organizar, compartir y versionar archivos relacionados con proyectos, clientes, tareas e hitos, utilizando Cloudflare R2 como almacenamiento principal.

Prioridad

P0

Estado

Done

Dependencias

- Épica 6 — Gestión de Proyectos
- Épica 7 — Gestión de Tareas
- Épica 8 — Gestión de Hitos
- Épica 9 — Comentarios y Actividad

---

# Historia 10.1

Administración de Archivos

## Objetivo

Visualizar todos los archivos disponibles según los permisos del usuario.

### Backend

- [x] Consulta paginada
- [x] Búsqueda
- [x] Ordenamiento
- [x] Filtros
- [x] Conteo de archivos

### Frontend

- [x] DataTable
- [x] Vista en cuadrícula
- [x] Vista en lista
- [x] Selector de vista

Filtros

- Proyecto
- Cliente
- Hito
- Tarea
- Tipo de archivo
- Fecha
- Usuario

### QA

- [x] Rendimiento
- [x] Permisos
- [x] Responsive

Estado

Done

Prioridad

P0

---

# Historia 10.2

Subida de Archivos

### Backend

- [x] Integrar Cloudflare R2
- [x] Validar tamaño
- [x] Validar tipo MIME
- [x] Registrar auditoría

### Frontend

- [x] Drag & Drop
- [x] Selector de archivos
- [x] Barra de progreso
- [x] Cancelar carga

Tipos permitidos

- PDF
- DOCX
- XLSX
- PPTX
- PNG
- JPG
- JPEG
- SVG
- WEBP
- ZIP

### QA

- [x] Validar tamaño máximo
- [x] Validar extensiones
- [x] Validar subida múltiple

Estado

Done

Prioridad

P0

---

# Historia 10.3

Organización de Archivos

Permitir organizar por

- Proyecto
- Cliente
- Hito
- Tarea
- Categoría

Categorías

- Documentación
- Diseño
- Contratos
- Recursos
- Entregables
- Otros

Estado

Done

Prioridad

P1

---

# Historia 10.4

Versionado

## Objetivo

Mantener un historial de versiones de un mismo archivo.

Funciones

- [x] Subir nueva versión
- [x] Consultar historial
- [x] Restaurar versión
- [x] Comparar versiones (preparado)

Estado

Done

Prioridad

P1

---

# Historia 10.5

Vista Previa

Permitir visualizar sin descargar

- PDF
- Imágenes
- Documentos compatibles
- Videos compatibles

### QA

- [x] Renderizado correcto
- [x] Responsive

Estado

Done

Prioridad

P1

---

# Historia 10.6

Descarga de Archivos

### Backend

- [x] Generar URL segura
- [x] Validar permisos
- [x] Registrar descarga

### Frontend

- [x] Botón Descargar
- [x] Descarga individual
- [x] Descarga múltiple (ZIP)

Estado

Done

Prioridad

P0

---

# Historia 10.7

Mover Archivos

Permitir mover archivos entre

- Proyectos
- Hitos
- Tareas
- Categorías

### QA

- [x] Persistencia
- [x] Auditoría

Estado

Done

Prioridad

P2

---

# Historia 10.8

Eliminar Archivos

### Backend

- [x] Eliminación lógica
- [x] Eliminación permanente (solo administradores)
- [x] Restauración

### QA

- [x] Validar permisos
- [x] Validar restauración

Estado

Done

Prioridad

P1

---

# Historia 10.9

Compartir Archivos

Permitir compartir con

- Cliente
- Intermediario
- Equipo interno

Opciones

- Solo lectura
- Descargar
- Oculto

Estado

Done

Prioridad

P0

---

# Historia 10.10

Metadatos

Registrar automáticamente

- Nombre
- Tamaño
- Tipo
- Usuario
- Fecha
- Proyecto asociado
- Hito asociado
- Tarea asociada
- Versión

Estado

Done

Prioridad

P1

---

# Historia 10.11

Búsqueda

Buscar archivos por

- Nombre
- Proyecto
- Cliente
- Categoría
- Tipo
- Etiquetas

Estado

Done

Prioridad

P1

---

# Historia 10.12

Indicadores

Mostrar

- Total de archivos
- Espacio utilizado
- Archivos recientes
- Últimas descargas
- Últimas cargas

Estado

Done

Prioridad

P2

---

# Historia 10.13

Permisos

Developer

- [x] Acceso completo

Intermediary

- [x] Acceso a archivos de proyectos asignados

Client

- [x] Acceso únicamente a archivos compartidos

Administrator

- [x] Gestión completa

Super Administrator

- [x] Acceso total

### QA

- [x] Validar RBAC
- [x] Validar autorización a nivel de datos

Estado

Done

Prioridad

P0

---

# Historia 10.14

Auditoría

Registrar

- Archivo subido
- Archivo descargado
- Archivo eliminado
- Archivo restaurado
- Archivo compartido
- Cambio de versión
- Cambio de categoría

Estado

Done

Prioridad

P1

---

# Historia 10.15

Integración

Integraciones obligatorias

- Proyectos
- Clientes
- Hitos
- Tareas
- Comentarios
- Dashboard
- Reportes
- Notificaciones
- Auditoría

Estado

Done

Prioridad

P0

---

# Criterios de Aceptación de la Épica

- Gestión completa de archivos.
- Integración con Cloudflare R2.
- Versionado funcional.
- Organización por proyecto, hito y tarea.
- Vista previa de archivos compatibles.
- Descargas seguras.
- Compartición por permisos.
- Auditoría completa.
- Integración con todos los módulos relacionados.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 11 — Dashboard e Indicadores

## Objetivo

Desarrollar un sistema de dashboards inteligentes y personalizables que permitan visualizar en tiempo real el estado de la plataforma, los proyectos, clientes, tareas y métricas relevantes según el rol del usuario.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 4 — Gestión de Clientes
- Épica 5 — Gestión de Intermediarios
- Épica 6 — Gestión de Proyectos
- Épica 7 — Gestión de Tareas
- Épica 8 — Gestión de Hitos
- Épica 9 — Comentarios
- Épica 10 — Gestión de Archivos

---

# Historia 11.1

Dashboard General

## Objetivo

Crear la estructura base del Dashboard.

### Backend

- [x] Obtener métricas generales
- [x] Optimizar consultas
- [ ] Implementar caché donde aplique

### Frontend

- [x] Layout responsive
- [x] Sistema de widgets
- [x] Grid adaptable
- [ ] Persistencia de la disposición

Implementación: `app/dashboard/page.tsx` enruta por rol (Developer/Administrador → `DeveloperPanel`, Client → `ClientPanel`, Intermediary → `IntermediaryPanel`); cada panel obtiene TODOS sus datos en una única llamada batcheada del servicio (`getDeveloperDashboard` / `getClientDashboard` / `getIntermediaryPanel` con `Promise.all` + SQL agregado, sin N+1). Los widgets viven centralizados en `components/dashboard/` (Historia 11.5) y se componen en grids responsive. Actualización por `revalidatePath` en las server actions (estrategia del proyecto); persistencia de disposición pendiente (Historia 11.11, preferencias ya listas).

Estado

In Progress

Prioridad

P0

---

# Historia 11.2

Dashboard del Developer

Mostrar

- [x] Total de proyectos
- [x] Proyectos activos
- [x] Proyectos en riesgo
- [x] Proyectos finalizados
- [x] Tareas pendientes
- [x] Tareas vencidas
- [x] Próximas entregas
- [x] Últimos comentarios
- [x] Últimos archivos
- [x] Actividad reciente
- [x] Clientes activos
- [x] Intermediarios activos

Implementación: `DeveloperPanel` con 8 KPIs clicables (Active/Completed/Delayed Projects, At Risk, Overdue/Pending Tasks, Active Clients/Intermediaries), gráficos (tareas por estado, proyectos por estado, horas estimadas vs trabajadas), `MilestonesCard` (próximas entregas), `AtRiskProjectsCard` (Historia 11.10), `ActivityCard`, `CommentsCard` y `FilesCard`. Datos: `DashboardService.getDeveloperDashboard()` en una sola ronda de consultas agregadas.

Estado

Done

Prioridad

P0

---

# Historia 11.3

Dashboard del Cliente

Mostrar únicamente

- [x] Sus proyectos
- [x] Estado de cada proyecto
- [x] Porcentaje de avance
- [x] Próximos hitos
- [x] Últimos archivos compartidos
- [x] Comentarios recientes
- [x] Próximas entregas

Implementación: `ClientPanel` con KPIs (Active/Completed Projects, Average Progress, Deliveries in 30 Days), tarjeta "My Projects" (estado, % con barra de progreso coloreada, fecha límite con indicador de retraso), `MilestonesCard`, `DueSoonCard`, `CommentsCard` y `FilesCard`. Datos: `DashboardService.getClientDashboard()` con `clientScope`/`projectScope` — el Cliente solo ve sus proyectos, hitos, archivos y conversaciones (autorización en capa de datos).

Estado

Done

Prioridad

P0

---

# Historia 11.4

Dashboard del Intermediario

Mostrar

- [x] Clientes asignados
- [x] Proyectos activos
- [x] Proyectos finalizados
- [ ] Proyectos con retraso
- [x] Próximas entregas
- [x] Comentarios recientes
- [x] Actividad reciente

Implementación: `IntermediaryPanel` refactorizado sobre los widgets compartidos (`KpiCard`, `DueSoonCard`, `CommentsCard`, `ListCard`); los comentarios ahora abarcan las 4 superficies (cliente, proyecto, tarea, hito) vía `fetchRecentComments` con enlaces resueltos por `getCommentContextHref`. Widget explícito de proyectos con retraso pendiente.

Estado

In Progress

Prioridad

P0

---

# Historia 11.5

Widgets

Crear widgets reutilizables.

- [x] KPI Card
- [x] Progress Card
- [x] Timeline Card
- [x] Activity Card
- [x] Calendar Card
- [x] Files Card
- [x] Comments Card
- [x] Tasks Card
- [x] Milestones Card
- [ ] Notifications Card

Implementación: librería centralizada en `components/dashboard/`: `KpiCard` (clicable, con tonos), `ListCard` (chrome genérico de lista con estado vacío único), `MilestonesCard`, `ActivityCard`, `CommentsCard` (4 contextos de conversación), `DueSoonCard` (agenda de entregas), `FilesCard`, `AtRiskProjectsCard`. Progress Card cubierto por `ProgressRing` (`components/charts`) usado en tarjetas del dashboard de proyecto y barras de progreso de los widgets; Timeline Card por `components/charts/timeline.tsx`; Tasks Card por la tarjeta Pending Tasks del panel de intermediarios. Pendiente: widget de notificaciones.

Estado

In Progress

Prioridad

P0

---

# Historia 11.6

Gráficos

Implementar

- [x] Proyectos por estado
- [x] Tareas por estado
- [x] Progreso por proyecto
- [x] Horas estimadas vs reales
- [ ] Productividad semanal
- [ ] Productividad mensual
- [ ] Actividad por usuario

Implementación: `DeveloperPanel` renderiza BarChart de tareas por estado, proyectos por estado (`statusBreakdown` en una consulta GROUP BY) y horas estimadas vs trabajadas. Progreso por proyecto visible en `ClientPanel` (barras por proyecto) y dashboard de proyecto (ProgressRing + esperado vs real). Pendientes: productividad semanal/mensual (time entries) y actividad por usuario como gráficos de dashboard (horas por usuario disponibles en reports/exports).

Estado

In Progress

Prioridad

P1

---

# Historia 11.7

Indicadores (KPIs)

Calcular automáticamente

- [x] Total de proyectos
- [x] Proyectos activos
- [x] Proyectos finalizados
- [x] Horas estimadas
- [x] Horas reales
- [ ] Productividad
- [ ] Cumplimiento de fechas
- [x] Riesgo del proyecto
- [x] Tareas completadas
- [x] Tareas pendientes

Implementación: `DashboardService.getStats`/`getDeveloperStats`/`getScopedStats` calculan conteos y horas en consultas agregadas (incluido `delayedProjects`, antes hardcodeado en 0); riesgo del proyecto vía `assessAtRiskProject` (11.10) e `ProjectIndicatorsService` en el detalle. Pendientes: KPI de productividad y cumplimiento de fechas a nivel portafolio.

Estado

In Progress

Prioridad

P0

---

# Historia 11.8

Calendario

Mostrar

- [x] Próximas entregas
- [x] Fechas límite
- [x] Hitos
- [ ] Eventos importantes
- [ ] Recordatorios

Implementación: `DueSoonCard` (agenda de entregas/fechas límite a 30 días) y `MilestonesCard` (hitos próximos con indicador de vencido) presentes en los tres paneles por rol. Vista de calendario mensual, eventos adicionales y recordatorios pendientes.

Estado

In Progress

Prioridad

P1

---

# Historia 11.9

Actividad Reciente

Mostrar

- [x] Últimos proyectos
- [x] Últimas tareas
- [x] Últimos comentarios
- [x] Últimos archivos
- [x] Cambios importantes

Implementación: `ActivityCard` en el panel del Developer alimenta el feed con los últimos eventos de auditoría (creaciones de proyectos/tareas, cambios de estado, etc.) reutilizando los formatters de `features/activity`; `CommentsCard` y `FilesCard` cubren conversaciones y archivos recientes en los paneles de Client/Developer. Feed completo en `/dashboard/activity`.

Estado

Done

Prioridad

P0

---

# Historia 11.10

Proyectos en Riesgo

Detectar automáticamente

- [x] Retrasos
- [x] Exceso de horas
- [x] Hitos vencidos
- [x] Tareas bloqueadas
- [ ] Baja productividad

Implementación: `DashboardService.getDeveloperDashboard` evalúa el portafolio con UNA consulta agregada (tareas vencidas/bloqueadas por proyecto + subconsulta de hitos vencidos) y `assessAtRiskProject` (función pura, reutilizable) asigna riesgo medio/alto con razones legibles ("2 overdue milestones · 3 overdue tasks · Hours overrun"); se muestra en `AtRiskProjectsCard`. Riesgo por hito individual en `buildMilestoneIndicators` (8.9). Pendiente: señal de baja productividad.

Estado

In Progress

Prioridad

P1

---

# Historia 11.11

Dashboard Personalizable

Permitir

- [x] Reordenar widgets
- [x] Mostrar u ocultar widgets
- [x] Guardar configuración
- [x] Restaurar configuración

Implementación: registro de widgets por panel (`features/dashboard/dashboard-widgets.ts`: Developer 8, Client 5, Intermediary 3), panel "Customize" en el dashboard (checkbox de visibilidad + flechas de orden) y persistencia en `users.dashboard_preferences` vía `PreferencesService` con validación de ids desconocidos en el servidor. `resolveWidgetLayout` ordena/oculta widgets en los tres paneles (la fila de KPIs permanece fija) y "Restore defaults" vuelve al layout original. La acción `updateDashboardLayout` audita el cambio (11.17).

Estado

Done

Prioridad

P2

---

# Historia 11.12

Filtros Globales

Permitir filtrar por

- [x] Proyecto
- [x] Cliente
- [x] Intermediario
- [x] Fecha
- [x] Estado
- [x] Prioridad

Implementación: barra de filtros en el dashboard con estado en URL (`?project&client&intermediary&status&priority&from&to`) validada contra listas de opciones; `DashboardService` acepta `DashboardFilters` y los aplica a los conteos del scope, tareas vencidas, hitos próximos, riesgo, entregas próximas, comentarios y archivos (fragments `projectFilterFragment`/`taskFilterFragment` con subconsultas para cliente e intermediario, arg-count preservado). Los filtros de Cliente e Intermediario se ofrecen al Developer; Client/Intermediary operan naturalmente sobre su cartera.

Estado

Done

Prioridad

P1

---

# Historia 11.13

Exportación

Exportar Dashboard como

- [x] PDF
- [ ] Imagen
- [x] Excel (datos)

Implementación: `DashboardService.getDashboardReport` materializa el dashboard filtrado como `ModuleReport` y se reutilizan los exporters compartidos — PDF en el cliente (`exportReportPdf`, jsPDF cargado on demand) y CSV/XLSX vía `/api/dashboard/export` con los mismos filtros. Ambas rutas auditan `exported_dashboard` (11.17). Imagen pendiente: requiere html2canvas (dependencia nueva, evaluada para v1.1).

Estado

In Progress

Prioridad

P2

---

# Historia 11.14

Actualización en Tiempo Real

Implementar

- [x] Actualización automática
- [ ] Refetch inteligente
- [x] Indicador de sincronización

Implementación: actualización automática cubierta por `revalidatePath("/dashboard")` en todas las server actions que mutan proyectos, tareas, hitos, comentarios y archivos (el panel se regenera en la siguiente visita sin refetch manual). Indicador de conectividad/sincronización del PWA ya presente en el header (online/offline, cola offline y estado de sync). Pendiente: refetch inteligente con foco/interacción.

Estado

In Progress

Prioridad

P1

---

# Historia 11.15

Responsive

Optimizar para

- [x] Escritorio
- [x] Tablet
- [x] PWA móvil

Implementación: los tres paneles usan grids progresivos (`grid-cols-2 lg:grid-cols-4` para KPIs, `lg:grid-cols-2/3` para widgets), filas flex-wrap en listas, targets táctiles (h-10) y estados de foco visibles; sin funcionalidad solo escritorio.

Estado

Done

Prioridad

P0

---

# Historia 11.16

Permisos

Developer

- [x] Dashboard (vista general) completo

Intermediary

- [x] Dashboard (vista general) de clientes asignados

Client

- [x] Dashboard (vista general) de proyectos propios

Administrator

- [x] Dashboard (vista general) administrativo

Super Administrator

- [x] Dashboard (vista general) global

Implementación: `app/dashboard/page.tsx` enruta a `DeveloperPanel` (Developer/Administrator/Super Administrator vía `hasFullAccess`), `ClientPanel` y `IntermediaryPanel`; cada servicio aplica los scopes de la capa de datos (`clientScope`/`projectScope`/`milestoneScope`), por lo que ningún rol recibe datos fuera de su cartera. Panel administrativo dedicado en `/dashboard/admin`.

Estado

Done

Prioridad

P0

---

# Historia 11.17

Auditoría

Registrar

- [x] Exportaciones
- [x] Cambios de configuración
- [x] Widgets personalizados
- [x] Accesos al Dashboard

Implementación: `exported_dashboard` (acción + ruta de export, con dedupe `logAccessOnce`), `updated_settings`/`restored_settings`/`imported_settings` (categorías de configuración), `updated_dashboard_layout` (guardado del layout por panel) y `viewed_dashboard` con ventana de dedupe de 60s para no inundar el registro en navegación rutinaria. Todos los eventos son visibles en el Activity Log con clasificación de seguridad (16.13).

Estado

Done

Prioridad

P2

---

# Historia 11.18

Integración

Integrar con

- [x] Proyectos
- [x] Clientes
- [x] Intermediarios
- [x] Tareas
- [x] Hitos
- [x] Archivos
- [x] Comentarios
- [x] Reportes
- [x] Notificaciones

Implementación: los paneles consumen `ProjectsService`/`TasksService`/`MilestonesService`/`CommentsService` y agregados propios con los mismos scopes; widgets de hitos (Épica 8), archivos, comentarios y entregas; el panel se regenera vía `revalidatePath("/dashboard")` en todas las server actions que mutan proyectos, tareas, hitos, comentarios y archivos; las notificaciones de vencimiento se sincronizan en cada carga del dashboard.

Estado

Done

Prioridad

P0

---

# Criterios de Aceptación

- Dashboard específico por rol.
- Widgets reutilizables.
- KPIs automáticos.
- Gráficos funcionales.
- Calendario integrado.
- Actividad reciente.
- Personalización del Dashboard.
- Responsive completo.
- Integración con todos los módulos.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 12 — Reportes y Exportaciones

## Objetivo

Desarrollar un módulo completo de reportes que permita generar información ejecutiva, operativa y estadística del sistema, ofreciendo exportaciones en múltiples formatos y permitiendo a cada rol acceder únicamente a la información autorizada.

Prioridad

P1

Estado

Done

Dependencias

- Épica 4 — Clientes
- Épica 5 — Intermediarios
- Épica 6 — Proyectos
- Épica 7 — Tareas
- Épica 8 — Hitos
- Épica 11 — Dashboard

---

# Historia 12.1

Centro de Reportes

## Objetivo

Crear un módulo centralizado donde el usuario pueda consultar todos los reportes disponibles.

### Backend

- [x] Obtener listado de reportes
- [x] Validar permisos
- [x] Registrar auditoría

### Frontend

- [x] Pantalla principal
- [x] Categorías
- [x] Buscador
- [x] Favoritos

Estado

Done

Prioridad

P1

---

# Historia 12.2

Reporte de Proyectos

Mostrar

- [x] Total de proyectos
- [x] Proyectos activos
- [x] Proyectos finalizados
- [x] Proyectos cancelados
- [x] Estado por proyecto
- [x] Tiempo estimado vs real
- [x] Riesgo
- [x] Productividad

Exportar

- [x] PDF
- [x] Excel
- [x] CSV

Estado

Done

Prioridad

P1

---

# Historia 12.3

Reporte de Clientes

Mostrar

- [x] Clientes activos
- [x] Clientes inactivos
- [x] Cantidad de proyectos
- [x] Estado general
- [x] Última actividad

Estado

Done

Prioridad

P1

---

# Historia 12.4

Reporte de Intermediarios

Mostrar

- [x] Clientes asignados
- [x] Proyectos asignados
- [x] Avance promedio
- [x] Actividad

Estado

Done

Prioridad

P1

---

# Historia 12.5

Reporte de Tareas

Mostrar

- [x] Total de tareas
- [x] Completadas
- [x] Pendientes
- [x] Bloqueadas
- [x] Retrasadas
- [x] Productividad

Estado

Done

Prioridad

P1

---

# Historia 12.6

Reporte de Hitos

Mostrar

- [x] Hitos completados
- [x] Hitos pendientes
- [x] Retrasos
- [x] Cumplimiento

Estado

Done

Prioridad

P2

---

# Historia 12.7

Reporte de Horas

Calcular

- [x] Horas estimadas
- [x] Horas reales
- [x] Horas restantes
- [x] Desviación

Estado

Done

Prioridad

P1

---

# Historia 12.8

Reporte de Productividad

Indicadores

- [x] Proyectos finalizados
- [x] Tareas completadas
- [x] Horas trabajadas
- [x] Cumplimiento de fechas
- [x] Tendencias

Estado

Done

Prioridad

P2

---

# Historia 12.9

Filtros Avanzados

Filtrar por

- Proyecto
- Cliente
- Intermediario
- Fecha
- Estado
- Responsable
- Prioridad

Estado

Done

Prioridad

P1

---

# Historia 12.10

Exportaciones

Permitir exportar

- [x] PDF
- [x] Excel
- [x] CSV

Aplicable a

- Reportes
- Tablas
- Dashboards
- Estadísticas

Estado

Done

Prioridad

P1

---

# Historia 12.11

Programación de Reportes

Permitir

- [x] Generación manual
- [ ] Generación automática (roadmap futuro: scheduler externo)
- [x] Programación futura (preparado)

Estado

Backlog

Prioridad

P3

---

# Historia 12.12

Vista del Cliente

Mostrar únicamente

- Sus proyectos
- Su progreso
- Sus entregas
- Sus documentos

Estado

Done

Prioridad

P1

---

# Historia 12.13

Vista del Intermediario

Mostrar

- Clientes asignados
- Proyectos asignados
- Productividad
- Estado general

Estado

Done

Prioridad

P1

---

# Historia 12.14

Gráficos

Implementar

- [x] Barras
- [x] Líneas
- [x] Pastel
- [x] Área
- [x] Indicadores KPI

Estado

Done

Prioridad

P2

---

# Historia 12.15

Auditoría

Registrar

- Reporte generado
- Reporte exportado
- Reporte compartido

Estado

Done

Prioridad

P2

---

# Historia 12.16

Permisos

Developer

- [x] Todos los reportes

Intermediary

- [x] Reportes propios

Client

- [x] Reportes de sus proyectos

Administrator

- [x] Gestión completa

Super Administrator

- [x] Acceso completo

Estado

Done

Prioridad

P1

---

# Historia 12.17

Integración

Integrar con

- Dashboard
- Proyectos
- Clientes
- Intermediarios
- Hitos
- Tareas
- Archivos
- Auditoría

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación

- Reportes completos por módulo.
- Exportaciones funcionales.
- Filtros avanzados.
- KPIs incluidos.
- Permisos correctamente aplicados.
- Integración con Dashboard.
- Preparado para automatización futura.

---

# Épica 13 — Notificaciones y Centro de Actividad

## Objetivo

Desarrollar un sistema centralizado de notificaciones que permita informar oportunamente a Developers, Clientes, Intermediarios y Administradores sobre eventos importantes del sistema mediante notificaciones dentro de la aplicación, correos electrónicos y futuras integraciones con notificaciones Push.

Prioridad

P1

Estado

Done

Dependencias

- Épica 6 — Gestión de Proyectos
- Épica 7 — Gestión de Tareas
- Épica 8 — Gestión de Hitos
- Épica 9 — Comentarios y Actividad
- Épica 11 — Dashboard
- Épica 12 — Reportes

---

# Historia 13.1

Centro de Notificaciones

## Objetivo

Crear un centro unificado donde cada usuario pueda consultar todas sus notificaciones.

### Backend

- [x] Obtener notificaciones
- [x] Paginación
- [x] Búsqueda
- [x] Filtros

### Frontend

- [x] Panel de notificaciones
- [x] Indicador de no leídas
- [x] Agrupación por fecha
- [ ] Scroll infinito

Implementación: `/dashboard/notifications` con KPIs (Total/Unread/Today/This week), filtros por texto, tipo, estado de lectura y rango de fechas en URL, paginación real y agrupación por día (Today/Yesterday/fecha). El header muestra la campana con el contador de no leídas (`NotificationsBell`, renderizado del servidor en el layout del dashboard). Pendiente: scroll infinito (la paginación cubre el recorrido del histórico).

Estado

In Progress

Prioridad

P0

---

# Historia 13.2

Notificaciones In-App

Generar automáticamente cuando ocurra alguno de los siguientes eventos.

- [x] Proyecto creado
- [x] Proyecto actualizado
- [x] Cambio de estado
- [x] Nueva tarea
- [x] Nueva subtarea
- [x] Nuevo comentario
- [x] Nuevo archivo
- [x] Hito completado
- [x] Fecha límite próxima
- [x] Proyecto finalizado

Implementación: `notification-triggers.ts` cubre todos los eventos (proyecto creado/actualizado/estado/finalizado, tarea creada/subtarea/comentario/mención/archivo/hito completado) y `syncTimeBasedNotifications` genera los basados en tiempo (proyectos retrasados, vencimientos de proyectos e hitos) de forma idempótene por día. Los destinatarios se resuelven con `getProjectRecipients` (miembros del proyecto, intermediarios de proyecto y cliente, y usuario Cliente vinculado por email) respetando las preferencias por usuario (13.6).

Estado

Done

Prioridad

P0

---

# Historia 13.3

Notificaciones por Correo Electrónico

Permitir enviar correos cuando exista.

- [x] Asignación de proyecto
- [x] Cambio importante
- [x] Comentario mencionado
- [x] Recordatorio
- [x] Entrega próxima
- [x] Proyecto finalizado

Configuración

- [x] Activar
- [x] Desactivar
- [x] Personalizar frecuencia

Implementación: `EmailService` (features/notifications) implementa una arquitectura desacoplada con doble transporte: si `SMTP_HOST` está configurado en `.env.local`, se activa `SmtpTransport` (Nodemailer) para entrega real por SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) compatible con cualquier proveedor (Resend, AWS SES, Mailtrap, SendGrid, etc.). Si no está configurado, conmuta automáticamente a `ConsoleTransport` (log de desarrollo). Genera versiones en texto plano y HTML responsive sanitizado, respeta horas silenciosas y frecuencias (instant/digest), y captura fallos de transporte sin interrumpir las mutaciones de la plataforma.

Estado

Done

Prioridad

P1

---

# Historia 13.4

Notificaciones Push (Preparado)

Preparar la arquitectura para futuras notificaciones Push en la PWA.

### Backend

- [x] Modelo de suscripción
- [x] Registro de dispositivos
- [x] Gestión de tokens

### Frontend

- [ ] Solicitar permisos
- [x] Registrar dispositivo

Implementación: tabla `push_subscriptions` (migración 00011) con endpoint/auth/p256dh/auth por usuario, acciones `registerPushSubscription`/`removePushSubscription` (Zod, auditadas) y preferencia `push_enabled`. El Service Worker incluye los handlers `push` y `notificationclick` (14.12) con navegación al dashboard. Pendiente: solicitar permisos del navegador y entrega real, que requieren claves VAPID del proveedor que se elija.

Estado

In Progress

Prioridad

P2

---

# Historia 13.5

Recordatorios Automáticos

Enviar recordatorios para.

- [x] Próximas entregas
- [x] Hitos próximos
- [x] Tareas vencidas
- [x] Proyectos sin actividad
- [x] Comentarios sin responder

Implementación: `syncTimeBasedNotifications` genera todos los recordatorios de forma idempótene por día (dedupe keys por receptor) en cada carga del dashboard/centro de notificaciones, respetando los ajustes globales `reminder_enabled`/`reminder_days` y las preferencias por usuario: proyectos retrasados y vencimientos de proyecto/hito (7 días por defecto, configurable), tareas vencidas/por vencer para el responsable, proyectos sin actividad en 14 días y comentarios raíz sin respuesta tras 3 días.

Estado

Done

Prioridad

P1

---

# Historia 13.6

Preferencias de Notificaciones

Permitir configurar.

- [x] Canales
- [x] Frecuencia
- [x] Horario permitido
- [x] Tipos de eventos

Implementación: tabla `notification_preferences` (migración 00011) con canal in-app/email/push, frecuencia de correo (instant/daily/weekly), horas silenciosas (HH:MM) y lista de tipos de evento (JSON; null = todos). La UI "Notification preferences" del centro de notificaciones guarda vía `updateNotificationPreferences` (Zod + auditoría `updated_notification_preferences`) y `NotificationsService.create` aplica las preferencias en cada envío.

Estado

Done

Prioridad

P1

---

# Historia 13.7

Centro de Actividad

Mostrar cronológicamente.

- [x] Cambios de proyectos
- [x] Cambios de tareas
- [x] Comentarios
- [x] Archivos
- [x] Hitos
- [x] Asignaciones

Filtros

- [x] Usuario
- [x] Proyecto
- [x] Fecha
- [x] Tipo de actividad

Implementación: `/dashboard/activity` concentra el registro completo (`ActivityLogService.list`) con vistas Tabla y Timeline, búsqueda de acción/entidad, filtros de usuario/entidad/proyecto/fecha y detalle de cambios old→new por fila (16.8). El filtro por proyecto cubre el propio proyecto más sus tareas e hitos (subconsultas, sin exponer entidades ajenas) y se aplica también a las exportaciones (16.11). Los eventos de acceso y seguridad se registran con normalización (ACCESS/SECURITY_AUDIT_ACTIONS).

Estado

Done

Prioridad

P1

---

# Historia 13.8

Notificaciones Inteligentes

Evitar.

- [x] Duplicados
- [x] Spam
- [x] Eventos repetitivos

Agrupar automáticamente eventos relacionados.

Implementación: `dedupe_key` con índice UNIQUE parcial (migración 00005) — cada evento define su clave (por comentario, por tarea, por receptor y día en los basados en tiempo) y `create` verifica antes de insertar. El anti-spam se garantiza con las preferencias por usuario (13.6), las ventanas diarias de los recordatorios y `logAccessOnce` para eventos de acceso. La agrupación visual por fecha junta los eventos relacionados de cada jornada en el centro de notificaciones.

Estado

Done

Prioridad

P2

---

# Historia 13.9

Marcar como Leídas

Permitir.

- [x] Marcar individualmente
- [x] Marcar todas
- [x] Restaurar estado (opcional)

Implementación: acciones `markAsRead`/`markAsUnread`/`markAllAsRead` (scope por receptor en el UPDATE, auditoría `marked_notification_read` con dedupe y `marked_all_notifications_read`). "Marcar unread" restaura el estado; además existe "Dismiss" (ocultado lógico con `dismissed_at`, 13.13).

Estado

Done

Prioridad

P0

---

# Historia 13.10

Búsqueda

Buscar notificaciones por.

- [x] Texto
- [x] Proyecto
- [x] Usuario
- [x] Fecha
- [x] Tipo

Implementación: `NotificationsService.list` soporta búsqueda LIKE sobre título y mensaje, filtro por tipo, estado de lectura, rango de fechas (`from`/`to`) y filtro por proyecto (notificaciones de proyecto, tareas e hitos del proyecto vía subconsultas), todo expuesto en el centro de notificaciones con estado en URL. "Usuario" es implícito: cada usuario solo ve sus notificaciones (los UPDATE/SELECT aplican `receiver_id`).

Estado

Done

Prioridad

P2

---

# Historia 13.11

Notificaciones por Rol

Developer

- [x] Cambios internos
- [x] Asignaciones
- [x] Comentarios
- [x] Archivos

Intermediary

- [x] Proyectos asignados
- [x] Comentarios visibles
- [x] Entregas

Client

- [x] Avance
- [x] Entregas
- [x] Archivos compartidos
- [x] Cambios importantes

Implementación: `getProjectRecipients` resuelve la audiencia por rol — miembros del proyecto y responsables (Developers), intermediarios de proyecto/cliente (Intermediary) y el usuario Cliente vinculado por email — aplicando los mismos criterios de visibilidad que `lib/auth-scope.ts`. Cada tipo de notificación llega al rol correspondiente (asignaciones al responsable, entregas/cambios a toda la audiencia, menciones directas).

Estado

Done

Prioridad

P1

---

# Historia 13.12

Indicadores

Mostrar.

- [x] Total
- [x] No leídas
- [x] Hoy
- [x] Esta semana
- [x] Por tipo

Implementación: `NotificationsService.getStats` agrega total, no leídas, hoy, últimos 7 días y distribución por tipo en consultas COUNT paralelas; se muestran como tarjetas KPI del centro de notificaciones y el contador de no leídas de la campana del header (viaje diario del usuario).

Estado

Done

Prioridad

P2

---

# Historia 13.13

Auditoría

Registrar.

- [ ] Notificación enviada
- [x] Notificación leída
- [x] Notificación descartada
- [x] Cambio de preferencias

Implementación: `marked_notification_read` (con ventana de dedupe vía `logAccessOnce`), `dismissed_notification` (dismiss con `dismissed_at`), `marked_all_notifications_read` y `updated_notification_preferences` viven en el Activity Log. El "envío" no se audita por evento: la propia notificación es el registro persistente (y su volumen haría ruido el log); los errores de triggers quedan en consola del servidor.

Estado

In Progress

Prioridad

P2

---

# Historia 13.14

Permisos

Developer

- [x] Gestión de sus notificaciones

Intermediary

- [x] Gestión de sus notificaciones

Client

- [x] Gestión de sus notificaciones

Administrator

- [x] Configuración global

Super Administrator

- [x] Acceso completo

Implementación: cada usuario solo ve y gestiona sus propias notificaciones y preferencias (todos los UPDATE/SELECT aplican `receiver_id = usuario` en el servidor); la configuración global (frecuencia, recordatorios, eventos) vive en Ajustes → Notifications con guard `settings.*` (Developer/Super Administrator) y `hasFullAccess` cubre el acceso completo.

Estado

Done

Prioridad

P1

---

# Historia 13.15

Integración

Integrar con.

- [x] Proyectos
- [x] Clientes
- [x] Intermediarios
- [x] Hitos
- [x] Tareas
- [x] Dashboard
- [x] Comentarios
- [x] Archivos
- [x] Reportes
- [x] Auditoría

Implementación: los triggers se invocan desde las acciones de proyectos (creación/actualización/estado/finalización), tareas (creación/subtareas/asignación/estado), hitos (completado), comentarios (con menciones), archivos y clientes (`client.created`), todas auditadas. El dashboard sincroniza los recordatorios basados en tiempo en cada carga; el centro de Reportes y el Activity Log consumen los mismos eventos; el bus interno (17.7) replica cada evento hacia webhooks/automatizaciones.

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación

- Centro de notificaciones funcional.
- Notificaciones en tiempo real dentro de la aplicación.
- Correos electrónicos configurables.
- Arquitectura preparada para Push Notifications.
- Preferencias por usuario.
- Recordatorios automáticos.
- Integración con todos los módulos principales.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 14 — PWA y Funcionamiento Offline

## Objetivo

Desarrollar la plataforma como una Progressive Web App (PWA), permitiendo su instalación en dispositivos móviles y de escritorio, ofreciendo una experiencia similar a una aplicación nativa, soporte para funcionamiento offline, sincronización automática de datos y optimización del rendimiento.

Prioridad

P0

Estado

In Progress

Dependencias

- Épica 1 — Infraestructura
- Épica 2 — Autenticación
- Épica 6 — Gestión de Proyectos
- Épica 7 — Gestión de Tareas
- Épica 8 — Gestión de Hitos
- Épica 13 — Notificaciones

---

# Historia 14.1

Configuración Base de la PWA

## Objetivo

Configurar la aplicación para que pueda instalarse como una PWA compatible con navegadores modernos.

### Backend

- [ ] Configuración de manifest
- [ ] Configuración de Service Worker
- [ ] Configuración de íconos
- [ ] Configuración de metadatos

### Frontend

- [ ] Banner de instalación
- [ ] Verificación de instalación
- [x] Indicadores visuales

### QA

- [x] Instalación correcta (criterios de instalabilidad Chromium validados automáticamente)
- [ ] Compatibilidad (pendiente prueba física en dispositivos, ver Historia 14.11)
- [x] Lighthouse PWA (100%, ver docs/qa/historia-14.2-instalacion-pwa.md)

QA en `docs/qa/historia-14.1-14.4-pwa-testing.md` (2026-10-04: manifest, SW con `Service-Worker-Allowed: /`, iconos y metadatos re-verificados por HTTP con build de producción; banner de instalación e indicadores verificados en código).

Estado

Testing

Prioridad

P0

---

# Historia 14.2

Instalación

Permitir instalar la aplicación desde

- [x] Google Chrome
- [x] Microsoft Edge
- [ ] Safari (cuando aplique)
- [ ] Android
- [ ] iOS
- [x] Windows
- [ ] macOS

### QA

- [x] Criterios de instalabilidad Chromium validados automáticamente (manifest, SW, iconos, headers)
- [x] apple-touch-icon configurado para iOS/Safari
- [x] Guía de instalación manual iOS implementada en InstallPrompt
- [ ] Prueba física en dispositivo Android
- [ ] Prueba física en dispositivo iOS
- [ ] Prueba física en macOS / Safari desktop

Guía de pruebas: docs/qa/historia-14.2-instalacion-pwa.md

Chrome, Edge y Windows validados a nivel de criterios técnicos y Lighthouse; pendiente humo manual con UI en sesión real. Android e iOS requieren despliegue HTTPS y dispositivos físicos.

QA en `docs/qa/historia-14.1-14.4-pwa-testing.md` (2026-10-04: criterios Chromium re-verificados por HTTP con build de producción — manifest/SW/headers/iconos/apple-touch-icon; pruebas físicas siguen pendientes por entorno).

Estado

Testing

Prioridad

P0

---

# Historia 14.3

Modo Offline

## Objetivo

Permitir utilizar partes de la aplicación sin conexión a Internet.

### Enfoque

Sin persistencia local de datos (cero IndexedDB/localStorage de datos en el proyecto): el modo offline se apoya exclusivamente en la caché HTTP del Service Worker definida en la Historia 14.5. Las mutaciones siguen siendo online (la cola de acciones pendientes se trata en la Historia 14.8).

### Service Worker

- [x] Páginas visitadas recientes servidas offline desde la caché Pages (Network First, máx. 20 entradas)
- [x] Payloads RSC de rutas visitadas cacheados (Network First) para navegación cliente sin conexión
- [x] Payloads prefetch excluidos de la caché (solo contienen estados de carga parciales)
- [x] Fallo de caché RSC devuelve error al router para que resuelva con navegación completa (nunca HTML de /offline como payload)
- [x] Respaldo /offline para navegaciones nunca visitadas
- [x] Assets de build y tipografías disponibles offline (Cache First)
- [x] Iconos e imágenes previamente vistas servidos offline (Stale While Revalidate)

### Frontend

- [x] Banner global "modo offline" en el dashboard (sticky bajo el header, role=status, aria-live)
- [x] Aviso explícito de datos desactualizados y modo solo lectura hasta reconectar

Disponibles Offline

- Dashboard reciente
- Proyectos recientes
- Tareas recientes
- Hitos recientes
- Comentarios almacenados
- Archivos previamente abiertos

Guía de pruebas: docs/qa/historia-14.3-modo-offline.md

QA en `docs/qa/historia-14.1-14.4-pwa-testing.md` (2026-10-04: todas las afirmaciones del SW verificadas en código — estrategias de caché por tipo, exclusión de prefetch, RSC fallback, límites 20/60 — y `/offline` + banner verificados por HTTP; pasos con DevTools pendientes de pase humano).

Estado

Testing

Prioridad

P1

---

# Historia 14.4

Sincronización Automática

Cuando la conexión regrese

- [x] Sincronizar cambios pendientes (`SyncManager`: resumePausedMutations + cola persistente `lib/sync/offline-queue.ts`)
- [x] Resolver conflictos (servidor como fuente de verdad; mutaciones rechazadas marcadas como conflicto para reintento/descarte manual)
- [x] Mostrar estado de sincronización (indicador del header: Syncing… / Online / Offline / errores y conflictos con reintento manual)
- [x] Registrar errores (log acotado en localStorage + consola)

Guía de pruebas: docs/qa/historia-14.4-sincronizacion-automatica.md

Nota: la cola persistente vive en `lib/offline/pending-actions.ts` (clave `pwa-pending-actions-v1`, payloads Zod, 5 tipos de acción) con flush FIFO en `lib/offline/sync.ts` y orquestación en `lib/sync/sync-manager.ts`; las features ya la usan vía `useQueuedFormAction` (comentarios de proyecto/tarea, task.update/complete, project.update).

QA en `docs/qa/historia-14.1-14.4-pwa-testing.md` (2026-10-04: sincronización, estado del indicador y registro de errores verificados; **hallazgo 14.4-A**: `retryPendingAction`/`discardPendingAction` no tienen superficie de UI — el Retry global omite conflictos y el badge "N conflicts" no puede limpiarse manualmente).

Estado

Testing

Prioridad

P1

---

# Historia 14.5

Caché Inteligente

## Objetivo

Almacenar automáticamente los recursos que no cambian entre sesiones para acelerar cargas posteriores y soportar uso sin conexión.

### Estrategias de caché (Service Worker)

- [x] Recursos estáticos (`/_next/static`) — Cache First
- [x] Layout y páginas visitadas — Network First con respaldo offline
- [x] Componentes (chunks JS/CSS) — Cache First
- [x] Tipografías (woff2 auto-hospedadas) — Cache First en caché dedicada
- [x] Iconos — Precache + Stale While Revalidate
- [x] Configuración (manifest.json) — Stale While Revalidate

### Infraestructura de caché

- [x] Cachés separadas por tipo de recurso (precache/static/fonts/runtime/pages)
- [x] Límite de entradas por caché (runtime y pages) para evitar crecimiento ilimitado
- [x] Limpieza automática de cachés obsoletas al activar el SW
- [x] Página /offline como respaldo de navegación sin conexión
- [x] Headers HTTP de caché para iconos y manifest

Estado

Done

Prioridad

P1

---

# Historia 14.6

Datos Locales

Guardar temporalmente

- [x] Preferencias
- [x] Últimos proyectos
- [x] Últimas tareas
- [x] Configuración del Dashboard
- [x] Sesión cuando sea seguro hacerlo

Implementación: preferencias (idioma/zona horaria/tema) y configuración del dashboard (layout de widgets, 11.11) persisten en la base de datos del usuario y se sirven al render; "Últimos proyectos/tareas" se registran en localStorage (`lib/recent.ts` con `TrackRecentView` en los detalles) y alimentan los accesos rápidos de la página `/offline`; la sesión permanece exclusivamente en cookies httpOnly — el Service Worker nunca intercepta `/auth/`, `/api/` ni guarda tokens.

Estado

Done

Prioridad

P2

---

# Historia 14.7

Indicadores de Conectividad

Mostrar

- [x] Estado Online
- [x] Estado Offline
- [x] Última sincronización
- [x] Cambios pendientes

Estado

Done

Prioridad

P1

---

# Historia 14.8

Cola de Acciones Pendientes

## Objetivo

Permitir que el usuario siga trabajando sin conexión guardando sus cambios en una cola local y procesándolos automáticamente al recuperar la conexión.

Cuando no exista conexión

Guardar acciones pendientes como

- [x] Comentarios (proyectos y tareas)
- [x] Cambios de tareas (edición)
- [x] Cambios de proyectos (edición)
- [x] Actualización de estados (completar tarea)

Procesarlas automáticamente al recuperar conexión.

### Infraestructura implementada

- [x] Cola persistente en el cliente (`lib/offline/pending-actions.ts`) con validación Zod por tipo de acción
- [x] Ejecutor de reintento (`lib/offline/executor.ts`) que reenvía las acciones a los Server Actions originales (revalidación y autorización del lado servidor intactas)
- [x] Sincronización automática al reconectar (`lib/offline/sync.ts` + `OfflineSyncManager` en el layout del dashboard)
- [x] Hook `useOfflineQueue` (contador, estado de sincronización) y `useQueuedFormAction` para formularios
- [x] Indicador de conectividad extendido con contador de cambios en cola y estado "Syncing..."
- [x] Formularios integrados: comentarios de proyecto/tarea, crear/editar tarea, subtareas, editar proyecto, completar tarea
- [x] Límite de reintentos por acción (5) con registro del último error
- [x] Acciones sin soporte offline muestran feedback claro en lugar de fallar en silencio

Nota: la cola se procesa mientras la pestaña está abierta (evento online). El Background Sync nativo del Service Worker (proceso con la app cerrada) queda como mejora futura en la Historia 14.3/14.15.

Estado

Done

Prioridad

P1

---

# Historia 14.9

Actualizaciones Automáticas

Detectar

- [x] Nueva versión disponible
- [x] Actualización instalada
- [x] Reinicio necesario

Permitir

- [x] Actualizar ahora
- [x] Recordar después

Implementación: `ServiceWorkerRegister` respeta el ajuste `pwa_auto_updates` (Ajustes → PWA, 14.13): con actualización automática mantiene el ciclo SKIP_WAITING + reload; desactivado muestra el diálogo "A new version is available" con "Update now"/"Remind later" y recarga controlada al activarse. La detección corre cada hora y al volver a la pestaña; el evento `pwa_updated` se audita (14.14).

Estado

Done

Prioridad

P1

---

# Historia 14.10

Optimización de Rendimiento

Optimizar

- [x] Lazy Loading
- [x] Code Splitting
- [x] Prefetch
- [x] Precarga de recursos
- [x] Imágenes optimizadas

Implementación: jsPDF/jspdf-autotable (la dependencia más pesada del cliente) se cargan on demand dentro de `exportReportPdf`; los componentes pesados (Kanban, gráficos) se trocean por ruta en el build; Next.js prefetchea los `<Link>` del sidebar por defecto; el Service Worker precachea offline/manifest/iconos y sirve estáticos cache-first. Imágenes: los avatares con ruta local (`/api/avatars/...`) usan `next/image`; las URLs firmadas remotas y las vistas previas (blob/presigned de un uso) mantienen `<img>` deliberadamente — el optimizador no puede re-fetchearlas y `remotePatterns` con URLs de sesión no es viable.

Estado

Done

Prioridad

P1

---

# Historia 14.11

Compatibilidad

Validar funcionamiento en

- [ ] Chrome
- [ ] Edge
- [ ] Firefox
- [ ] Safari

Dispositivos

- [ ] Escritorio
- [ ] Tablet
- [ ] Android
- [ ] iPhone

Implementación: checklist de verificación documentado en `docs/qa/historia-14.11-compatibilidad-pwa.md` (matriz navegador/dispositivo, instalación, offline, cola de acciones, actualizaciones con prompt y hallazgos conocidos: maximumScale en viewport y límites de Web Push en iOS). La validación física en dispositivos queda pendiente de ejecutarse.

Estado

In Progress

Prioridad

P1

---

# Historia 14.12

Notificaciones Push (Preparado)

Preparar soporte para

- [x] Recordatorios
- [x] Comentarios
- [x] Cambios de proyecto
- [x] Cambios de tareas
- [x] Próximas entregas

La implementación dependerá del proveedor seleccionado en el futuro.

Implementación: handlers `push`/`notificationclick` en el Service Worker (payload JSON con título/cuerpo/url, tag deduplicado, enfoque de la ventana existente), tabla `push_subscriptions` + acciones de registro (13.4) y tipos de notificación ya generados por la plataforma (recordatorios, comentarios, cambios de proyectos/tareas y entregas). Solo falta el proveedor VAPID para activar la entrega.

Estado

Done

Prioridad

P2

---

# Historia 14.13

Configuración de la PWA

Permitir configurar

- [x] Actualizaciones automáticas
- [ ] Uso de datos
- [x] Caché
- [x] Notificaciones
- [x] Sincronización

Implementación: categoría "Progressive Web App" en Ajustes — `pwa_auto_updates` aplica en el flujo de actualización del SW (14.9), `pwa_background_sync` desactiva la sincronización automática de la cola al reconectar (solo reintento manual vía el indicador de conectividad, respetado desde el layout del dashboard) y las notificaciones se configuran en las preferencias de usuario (13.6). El flag `pwa_offline_cache` queda documentado como operativo (el SW siempre cachea páginas visitadas; desactivarlo por completo exige lógica de bypass en el SW) y el presupuesto de uso de datos sigue pendiente.

Estado

In Progress

Prioridad

P2

---

# Historia 14.14

Auditoría

Registrar

- [x] Instalación
- [x] Actualización
- [x] Sincronización
- [x] Errores Offline
- [x] Recuperación de conexión

Implementación: endpoint `POST /api/pwa/events` (autenticado, tipos `installed|updated|sync_completed|offline_error|reconnected`, con `logAccessOnce` para no duplicar). `InstallPrompt` audita la instalación aceptada, `ServiceWorkerRegister` la actualización aplicada, y `useOfflineQueue` audita `sync_completed` (acciones sincronizadas) y `offline_error` (fallos de ejecución) — la recuperación de conexión se materializa en el propio `sync_completed` al procesar la cola.

Estado

Done

Prioridad

P2

---

# Historia 14.15

Integración

Integrar con

- [x] Dashboard
- [x] Proyectos
- [x] Tareas
- [x] Hitos
- [x] Comentarios
- [x] Archivos
- [x] Notificaciones
- [x] Configuración
- [x] Auditoría

Implementación: la cola offline cubre comentarios de proyecto/tarea, edición de tareas/proyectos y completado (14.8); el cache del SW habilita el modo lectura de proyectos, tareas, hitos, dashboard y centro de notificaciones visitados; la campana de no leídas y los KPIs del dashboard se regeneran al reconectar; la configuración PWA y las preferencias de notificación son parte del flujo, y todos los eventos del ciclo PWA se auditan (14.14).

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación

- Aplicación instalable como PWA.
- Funcionamiento offline para funcionalidades compatibles.
- Sincronización automática al recuperar conexión.
- Caché inteligente implementada.
- Actualizaciones automáticas disponibles.
- Indicadores claros del estado de conexión.
- Compatibilidad con escritorio y dispositivos móviles.
- Integración completa con los módulos principales.

---

# Épica 15 — Configuración del Sistema

## Objetivo

Desarrollar un módulo centralizado de configuración que permita administrar todos los parámetros generales de la plataforma, personalizar su comportamiento, gestionar catálogos, preferencias, seguridad y opciones globales, garantizando flexibilidad y escalabilidad para futuras funcionalidades.

Prioridad

P1

Estado

Done

Dependencias

- Épica 2 — Autenticación
- Épica 3 — Usuarios
- Épica 13 — Notificaciones
- Épica 14 — PWA

---

# Historia 15.1

Configuración General

## Objetivo

Centralizar toda la configuración administrativa del sistema.

### Backend

- [x] Configuración persistente
- [x] Validación
- [x] Auditoría

### Frontend

- [x] Panel administrativo
- [x] Navegación por categorías
- [x] Búsqueda

Implementación: sistema de settings tipado por categorías en `features/settings/settings.definition.ts` (tipos `text/textarea/email/url/number/boolean/select/catalog`, con defaults y opciones), `SettingsService` con `getMap/getValue/setMany` (upsert, parse compatible con filas legacy `{value}`), validación Zod por campo en `schemas/settings.ts`, action `updateSettings` con guard `settings.update` y auditoría (`updated_settings`), y panel `/dashboard/settings` reconstruido con navegación lateral por categorías, búsqueda (filtra por etiqueta/clave) y formularios dinámicos por tipo de campo. Build, TypeScript y ESLint verificados sin errores.

Estado

In Progress

Prioridad

P0

---

# Historia 15.2

Información de la Organización

Administrar

- [x] Nombre de la organización
- [x] Logo
- [x] Descripción
- [x] Correo principal
- [x] Teléfono
- [x] Dirección
- [x] Zona horaria
- [x] Idioma
- [x] Formato de fecha

Implementación: categoría "Organization" en el panel de settings (`organization_name`, `organization_logo` URL, `organization_description`, `organization_email`, `organization_phone`, `organization_address`, `default_timezone`, `default_language`, `date_format`) con validación de email/URL y defaults desde `constants/index.ts`.

Estado

Done

Prioridad

P1

---

# Historia 15.3

Preferencias Globales

Permitir configurar

- [x] Tema
- [x] Modo oscuro
- [x] Formato de hora
- [x] Cantidad de registros por página
- [x] Idioma del sistema
- [x] Página inicial

Implementación: categoría "Global Preferences" (`default_theme`, `dark_mode_enabled`, `time_format`, `records_per_page`, `system_language`, `default_page`) con validación numérica (min/max) y opciones desde `constants/index.ts`.

Estado

Done

Prioridad

P2

---

# Historia 15.4

Configuración de Proyectos

Permitir administrar

- [x] Estados
- [x] Prioridades
- [x] Categorías
- [x] Colores
- [x] Etiquetas
- [ ] Plantillas

Implementación: categoría "Projects" con catálogos editables (`project_statuses` con color, `project_priorities`, `project_categories`) vía componente `CatalogEditor` (listas de items valor/etiqueta/color). Etiquetas ya gestionadas por el módulo Tags; Plantillas pendientes para Historia 15.10.

Estado

Done

Prioridad

P1

---

# Historia 15.5

Configuración de Tareas

Permitir administrar

- [x] Estados
- [x] Prioridades
- [x] Tipos
- [x] Etiquetas
- [ ] Plantillas
- [x] Horas por defecto

Implementación: categoría "Tasks" (`task_statuses` con color, `task_priorities`, `task_types`, `task_default_hours` numérico). Etiquetas ya gestionadas por el módulo Tags; Plantillas pendientes para Historia 15.10.

Estado

Done

Prioridad

P1

---

# Historia 15.6

Configuración de Hitos

Permitir administrar

- [x] Estados
- [x] Colores
- [x] Tipos
- [ ] Plantillas

Implementación: categoría "Milestones" (`milestone_statuses` con color, `milestone_types`). Plantillas pendientes para Historia 15.10.

Estado

Done

Prioridad

P2

---

# Historia 15.7

Configuración de Notificaciones

Permitir definir

- [x] Eventos
- [x] Frecuencia
- [x] Correos automáticos
- [x] Recordatorios
- [ ] Notificaciones Push (futuro)

Implementación: categoría "Notifications" (`notification_events` catálogo de tipos de evento, `notification_frequency`, `auto_emails_enabled`, `reminder_enabled`, `reminder_days`). Notificaciones Push como futuro.

Estado

Done

Prioridad

P1

---

# Historia 15.8

Gestión de Catálogos

Administrar

- [x] Categorías
- [x] Tipos de archivo
- [x] Etiquetas globales
- [x] Estados personalizados

Implementación: categoría "Catalogs" en settings con `allowed_file_types` (catálogo editable de MIME, default desde `constants/index.ts`). Estados personalizados y categorías ya gestionados por las categorías Projects/Tasks/Milestones; etiquetas globales por el módulo Tags.

Estado

Done

Prioridad

P2

---

# Historia 15.9

Seguridad

Configurar

- [x] Tiempo de sesión
- [x] Políticas de contraseña
- [x] Intentos de inicio de sesión
- [x] Bloqueo automático
- [ ] Dispositivos confiables (futuro)

Implementación: categoría "Security" en settings (`session_timeout_minutes`, `password_min_length`, `password_require_uppercase`, `password_require_number`, `password_require_symbol`, `login_max_attempts`, `auto_lock_minutes`) con validación numérica y defaults. Dispositivos confiables como futuro.

Estado

Done

Prioridad

P1

---

# Historia 15.10

Gestión de Plantillas

Crear plantillas para

- [x] Proyectos
- [x] Tareas
- [x] Hitos
- [x] Reportes

Implementación: módulo `features/templates` (migración `00008_templates_sqlite.sql`, tabla `templates` con `entity_type` y `payload` JSON), servicio `TemplatesService` (list/create/update/remove), `schemas/template.ts`, acciones `createTemplate/updateTemplate/deleteTemplate` con guard `settings.update` y auditoría (`created_template`/`updated_template`/`deleted_template`), y página `/dashboard/templates` con CRUD y editor de payload JSON. Enlazado en el sidebar (gated por `ADMIN_ONLY_ROUTES`). TypeScript, ESLint y build verificados; migración aplicada.

Estado

Done

Prioridad

P2

---

# Historia 15.11

Personalización

Permitir configurar

- [x] Colores institucionales
- [x] Logo
- [x] Favicon
- [x] Pantalla de inicio
- [x] Mensajes del sistema

Implementación: categoría "Personalization" en settings (`primary_color` tipo color, `favicon_url`, `system_message`); logo vía `organization_logo` y pantalla de inicio vía `default_page`. El color primario se aplica en runtime (tokens `--color-primary*` pasan a `var(--primary, ...)` en `globals.css`) y el `system_message` se muestra como banner en `/dashboard/layout.tsx`.

Estado

Done

Prioridad

P2

---

# Historia 15.12

Respaldos de Configuración

Permitir

- [x] Exportar configuración
- [x] Importar configuración
- [x] Restaurar valores por defecto

Implementación: acciones `exportSettings` (descarga JSON), `importSettings` (valida cada clave con `validateSettingValue`) y `restoreSettings(categoryId)` (restaura defaults de la categoría), con tarjeta "Backup" y botón "Restore Defaults" en `/dashboard/settings`. TypeScript, ESLint y build verificados.

Estado

Done

Prioridad

P3

---

# Historia 15.13

Permisos

Developer

- [x] Gestión completa

Intermediary

- [x] Sin acceso

Client

- [x] Sin acceso

Administrator

- [ ] Gestión parcial (actualmente sin acceso; conflicto con PRD, ver nota)

Super Administrator

- [x] Gestión completa

Nota de conflicto: el BACKLOG 15.13 indica "Developer: Sin acceso" y "Administrator: Gestión parcial", pero la jerarquía establecida en `lib/auth.ts` (alineada con el PRD/comment de Historia 6.18) otorga a Developer y Super Administrator acceso completo a `settings.*` y deja a Administrator sin acceso. Se mantiene la jerarquía actual por no romper la plataforma; el acceso a configuración está gated por `requirePermission("settings.read/update")` en páginas y acciones.

Estado

In Progress

Prioridad

P0

---

# Historia 15.14

Auditoría

Registrar

- [x] Cambios de configuración
- [x] Cambios de parámetros
- [x] Cambios de seguridad
- [x] Restauraciones
- [x] Importaciones
- [x] Exportaciones

Implementación: eventos en `activity_logs` desde las acciones de settings — `updated_settings` (por categoría con `new_value`), `imported_settings`, `exported_settings`, `restored_settings` — además de `created_template`/`updated_template`/`deleted_template` para plantillas.

Estado

Done

Prioridad

P1

---

# Historia 15.15

Integración

Integrar con

- [x] Usuarios
- [x] Proyectos
- [x] Tareas
- [x] Hitos
- [x] Dashboard
- [x] Reportes
- [x] Notificaciones
- [x] PWA
- [x] Auditoría

Implementación: los catálogos configurados se aplican a los flujos reales. `default_page` redirige tras login (`actions/auth.ts`), `primary_color` como variable CSS (`globals.css` → `var(--primary, ...)`) y `system_message` como banner en el layout del dashboard. Helper `features/settings/catalog.ts` (`getCatalogOptions`/`getCatalogValues`/`isValidCatalogValue`) alimenta los filtros y formularios de Proyectos, Tareas y Hitos (listas y detalle) con estados/prioridades configurados, con fallback a las constantes; las acciones `createProject/updateProject/createTask/updateTask/createSubtask/bulkUpdateTaskStatus/updateMilestone` validan en runtime contra los catálogos configurados. Reportes consume los datos de proyectos/tareas (que ya reflejan los estados configurados).

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación

- Panel centralizado de configuración.
- Configuración persistente.
- Personalización de la plataforma.
- Gestión de catálogos.
- Configuración de seguridad.
- Plantillas reutilizables.
- Auditoría completa.
- Integración con todos los módulos principales.

---

# Épica 16 — Auditoría y Logs del Sistema

## Objetivo

Implementar un sistema integral de auditoría y registro de eventos que permita conocer quién realizó cada acción, cuándo ocurrió, desde dónde se ejecutó y qué información fue modificada, proporcionando trazabilidad completa para fines de seguridad, soporte, cumplimiento y análisis.

Prioridad

P1

Estado

In Progress

Dependencias

- Todas las épicas anteriores

---

# Historia 16.1

Sistema Central de Auditoría

## Objetivo

Implementar un servicio unificado de auditoría para toda la plataforma.

### Backend

- [x] Servicio central de auditoría
- [x] Registro automático
- [x] API de consulta
- [ ] Optimización de consultas

### Frontend

- [x] Panel de auditoría
- [x] Filtros
- [x] Búsqueda
- [ ] Exportación

### QA

- [ ] Registro correcto
- [ ] Rendimiento
- [ ] Permisos

Implementación: `ActivityService` (escritura centralizada) + `ActivityLogService.list` (filtros usuario/entidad/búsqueda, orden y paginación server-side); panel `/dashboard/activity` con vista tabla (TanStack Table) y timeline, protegido por `users.read`. Exportación y QA pendientes.

Estado

In Progress

Prioridad

P0

---

# Historia 16.2

Registro de Acciones

Registrar automáticamente

- [x] Inicio de sesión
- [x] Cierre de sesión
- [ ] Intentos fallidos
- [x] Creación
- [x] Actualización
- [x] Eliminación lógica
- [x] Restauración
- [ ] Exportaciones
- [ ] Descargas
- [x] Subidas de archivos

Implementación: `logged_in`/`logged_out`/`requested_password_reset`/`reset_password` (`actions/auth.ts`), eventos `created_*`/`updated_*`/`archived_*`/`restored_*` por módulo, `uploaded_file`/`deleted_file` (`actions/files.ts`). Pendientes: intentos fallidos, exportaciones y descargas.

Estado

In Progress

Prioridad

P0

---

# Historia 16.3

Auditoría de Proyectos

Registrar

- Proyecto creado
- Proyecto actualizado
- Cambio de estado
- Cambio de responsable
- Cambio de fechas
- Archivado
- Restauración

Implementación parcial: `created_project` registrado (`actions/projects.ts`); actualización, cambios de estado y archivado/restauración de proyectos pendientes.

Estado

In Progress

Prioridad

P0

---

# Historia 16.4

Auditoría de Tareas

Registrar

- [x] Creación
- [x] Edición
- [x] Cambio de prioridad
- [x] Cambio de responsable
- [x] Cambio de estado
- [x] Registro de tiempo
- [x] Eliminación lógica

Implementación: eventos dedicados por operación en `activity_logs` — `created_task` (con valores nuevos), `updated_task` (diff campo a campo), `changed_task_priority` y `assigned_task` (dedicados, Historias 7.10/7.23), `changed_task_status` (con transición old→new), `updated_task_progress`, `created_time_entry`/`deleted_time_entry` y `archived_task`/`restored_task`. Todos visibles en el timeline del detalle de tarea y en el Activity Log global.

Estado

Done

Prioridad

P0

---

# Historia 16.5

Auditoría de Hitos

Registrar

- [x] Creación
- [x] Actualización
- [x] Cambio de fechas
- [x] Cambio de estado
- [x] Asociación de tareas

Implementación: `created_milestone`, `updated_milestone` (diff por campo, incluye fechas), `changed_milestone_status` (transición old→new), `updated_milestone_progress`, `assigned_task_to_milestone`/`removed_task_from_milestone`, `archived_milestone`/`restored_milestone`, `moved_milestone` y `added_milestone_dependency`/`removed_milestone_dependency` (8.8), todos escritos desde `actions/milestones.ts` con `ActivityService.log`.

Estado

Done

Prioridad

P1

---

# Historia 16.6

Auditoría de Archivos

Registrar

- Archivo subido
- Archivo descargado
- Nueva versión
- Archivo eliminado
- Archivo restaurado
- Cambio de permisos

Implementación parcial: `uploaded_file`/`deleted_file` registrados con entidad normalizada y metadatos (`actions/files.ts`); descarga, versiones y permisos pendientes.

Estado

In Progress

Prioridad

P1

---

# Historia 16.7

Auditoría de Usuarios

Registrar

- Inicio de sesión
- Cierre de sesión
- Cambio de contraseña
- Cambio de correo
- Cambio de rol
- Activación
- Desactivación

Implementación mayoritaria: `logged_in`/`logged_out` (`actions/auth.ts`), `changed_password` y actualización de perfil (`actions/profile.ts`), cambio de rol y activación/desactivación con diff (`actions/users.ts`). Cambio de correo pendiente de evento dedicado.

Estado

In Progress

Prioridad

P0

---

# Historia 16.8

Historial de Cambios

Mostrar

- [x] Valor anterior
- [x] Valor nuevo
- [x] Usuario responsable
- [x] Fecha
- [x] Hora

Aplicable a

- [x] Proyectos
- [x] Clientes
- [x] Intermediarios
- [x] Tareas
- [x] Hitos
- [x] Configuración

Implementación: cada evento de `activity_logs` persiste `old_value`/`new_value` como JSON; el Activity Log muestra columna "Changes" con el detalle expandible por fila (resumen `campo: valor anterior → valor nuevo`, `renderChangeSummary` en la tabla) y el timeline lo narra con `getActivityEventDetail`. La configuración registra diffs vía `updated_settings`/`restored_settings`/`imported_settings` (categoría Ajustes).

Estado

Done

Prioridad

P1

---

# Historia 16.9

Filtros Avanzados

Permitir filtrar por

- Usuario
- Fecha
- Módulo
- Acción
- Tipo de recurso
- Proyecto
- Cliente

Implementación: filtros por usuario, entidad (módulo/tipo de recurso), búsqueda de acción (LIKE), rango de fechas y proyecto (proyecto + sus tareas e hitos vía subconsultas) en `/dashboard/activity`; el filtro directo por cliente queda pendiente (cubierto parcialmente por el filtro de entidad).

Estado

In Progress

Prioridad

P1

---

# Historia 16.10

Búsqueda

Buscar registros por

- Usuario
- Acción
- Proyecto
- Recurso
- IP
- Texto

Implementación parcial: búsqueda por acción/entidad (`ActivityLogService.list`) y filtro de usuario; búsqueda por proyecto, recurso e IP pendiente.

Estado

In Progress

Prioridad

P2

---

# Historia 16.11

Exportación

Permitir exportar auditorías

- [x] PDF
- [x] Excel
- [x] CSV

Implementación: botones Export PDF / CSV / Excel en el Activity Log — PDF vía `getActivityExportReport` (acción que audita `exported_activity` y devuelve el `ModuleReport` para el helper compartido) y CSV/XLSX vía `/api/activity/export` (mismos filtros que la página, hasta 5000 registros, auditoría incluida). Ambos reutilizan `lib/exports`/`lib/export-pdf`.

Estado

Done

Prioridad

P2

---

# Historia 16.12

Retención de Registros

Configurar

- [x] Tiempo de retención
- [x] Eliminación automática (cuando aplique)
- [x] Archivado histórico

Implementación: ajuste `audit_retention_days` (Ajustes → Audit, 0 = conservar todo) ejecutado idempóneamente en cada visita al Activity Log (`ActivityLogService.applyRetentionPolicy` con cutoff ISO); la purga se audita como `purged_activity_logs` con el conteo eliminado. El archivado histórico se resuelve con la exportación ZIP global (17.11), que incluye hasta 5000 eventos del log.

Estado

Done

Prioridad

P2

---

# Historia 16.13

Eventos de Seguridad

Registrar

- [x] Accesos denegados
- [x] Errores de permisos
- [x] Intentos sospechosos
- [x] Bloqueos de cuenta
- [x] Cambios críticos

Implementación: `access_denied` en cada denegación de la capa de datos (auth-scope) y `login_failed` en credenciales inválidas (email registrado, sin contraste); cambios críticos = `changed_password`, `changed_role`, `updated_permissions` y eventos de configuración. Bloqueo de cuenta (migración 00014): el proveedor de credenciales cuenta intentos fallidos por usuario y aplica un lockout temporal según `login_max_attempts`/`auto_lock_minutes` (auditado como `account_locked`, contador reseteado y desbloqueado en el siguiente login válido; el formulario informa la hora de desbloqueo). `SECURITY_AUDIT_ACTIONS` + el filtro "Security events only" del Activity Log aísla la vista forense.

Estado

Done

Prioridad

P1

---

# Historia 16.14

Permisos

Developer

- [ ] Sin acceso

Intermediary

- [x] Sin acceso

Client

- [x] Sin acceso

Administrator

- [x] Consulta limitada

Super Administrator
- [x] Acceso completo

Implementación: el Activity Log es admin-only (`canAccessRoute`); Administrator accede en modo consulta — ve tabla/timeline/filtros pero no exportaciones (requieren `users.read`) ni dispara la purga de retención (requiere `settings.update`). Client e Intermediary jamás acceden (UI y URL directa). Nota de arquitectura: el RBAC del proyecto (Historia 6.18/PRD) otorga a Developer el comodín `*`, por lo que mantiene acceso completo de diagnóstico — alinear esa fila de la matriz exigiría cambiar la jerarquía global de permisos (decisión de producto pendiente).

Estado

In Progress

Prioridad

P0

---

# Historia 16.15

Integración

Integrar con

- [x] Usuarios
- [x] Clientes
- [x] Intermediarios
- [x] Proyectos
- [x] Hitos
- [x] Tareas
- [x] Comentarios
- [x] Archivos
- [x] Reportes
- [x] Notificaciones
- [x] Configuración

Implementación: todos los módulos escriben sus eventos en `activity_logs` vía `ActivityService.log` (usuarios/roles/permisos, clientes, intermediarios, proyectos, hitos, tareas — 16.4, comentarios, archivos, reportes con `exported_report`, notificaciones con lectura/descarte/preferencias — 13.13, y configuración con diffs). El log global expone búsqueda, filtros, timeline, exportación (16.11) y clasificación de seguridad (16.13).

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación

- Registro automático de acciones.
- Historial completo de cambios.
- Auditoría por módulo.
- Filtros avanzados.
- Exportación de registros.
- Configuración de retención.
- Eventos de seguridad registrados.
- Integración con todos los módulos.
- Cumplimiento de RBAC y autorización en el servidor.

---

# Épica 17 — Integraciones, API Pública, Automatizaciones y Roadmap Futuro

## Objetivo

Preparar la plataforma para integrarse con sistemas externos, exponer una API segura para futuras aplicaciones, soportar automatizaciones, eventos mediante Webhooks y establecer una arquitectura extensible que permita incorporar nuevas funcionalidades sin afectar el núcleo del sistema.

Prioridad

P2

Estado

In Progress

Dependencias

- Todas las épicas anteriores

---

# Historia 17.1

API Pública

## Objetivo

Diseñar una API segura para permitir futuras integraciones.

### Backend

- [x] Arquitectura REST
- [x] Versionado de API
- [x] Documentación OpenAPI
- [x] Paginación
- [x] Filtros
- [x] Rate Limiting

### QA

- [x] Seguridad
- [ ] Rendimiento
- [x] Versionado

Implementación: `/api/v1/*` — GET de projects, project detail (con tareas/hitos), tasks, clients y milestones (project requerido), read-only, con autenticación Bearer por API key (17.2), limitación de 60 req/min por key, envolvente `{data, pagination, version:"v1"}` y documentación OpenAPI 3.1 en `/api/v1/openapi` importable por Swagger/Postman. La visibilidad de datos replica la del propietario de la key (actor context asíncrono sobre auth-scope). Pendiente: pruebas de carga/rendimiento.

Estado

In Progress

Prioridad

P1

---

# Historia 17.2

Autenticación de API

Implementar

- [x] API Keys
- [x] Tokens de acceso
- [x] Expiración
- [x] Revocación
- [x] Rotación de credenciales

Implementación: tabla `api_keys` (hash SHA-256, prefijo visible, scopes read/write, expiración a 12 meses, `revoked_at`, `last_used_at`); UI de gestión en `/dashboard/integrations` (crear con secret mostrado una sola vez, revocar, eliminar, uso auditado `created_api_key`/`revoked_api_key`/`used_api_key`). Rotación operativa: crear una key nueva y revocar la anterior sin interrumpir el servicio.

Estado

Done

Prioridad

P1

---

# Historia 17.3

Webhooks

Permitir enviar eventos cuando ocurra.

- [x] Proyecto creado
- [x] Proyecto actualizado
- [x] Proyecto finalizado
- [x] Nueva tarea
- [x] Cambio de estado
- [x] Nuevo comentario
- [x] Archivo subido
- [x] Nuevo cliente

Configuración

- [x] URL destino
- [x] Reintentos
- [x] Firma de seguridad
- [x] Historial de entregas

Implementación: tabla `webhooks` + `webhook_deliveries` (cola de reintentos con intentos acotados, timeout de 8s); cada entrega viaja firmada con HMAC-SHA256 (`x-admipy-signature`) y cabecera de evento. El dispatcher corre tras la respuesta HTTP (`after`) alimentado por el bus de eventos (17.7) — project.*, task.*, comment.created, file.uploaded, milestone.completed y client.created. UI en `/dashboard/integrations`: alta (secret mostrado una vez), pausa/activación, "Retry pending" e historial de entregas con estado HTTP/error.

Estado

Done

Prioridad

P1

---

# Historia 17.4

Integración con Calendarios

Preparar integración con

- [x] Google Calendar
- [x] Microsoft Outlook

Funciones

- [x] Sincronizar hitos
- [x] Sincronizar entregas
- [x] Sincronizar recordatorios

Implementación: feed iCalendar en `/api/v1/calendar` (autenticación por API key) con VEVENTs de hitos próximos (50) y tareas con fecha límite no completadas, fechas VALUE=DATE y UIDs estables — importable en Google Calendar ("From URL") y Outlook ("Subscribe from web"). La sincronización es de solo lectura (pull del calendario externo); la bidireccional queda en el roadmap v2 (docs/ROADMAP.md).

Estado

Done

Prioridad

P2

---

# Historia 17.5

Integración con Plataformas de Comunicación

Preparar integración con

- Slack
- Microsoft Teams
- Discord

Funciones

- [ ] Notificaciones
- [ ] Alertas
- [ ] Resúmenes automáticos

Estado

Backlog

Prioridad

P2

Implementación (preparación): el patrón de transporte estándarizado por `EmailService` (interfaz de canal con frecuencia/horas silenciosas) y el bus de eventos (17.7) permite registrar canales Slack/Teams/Discord sin tocar los call sites; los adaptadores concretos quedan para cuando se seleccione proveedor (docs/ROADMAP.md, v4).

---

# Historia 17.6

Automatizaciones

Crear un motor de reglas.

Ejemplos

Si una tarea vence →
Generar notificación.

Si un proyecto finaliza →
Notificar cliente.

Si un archivo se sube →
Registrar actividad.

Si cambia un estado →
Actualizar indicadores.

Implementación: tabla `automation_rules` + `AutomationsService.executeForEvent`: cada regla asocia un evento interno (project.*, task.*, comment.created, file.uploaded, milestone.completed) a una acción — `notify_project_audience` (notificación in-app a la audiencia del proyecto, con dedupe por regla/evento/día) o `webhook_forward`. UI de alta/pausa/borrado en `/dashboard/integrations` con auditoría por cambio; la ejecución se dispara desde el bus (17.7) después de la respuesta.

Estado

Done

Prioridad

P2

---

# Historia 17.7

Motor de Eventos

Implementar un sistema de eventos internos.

Funciones

- [x] Publicación de eventos
- [x] Suscripción
- [x] Procesamiento asíncrono
- [x] Reintentos

Implementación: `lib/events/bus.ts` — `publish` persiste cada evento en `system_events` (log durable) y programa los side-channels con `after()` de next/server (webhooks con cola de reintentos acotados + reglas de automatización + suscriptores in-process registrables vía `subscribe`). Los triggers de notificaciones publican los eventos de la plataforma, de modo que un solo call site alimenta notificaciones, webhooks y automatizaciones; los fallos de un canal nunca bloquean la mutación principal.

Estado

Done

Prioridad

P2

---

# Historia 17.8

Sistema de Plugins (Arquitectura)

Preparar la plataforma para soportar.

- Plugins
- Extensiones
- Módulos personalizados

Sin implementarlos inicialmente.

Implementación (preparación): puntos de extensión ya disponibles y documentados (docs/ROADMAP.md): suscripción al bus de eventos (`subscribe`) para reaccionar a la actividad, entrega vía webhooks firmados para extensiones externas, widgets de dashboard componibles (librería `components/dashboard` alimentada por servicios batcheados — el patrón que un plugin replicaría) y catálogos de ajustes extensibles. El registro formal de plugins queda para la v4.

Estado

In Progress

Prioridad

P3

---

# Historia 17.9

Integración con Inteligencia Artificial

Preparar arquitectura para futuras funciones como.

- Resúmenes automáticos
- Generación de reportes
- Asistentes inteligentes
- Análisis de riesgos
- Estimaciones automáticas
- Clasificación de tareas

Implementación (preparación): las entradas naturales para un servicio de IA ya existen — `system_events` como flujo de actividad normalizado, `ModuleReport` como representación estandar de datos de negocio (KPIs + tablas) reutilizable para resúmenes y generación de reportes, y `buildMilestoneIndicators`/`assessAtRiskProject` como funciones puras de análisis de riesgo listas para ser ampliadas. Los planes de integración están en docs/ROADMAP.md (v3).

Estado

Backlog

Prioridad

P3

---

# Historia 17.10

Importación de Datos

Permitir importar

- [x] Clientes
- [x] Proyectos
- [x] Tareas
- [x] Hitos
- [ ] Usuarios

Formatos

- [x] CSV
- [x] Excel

Implementación: `/dashboard/import` con flujo de dos fases — "Validate" (parser CSV RFC-4180 propio + lectura de hojas .xlsx server-side, mapeo de cabeceras por alias, validación Zod por fila y reporte detallado sin escribir) y "Import" que inserta únicamente las filas válidas: clientes; proyectos que resuelven su cliente por email/empresa (`findByEmailOrCompany`); tareas e hitos que resuelven su proyecto por nombre (`findByName`). Todo con auditoría (`imported_data` + eventos de creación y publicación al bus interno) y permiso por entidad revalidado en cada acción. Importación de usuarios pendiente (requiere política de contraseñas/invitaciones).

Estado

In Progress

Prioridad

P2

---

# Historia 17.11

Exportación Global

Permitir exportar

- [x] Base de proyectos
- [x] Clientes
- [x] Reportes
- [x] Auditoría
- [x] Configuración

Formatos

- [x] ZIP
- [x] CSV
- [x] Excel
- [x] PDF

Implementación: `GET /api/export/global` (roles de acceso completo + `reports.export`) genera un ZIP con CSVs de clientes, proyectos, tareas, hitos, Activity Log (hasta 5000 eventos), configuración y un README con contexto; auditado como `exported_globals`. Los reportes por módulo ya exportan PDF/CSV/Excel desde el centro de Reportes (Épica 12) y el dashboard (11.13), cubriendo los formatos por superficie.

Estado

Done

Prioridad

P2

---

# Historia 17.12

Monitoreo

Registrar

- [x] Rendimiento
- [x] Errores
- [x] Latencia
- [ ] Uso de recursos
- [x] Disponibilidad

Preparado para futuras herramientas de observabilidad.

Implementación: `/api/health` expone estado (ok/degraded), verificación de base de datos con latencia de la consulta en ms, versión y métricas de la API pública — muestras recientes (ring buffer de 100), errores 4xx/5xx, latencia media y máxima de los últimos 50 requests y uptime del proceso (`lib/monitoring.ts` + `withApiMetrics` envolviendo los handlers de `/api/v1/*`). Los errores de integración y ejecución quedan en el Activity Log/consola estructurada. Pendiente: uso de recursos del runtime y exportación de métricas a OTel/Sentry (planificado en docs/ROADMAP.md).

Estado

In Progress

Prioridad

P2

---

# Historia 17.13

Escalabilidad

Preparar la arquitectura para

- Multiempresa (Multi-Tenant)
- Escalado horizontal
- Cache distribuido
- Procesamiento asíncrono
- Colas de trabajo

Implementación (preparación, docs/ROADMAP.md): autorización centralizada en `lib/auth-scope.ts` (un filtro `tenant_id` sería un cambio local), `withActor` para ejecutar consultas como cualquier actor (base del aislamiento por tenant), eventos persistentes (`system_events`) y entregas en cola (`webhook_deliveries`) ejecutadas con `after()` — migrables a colas externas (SQS/Cloudflare Queues) sin cambiar call sites — y consultas agregadas batcheadas sin N+1, envolvente natural para cache distribuido por tenant.

Estado

In Progress

Prioridad

P2

---

# Historia 17.14

Roadmap Técnico

Documentar futuras versiones.

Versión 2

- [x] Gantt interactivo con dependencias SVG visuales, conflictos y zoom (`/dashboard/tasks?view=gantt`)
- Dependencias avanzadas
- Automatizaciones

Versión 3

- IA
- Aplicación móvil nativa
- API pública completa

Versión 4

- Marketplace
- Plugins
- Integraciones premium

Implementación: `docs/ROADMAP.md` documenta el roadmap v2 (Gantt sobre las tablas de dependencias existentes, dependencias avanzadas, automatizaciones visuales, webhooks administrados), v3 (app nativa sobre la API v1, endpoints de escritura/OAuth, funciones de IA sobre system_events/ModuleReport), v4 (marketplace sobre `templates`, plugins sobre el bus de eventos, canales Slack/Teams/Discord) y la preparación multi-tenant.

Estado

Done

Prioridad

P3

---

# Historia 17.15

Permisos

Developer

- [x] Uso de integraciones autorizadas

Intermediary

- [x] Sin acceso administrativo

Client

- [x] Sin acceso administrativo

Administrator

- [ ] Configuración parcial

Super Administrator

- [x] Gestión completa

Implementación: `/dashboard/integrations` y `/dashboard/import` son rutas admin-only (`lib/routes.ts`) y todas las mutaciones exigen `requirePermission("settings.update")` — de acuerdo con la jerarquía de permisos (6.18), Developer y Super Administrator gestionan; Intermediary/Client no acceden. Nota: Administrator no posee `settings.*` en la jerarquía actual, por lo que la "configuración parcial" de esta historia requeriría añadirle un permiso dedicado (decisión de producto pendiente).

Estado

In Progress

Prioridad

P1

---

# Historia 17.16

Auditoría

Registrar

- [x] Uso de API
- [x] Creación de API Keys
- [x] Webhooks enviados
- [x] Automatizaciones ejecutadas
- [x] Errores de integración

Implementación: `used_api` (por endpoint, con dedupe por ventana), `created_api_key`/`revoked_api_key`/`deleted_api_key`, `created_webhook`/`activated_webhook`/`deactivated_webhook`/`deleted_webhook`, `automation_executed` (por ejecución de regla, con evento/acción/notificados) y los errores de entrega persistidos en `webhook_deliveries` (estado HTTP, intentos, error) con visibilidad en la UI de Integraciones. Las entregas de webhook se auditan a través de su historial propio (`webhook_deliveries`).

Estado

Done

Prioridad

P2

---

# Historia 17.17

Integración

Integrar con

- [x] Todos los módulos existentes
- [x] API Pública
- [x] Webhooks
- [x] Auditoría
- [x] Configuración
- [x] Notificaciones

Implementación: el bus interno (17.7) recibe los eventos publicados por los triggers de todos los módulos (proyectos, tareas, hitos, comentarios, archivos, clientes) y los distribuye a la API pública (vía keys), webhooks (firmados), automatizaciones y auditoría; la configuración de canales vive en Ajustes/Integraciones (API keys, webhooks, reglas, PWA) y las notificaciones in-app/email se alimentan de los mismos eventos.

Estado

Done

Prioridad

P1

---

# Criterios de Aceptación

- API preparada para uso futuro.
- Arquitectura preparada para Webhooks.
- Integraciones externas planificadas.
- Motor de automatizaciones diseñado.
- Arquitectura preparada para IA.
- Sistema preparado para Multi-Tenant.
- Roadmap técnico documentado.
- Integración con toda la plataforma.

---
