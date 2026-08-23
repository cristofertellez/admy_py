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

- [ ] Verificar paginación
- [ ] Verificar filtros
- [ ] Verificar búsqueda

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

- [ ] Cambio correcto
- [ ] Cambio reflejado inmediatamente
- [ ] Actualización de permisos

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

- [ ] Información correcta
- [x] Actualización automática
- [x] Responsive

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

Estado

Backlog

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

- [ ] Validar búsqueda
- [ ] Validar filtros
- [ ] Validar paginación
- [ ] Validar rendimiento

Implementación: `/dashboard/clients` con estado en URL (search, status, page), búsqueda debounced server-side (company_name/contact_name/email), filtro de estado, paginación real con `ClientsService.list` (`total` + LIMIT/OFFSET), acciones rápidas View/Edit/Archive-Restore con confirmación y feedback accesible (aria-live). Build, TypeScript y ESLint verificados sin errores.

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

- [ ] Validar actualización
- [ ] Validar historial

Estado

Backlog

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

- [ ] Información correcta
- [ ] Responsive

Implementación: `/dashboard/clients/[id]` reconstruida como vista dashboard con widgets (total/activos/finalizados/horas), pestañas Overview | Projects | Timeline (`client-tabs.tsx`), tarjeta de intermediario asignado, timeline de actividad del cliente reutilizando `ActivityTimeline` y métodos de servicio `getProjects`, `getAssignedIntermediary`, `getRecentActivity` con `assertClientVisible`. Las secciones Archivos y Comentarios se integran en las historias 4.8 y 4.9.

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

Implementación: eventos en `activity_logs` desde la capa de acciones — `created_client`/`updated_client` (con diff old/new por campo), `archived_client`/`restored_client`, `assigned_intermediary`/`removed_intermediary`, `uploaded_file`/`deleted_file` (entidad normalizada a mayúscula inicial: "Client", "Project", etc., para que el historial del cliente los resuelva), `created_project` con referencia al cliente, y comentarios (`created_comment` para proyectos; `created_client_comment`/`replied_client_comment`/`updated_client_comment`/`deleted_client_comment` vía Historia 4.9). Escritura centralizada en `ActivityService.log`; los fallos de auditoría no bloquean la operación principal.

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
- [ ] Búsqueda
- [x] Filtros
- [x] Ordenamiento
- [x] Cantidad de clientes asignados
- [x] Cantidad de proyectos activos

### Frontend

- [x] DataTable
- [ ] Barra de búsqueda
- [ ] Indicadores rápidos
- [ ] Acciones rápidas

### QA

- [ ] Validar filtros
- [ ] Validar búsqueda
- [ ] Validar rendimiento

Estado

Backlog

Prioridad

P0

---

# Historia 5.2

Crear Intermediario

### Backend

- [x] Crear usuario
- [x] Asignar rol Intermediary
- [ ] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Validaciones
- [ ] Confirmación

Campos

- Nombre
- Correo
- Teléfono
- Empresa (opcional)
- Estado

### QA

- [ ] Validar creación
- [ ] Validar correo duplicado

Estado

Backlog

Prioridad

P0

---

# Historia 5.3

Editar Intermediario

### Backend

- [ ] Actualizar información
- [ ] Registrar auditoría

### Frontend

- [x] Formulario
- [ ] Confirmación

### QA

- [ ] Validar actualización

Estado

Backlog

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
- [ ] Registrar auditoría

### Frontend

- [ ] Selector múltiple
- [x] Lista de clientes asignados
- [x] Buscador

### QA

- [ ] Asignación correcta
- [ ] Eliminación correcta

Estado

Backlog

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
- [ ] Timeline
- [ ] Navegación por pestañas

### QA

- [ ] Información correcta
- [ ] Responsive

Estado

Backlog

Prioridad

P0

---

# Historia 5.6

Panel del Intermediario

## Objetivo

Crear un panel exclusivo para el rol Intermediary.

### Widgets

- [ ] Clientes activos
- [ ] Proyectos activos
- [ ] Proyectos próximos a vencer
- [ ] Tareas pendientes
- [ ] Últimos comentarios
- [x] Actividad reciente

### QA

- [ ] Actualización automática
- [ ] Información correcta

Estado

Backlog

Prioridad

P0

---

# Historia 5.7

Seguimiento de Proyectos

### Backend

- [ ] Obtener proyectos asignados
- [ ] Calcular progreso
- [ ] Obtener estado
- [ ] Obtener porcentaje completado

### Frontend

- [ ] Lista de proyectos
- [ ] Tarjetas
- [ ] Barra de progreso
- [ ] Estado visual
- [ ] Fechas importantes

### QA

- [ ] Progreso correcto
- [ ] Estados correctos

Estado

Backlog

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

Estado

Backlog

Prioridad

P0

---

# Historia 5.9

Comentarios

### Backend

- [ ] Crear comentario
- [ ] Editar comentario propio
- [ ] Responder comentarios
- [ ] Registrar auditoría

### Frontend

- [ ] Timeline
- [ ] Editor enriquecido
- [ ] Menciones
- [ ] Adjuntar archivos

### QA

- [ ] Crear
- [ ] Editar
- [ ] Responder

Estado

Backlog

Prioridad

P1

---

# Historia 5.10

Archivos Compartidos

### Backend

- [ ] Consultar archivos
- [ ] Subir archivos permitidos
- [ ] Descargar archivos
- [ ] Registrar actividad

### Frontend

- [ ] Lista
- [ ] Vista previa
- [ ] Descarga

### QA

- [ ] Permisos
- [ ] Restricciones

Estado

Backlog

Prioridad

P1

---

# Historia 5.11

Notificaciones

### Mostrar

- [ ] Proyecto actualizado
- [ ] Nuevo comentario
- [ ] Nueva tarea visible
- [ ] Proyecto finalizado
- [ ] Proyecto retrasado
- [ ] Fecha límite próxima

### QA

- [ ] Recepción correcta
- [ ] Sin duplicados

Estado

Backlog

Prioridad

P2

---

# Historia 5.12

Reportes del Intermediario

### Reportes

- [ ] Proyectos activos
- [ ] Proyectos finalizados
- [ ] Estado de clientes
- [ ] Productividad
- [ ] Próximas entregas

### Exportaciones

- [ ] PDF
- [ ] Excel
- [ ] CSV

Estado

Backlog

Prioridad

P2

---

# Historia 5.13

Auditoría

Registrar.

- [ ] Inicio de sesión
- [ ] Asignación de clientes
- [ ] Comentarios
- [ ] Descarga de archivos
- [ ] Consulta de proyectos
- [ ] Cambios de perfil

Estado

Backlog

Prioridad

P1

---

# Historia 5.14

Restricciones del Rol

El intermediario NO podrá.

- [x] Crear usuarios
- [ ] Eliminar clientes
- [ ] Modificar permisos
- [x] Cambiar roles
- [ ] Ver proyectos no asignados
- [ ] Acceder a información interna del Developer
- [ ] Modificar configuraciones globales

### QA

- [ ] Validar RBAC
- [ ] Validar autorización a nivel de datos
- [ ] Intentos de acceso indebido

Estado

Backlog

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
- [ ] Búsqueda
- [x] Filtros
- [ ] Conteo total
- [ ] Consulta optimizada

### Frontend

- [x] DataTable
- [ ] Búsqueda
- [x] Filtros rápidos
- [x] Filtros avanzados
- [ ] Acciones masivas
- [ ] Columnas configurables

Filtros

- Estado
- Cliente
- Intermediario
- Responsable
- Prioridad
- Fecha de inicio
- Fecha límite
- Etiquetas

### QA

- [ ] Rendimiento
- [ ] Búsqueda
- [ ] Responsive
- [ ] Permisos

Estado

Backlog

Prioridad

P0

---

# Historia 6.2

Crear Proyecto

### Backend

- [x] Crear Server Action
- [ ] Validar datos
- [ ] Registrar proyecto
- [ ] Registrar auditoría

### Frontend

- [x] Formulario completo
- [x] Validaciones Zod
- [ ] Confirmación

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
- Color
- Etiquetas

### QA

- [x] Validaciones
- [ ] Duplicados
- [ ] Permisos

Estado

Backlog

Prioridad

P0

---

# Historia 6.3

Editar Proyecto

### Backend

- [ ] Actualizar información
- [ ] Validar cambios
- [ ] Registrar auditoría

### Frontend

- [x] Formulario
- [ ] Historial de cambios

### QA

- [ ] Actualización
- [ ] Auditoría

Estado

Backlog

Prioridad

P0

---

# Historia 6.4

Estados del Proyecto

Estados disponibles

- Borrador
- Planificado
- Activo
- En revisión
- Suspendido
- Finalizado
- Cancelado
- Archivado

### Backend

- [ ] Validar transiciones
- [ ] Registrar cambios

### QA

- [ ] Estados válidos
- [ ] Estados inválidos

Estado

Backlog

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

- [ ] Cálculos correctos

Estado

Backlog

Prioridad

P0

---

# Historia 6.7

Asignación de Responsables

### Backend

- [ ] Asignar Developers
- [ ] Asignar Intermediarios
- [x] Asignar cliente

### Frontend

- [ ] Selector múltiple
- [ ] Gestión de miembros

### QA

- [ ] Permisos
- [ ] Duplicados

Estado

Backlog

Prioridad

P0

---

# Historia 6.8

Dashboard del Proyecto

Widgets

- [ ] Estado actual
- [ ] Progreso
- [ ] Horas
- [ ] Próximos hitos
- [x] Actividad reciente
- [ ] Últimos comentarios
- [ ] Últimos archivos
- [ ] Riesgos
- [ ] Indicadores

Estado

Backlog

Prioridad

P0

---

# Historia 6.9

Indicadores del Proyecto

Calcular automáticamente

- [ ] % completado
- [ ] % retraso
- [ ] Horas utilizadas
- [ ] Horas restantes
- [ ] Productividad
- [ ] Riesgo
- [ ] Salud del proyecto

Estado

Backlog

Prioridad

P1

---

# Historia 6.10

Etiquetas

### Backend

- [ ] Crear etiquetas
- [ ] Editar etiquetas
- [ ] Eliminar etiquetas

### Frontend

- [ ] Selector
- [ ] Colores
- [x] Filtros

Estado

Backlog

Prioridad

P2

---

# Historia 6.11

Archivar Proyecto

### Backend

- [x] Cambio de estado
- [ ] Validar dependencias
- [ ] Registrar auditoría

### QA

- [ ] Restauración
- [ ] Restricciones

Estado

Backlog

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

Backlog

Prioridad

P0

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

Backlog

Prioridad

P0

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

Backlog

Prioridad

P1

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

Backlog

Prioridad

P2

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

- Creación
- Edición
- Eliminación lógica
- Cambio de estado
- Asignaciones
- Cambios de fechas
- Cambios de estimaciones
- Archivos
- Comentarios

Estado

Backlog

Prioridad

P1

---

# Historia 6.18

Permisos

Developer

- [ ] Acceso completo

Intermediary

- [ ] Solo proyectos asignados

Client

- [ ] Solo sus proyectos

Administrator

- [ ] Gestión completa

Super Administrator

- [ ] Acceso total

### QA

- [ ] RBAC
- [ ] Control de acceso a datos
- [ ] Accesos indebidos

Estado

Backlog

Prioridad

P0

---

# Historia 6.19

Exportación

Permitir exportar

- PDF
- Excel
- CSV

Incluyendo

- Información general
- Cronograma
- Indicadores
- Progreso
- Horas
- Actividad

Estado

Backlog

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

Backlog

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
- [ ] Búsqueda
- [x] Ordenamiento
- [x] Filtros
- [ ] Conteo total

### Frontend

- [x] DataTable
- [ ] Búsqueda rápida
- [x] Filtros avanzados
- [ ] Acciones masivas
- [ ] Columnas configurables

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

Estado

Backlog

Prioridad

P0

---

# Historia 7.2

Crear Tarea

### Backend

- [x] Crear Server Action
- [ ] Validar datos
- [ ] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Validaciones Zod
- [ ] Confirmación

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

Estado

Backlog

Prioridad

P0

---

# Historia 7.3

Editar Tarea

### Backend

- [ ] Actualizar información
- [ ] Registrar auditoría

### Frontend

- [x] Formulario de edición
- [ ] Historial de cambios

### QA

- [x] Validaciones
- [ ] Auditoría

Estado

Backlog

Prioridad

P0

---

# Historia 7.4

Eliminar / Archivar Tarea

### Backend

- [ ] Eliminación lógica
- [ ] Restauración
- [ ] Auditoría

### Frontend

- [x] Confirm Dialog

Estado

Backlog

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

- [ ] Validar transiciones
- [ ] Registrar historial

Estado

Backlog

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

- [ ] Configurar prioridades

### Frontend

- [x] Indicadores visuales
- [x] Filtros

Estado

Backlog

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

- [ ] Lista de subtareas
- [ ] Checkbox
- [ ] Reordenamiento

### QA

- [ ] Cálculo correcto
- [ ] Persistencia

Estado

Backlog

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

- [ ] CRUD dependencias
- [ ] Validar ciclos

### QA

- [ ] Detectar dependencias inválidas

Estado

Backlog

Prioridad

P1

---

# Historia 7.10

Asignación de Responsables

### Backend

- [ ] Asignar usuario
- [ ] Reasignar
- [ ] Registrar auditoría

### Frontend

- [ ] Selector de usuarios
- [ ] Indicador del responsable

Estado

Backlog

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

- [ ] Registro manual
- [x] Validaciones

### Frontend

- [x] Formulario
- [ ] Historial

Estado

Backlog

Prioridad

P1

---

# Historia 7.12

Temporizador

### Funciones

- [ ] Iniciar
- [ ] Pausar
- [ ] Reanudar
- [ ] Finalizar

### QA

- [ ] Tiempo correcto
- [ ] Persistencia

Estado

Backlog

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

- [ ] Drag & Drop
- [ ] Contadores
- [ ] Indicadores
- [ ] Scroll infinito (futuro)

Estado

Backlog

Prioridad

P0

---

# Historia 7.14

Vista Lista

### Funciones

- [ ] Tabla
- [x] Ordenamiento
- [x] Filtros
- [ ] Acciones rápidas

Estado

Backlog

Prioridad

P0

---

# Historia 7.15

Vista Calendario

Mostrar

- Inicio
- Fecha límite
- Retrasos
- Entregas

Estado

Backlog

Prioridad

P2

---

# Historia 7.16

Vista Timeline

Mostrar

- Inicio
- Avance
- Cambios
- Eventos importantes

Estado

Backlog

Prioridad

P2

---

# Historia 7.17

Etiquetas

### Backend

- [ ] CRUD etiquetas

### Frontend

- [ ] Selector
- [ ] Colores
- [x] Filtros

Estado

Backlog

Prioridad

P2

---

# Historia 7.18

Indicadores Automáticos

Calcular

- % completado
- Horas restantes
- Retraso
- Productividad
- Estado general

Estado

Backlog

Prioridad

P1

---

# Historia 7.19

Actividad

Registrar automáticamente

- Creación
- Edición
- Cambio de estado
- Cambio de responsable
- Comentarios
- Archivos
- Tiempo registrado

### Frontend

- [ ] Timeline

Estado

Backlog

Prioridad

P1

---

# Historia 7.20

Notificaciones

Enviar cuando

- Se asigna una tarea
- Cambia el estado
- Se acerca la fecha límite
- La tarea está bloqueada
- Se completa la tarea
- Hay un nuevo comentario

Estado

Backlog

Prioridad

P1

---

# Historia 7.21

Búsqueda Global

Buscar por

- Nombre
- Responsable
- Proyecto
- Etiquetas
- Estado
- Prioridad

Estado

Backlog

Prioridad

P2

---

# Historia 7.22

Permisos

Developer

- [ ] Gestión completa

Intermediary

- [ ] Visualizar tareas permitidas
- [ ] Comentar tareas permitidas

Client

- [ ] Solo visualizar tareas compartidas

Administrator

- [ ] Gestión completa

Super Administrator

- [ ] Acceso total

### QA

- [ ] RBAC
- [ ] Control de acceso a datos
- [ ] Accesos indebidos

Estado

Backlog

Prioridad

P0

---

# Historia 7.23

Auditoría

Registrar

- Creación
- Edición
- Eliminación lógica
- Asignaciones
- Cambios de estado
- Tiempo registrado
- Dependencias
- Subtareas
- Checklists

Estado

Backlog

Prioridad

P1

---

# Historia 7.24

Integración con otros módulos

Integraciones

- Proyectos
- Comentarios
- Archivos
- Notificaciones
- Dashboard
- Reportes
- Auditoría
- Calendario

Estado

Backlog

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

- [ ] Obtener listado de hitos
- [x] Ordenamiento
- [ ] Búsqueda
- [x] Filtros

### Frontend

- [ ] Vista en tabla
- [ ] Vista tipo Timeline
- [ ] Indicadores rápidos
- [ ] Acciones rápidas

### QA

- [ ] Rendimiento
- [ ] Permisos
- [ ] Responsive

Estado

Backlog

Prioridad

P0

---

# Historia 8.2

Crear Hito

### Backend

- [x] Crear Server Action
- [ ] Validar datos
- [ ] Registrar auditoría

### Frontend

- [x] Formulario
- [x] Validaciones Zod
- [ ] Confirmación

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
- [ ] Creación correcta

Estado

Backlog

Prioridad

P0

---

# Historia 8.3

Editar Hito

### Backend

- [ ] Actualizar información
- [ ] Registrar auditoría

### Frontend

- [x] Formulario de edición
- [ ] Historial de cambios

### QA

- [ ] Actualización correcta

Estado

Backlog

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

- [ ] Validar transiciones
- [ ] Registrar historial

Estado

Backlog

Prioridad

P0

---

# Historia 8.5

Asignación de Tareas

### Backend

- [ ] Relacionar tareas
- [ ] Reordenar tareas
- [ ] Mover tareas entre hitos

### Frontend

- [ ] Selector de tareas
- [ ] Drag & Drop
- [ ] Reordenamiento

### QA

- [ ] Persistencia
- [ ] Orden correcto

Estado

Backlog

Prioridad

P0

---

# Historia 8.6

Progreso Automático

Calcular automáticamente

- [ ] Total de tareas
- [ ] Tareas completadas
- [ ] Porcentaje de avance
- [ ] Horas estimadas
- [ ] Horas utilizadas
- [ ] Horas restantes

Estado

Backlog

Prioridad

P0

---

# Historia 8.7

Cronograma del Hito

### Backend

- [ ] Registrar fechas
- [ ] Detectar retrasos
- [ ] Calcular duración

### Frontend

- [ ] Timeline
- [ ] Calendario
- [x] Indicadores visuales

Estado

Backlog

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

- [ ] CRUD dependencias
- [ ] Validar ciclos

### QA

- [ ] Dependencias válidas

Estado

Backlog

Prioridad

P2

---

# Historia 8.9

Indicadores

Mostrar

- % completado
- Horas utilizadas
- Horas restantes
- Retraso
- Estado general
- Riesgo

Estado

Backlog

Prioridad

P1

---

# Historia 8.10

Vista del Cliente

Permitir visualizar

- Hitos completados
- Hitos activos
- Próximos hitos
- Barra de progreso
- Fechas importantes

Sin permitir modificaciones.

Estado

Backlog

Prioridad

P0

---

# Historia 8.11

Vista del Intermediario

Permitir visualizar

- Hitos de sus proyectos
- Estado
- Avance
- Próximas entregas
- Actividad reciente

Estado

Backlog

Prioridad

P0

---

# Historia 8.12

Timeline del Proyecto

Mostrar

- Inicio del proyecto
- Hitos
- Fechas clave
- Retrasos
- Finalización

### Frontend

- [ ] Timeline interactivo
- [ ] Zoom
- [ ] Navegación

Estado

Backlog

Prioridad

P1

---

# Historia 8.13

Auditoría

Registrar

- Creación
- Edición
- Cambio de estado
- Cambio de fechas
- Asignación de tareas
- Eliminación lógica

Estado

Backlog

Prioridad

P1

---

# Historia 8.14

Integración

Integraciones obligatorias

- Proyectos
- Tareas
- Dashboard
- Reportes
- Comentarios
- Archivos
- Notificaciones
- Auditoría

Estado

Backlog

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

In Progress

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

- [ ] Crear modelo Comment
- [ ] Crear relaciones
- [ ] Registrar auditoría

### Frontend

- [ ] Editor de comentarios
- [ ] Lista cronológica
- [ ] Scroll automático

### QA

- [ ] Crear comentario
- [ ] Mostrar comentarios
- [ ] Orden cronológico

Estado

Backlog

Prioridad

P0

---

# Historia 9.2

Comentarios por Proyecto

Cada proyecto deberá tener su propio historial de comentarios.

### Funciones

- [ ] Crear comentario
- [ ] Editar comentario propio
- [ ] Eliminar comentario propio
- [ ] Responder comentarios

### QA

- [x] Validar permisos
- [ ] Validar historial

Estado

Backlog

Prioridad

P0

---

# Historia 9.3

Comentarios por Tarea

### Funciones

- [ ] Conversación independiente
- [ ] Historial
- [ ] Respuestas

Estado

Backlog

Prioridad

P0

---

# Historia 9.4

Comentarios por Hito

### Funciones

- [ ] Crear conversación
- [ ] Respuestas
- [ ] Historial

Estado

Backlog

Prioridad

P1

---

# Historia 9.5

Editor Enriquecido

### Funciones

- [ ] Markdown básico
- [ ] Negritas
- [ ] Cursivas
- [ ] Código
- [ ] Listas
- [ ] Enlaces

Estado

Backlog

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

- [ ] Detectar menciones
- [ ] Registrar destinatarios

### Frontend

- [ ] Autocompletado
- [ ] Resaltado

Estado

Backlog

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

- [ ] Subida correcta
- [ ] Descarga

Estado

Backlog

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

Backlog

Prioridad

P3

---

# Historia 9.9

Edición de Comentarios

### Backend

- [ ] Editar comentario
- [ ] Registrar edición

### Frontend

- [ ] Indicador "Editado"

Estado

Backlog

Prioridad

P1

---

# Historia 9.10

Eliminar Comentarios

### Backend

- [ ] Eliminación lógica
- [ ] Restauración
- [ ] Auditoría

Estado

Backlog

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

Backlog

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

Backlog

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

Backlog

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

Backlog

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

Backlog

Prioridad

P2

---

# Historia 9.16

Notificaciones Integradas

Generar notificaciones cuando.

- Existe una mención
- Responden un comentario
- Se agrega un archivo
- Cambia el estado
- Se crea una tarea

Estado

Backlog

Prioridad

P1

---

# Historia 9.17

Permisos

Developer

- [ ] Acceso completo

Intermediary

- [ ] Ver comentarios autorizados
- [ ] Crear comentarios

Client

- [ ] Ver comentarios compartidos
- [ ] Comentar únicamente cuando esté permitido

Administrator

- [ ] Gestión completa

Super Administrator

- [ ] Acceso total

Estado

Backlog

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

Backlog

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

Backlog

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

In Progress

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
- [ ] Búsqueda
- [x] Ordenamiento
- [x] Filtros
- [ ] Conteo de archivos

### Frontend

- [x] DataTable
- [ ] Vista en cuadrícula
- [ ] Vista en lista
- [ ] Selector de vista

Filtros

- Proyecto
- Cliente
- Hito
- Tarea
- Tipo de archivo
- Fecha
- Usuario

### QA

- [ ] Rendimiento
- [ ] Permisos
- [ ] Responsive

Estado

Backlog

Prioridad

P0

---

# Historia 10.2

Subida de Archivos

### Backend

- [ ] Integrar Cloudflare R2
- [ ] Validar tamaño
- [ ] Validar tipo MIME
- [ ] Registrar auditoría

### Frontend

- [ ] Drag & Drop
- [ ] Selector de archivos
- [ ] Barra de progreso
- [ ] Cancelar carga

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

- [ ] Validar tamaño máximo
- [ ] Validar extensiones
- [ ] Validar subida múltiple

Estado

Backlog

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

Backlog

Prioridad

P1

---

# Historia 10.4

Versionado

## Objetivo

Mantener un historial de versiones de un mismo archivo.

Funciones

- [ ] Subir nueva versión
- [ ] Consultar historial
- [ ] Restaurar versión
- [ ] Comparar versiones (preparado)

Estado

Backlog

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

- [ ] Renderizado correcto
- [ ] Responsive

Estado

Backlog

Prioridad

P1

---

# Historia 10.6

Descarga de Archivos

### Backend

- [ ] Generar URL segura
- [x] Validar permisos
- [ ] Registrar descarga

### Frontend

- [ ] Botón Descargar
- [ ] Descarga individual
- [ ] Descarga múltiple (ZIP)

Estado

Backlog

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

- [ ] Persistencia
- [ ] Auditoría

Estado

Backlog

Prioridad

P2

---

# Historia 10.8

Eliminar Archivos

### Backend

- [ ] Eliminación lógica
- [ ] Eliminación permanente (solo administradores)
- [ ] Restauración

### QA

- [x] Validar permisos
- [ ] Validar restauración

Estado

Backlog

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

Backlog

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

Backlog

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

Backlog

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

Backlog

Prioridad

P2

---

# Historia 10.13

Permisos

Developer

- [ ] Acceso completo

Intermediary

- [ ] Acceso a archivos de proyectos asignados

Client

- [ ] Acceso únicamente a archivos compartidos

Administrator

- [ ] Gestión completa

Super Administrator

- [ ] Acceso total

### QA

- [ ] Validar RBAC
- [ ] Validar autorización a nivel de datos

Estado

Backlog

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

Backlog

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

Backlog

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

- [ ] Obtener métricas generales
- [ ] Optimizar consultas
- [ ] Implementar caché donde aplique

### Frontend

- [ ] Layout responsive
- [ ] Sistema de widgets
- [ ] Grid adaptable
- [ ] Persistencia de la disposición

Estado

Backlog

Prioridad

P0

---

# Historia 11.2

Dashboard del Developer

Mostrar

- [ ] Total de proyectos
- [ ] Proyectos activos
- [ ] Proyectos en riesgo
- [ ] Proyectos finalizados
- [ ] Tareas pendientes
- [ ] Tareas vencidas
- [ ] Próximas entregas
- [ ] Últimos comentarios
- [ ] Últimos archivos
- [x] Actividad reciente
- [ ] Clientes activos
- [ ] Intermediarios activos

Estado

Backlog

Prioridad

P0

---

# Historia 11.3

Dashboard del Cliente

Mostrar únicamente

- [ ] Sus proyectos
- [ ] Estado de cada proyecto
- [ ] Porcentaje de avance
- [ ] Próximos hitos
- [ ] Últimos archivos compartidos
- [ ] Comentarios recientes
- [ ] Próximas entregas

Estado

Backlog

Prioridad

P0

---

# Historia 11.4

Dashboard del Intermediario

Mostrar

- [ ] Clientes asignados
- [ ] Proyectos activos
- [ ] Proyectos finalizados
- [ ] Proyectos con retraso
- [ ] Próximas entregas
- [ ] Comentarios recientes
- [x] Actividad reciente

Estado

Backlog

Prioridad

P0

---

# Historia 11.5

Widgets

Crear widgets reutilizables.

- [ ] KPI Card
- [ ] Progress Card
- [ ] Timeline Card
- [ ] Activity Card
- [ ] Calendar Card
- [ ] Files Card
- [ ] Comments Card
- [ ] Tasks Card
- [ ] Milestones Card
- [ ] Notifications Card

Estado

Backlog

Prioridad

P0

---

# Historia 11.6

Gráficos

Implementar

- [ ] Proyectos por estado
- [ ] Tareas por estado
- [ ] Progreso por proyecto
- [ ] Horas estimadas vs reales
- [ ] Productividad semanal
- [ ] Productividad mensual
- [ ] Actividad por usuario

Estado

Backlog

Prioridad

P1

---

# Historia 11.7

Indicadores (KPIs)

Calcular automáticamente

- [ ] Total de proyectos
- [ ] Proyectos activos
- [ ] Proyectos finalizados
- [ ] Horas estimadas
- [ ] Horas reales
- [ ] Productividad
- [ ] Cumplimiento de fechas
- [ ] Riesgo del proyecto
- [ ] Tareas completadas
- [ ] Tareas pendientes

Estado

Backlog

Prioridad

P0

---

# Historia 11.8

Calendario

Mostrar

- [ ] Próximas entregas
- [ ] Fechas límite
- [ ] Hitos
- [ ] Eventos importantes
- [ ] Recordatorios

Estado

Backlog

Prioridad

P1

---

# Historia 11.9

Actividad Reciente

Mostrar

- [ ] Últimos proyectos
- [ ] Últimas tareas
- [ ] Últimos comentarios
- [ ] Últimos archivos
- [ ] Cambios importantes

Estado

Backlog

Prioridad

P0

---

# Historia 11.10

Proyectos en Riesgo

Detectar automáticamente

- [ ] Retrasos
- [ ] Exceso de horas
- [ ] Hitos vencidos
- [ ] Tareas bloqueadas
- [ ] Baja productividad

Estado

Backlog

Prioridad

P1

---

# Historia 11.11

Dashboard Personalizable

Permitir

- [ ] Reordenar widgets
- [ ] Mostrar u ocultar widgets
- [ ] Guardar configuración
- [ ] Restaurar configuración

Estado

Backlog

Prioridad

P2

---

# Historia 11.12

Filtros Globales

Permitir filtrar por

- Proyecto
- Cliente
- Intermediario
- Fecha
- Estado
- Prioridad

Estado

Backlog

Prioridad

P1

---

# Historia 11.13

Exportación

Exportar Dashboard como

- [ ] PDF
- [ ] Imagen
- [ ] Excel (datos)

Estado

Backlog

Prioridad

P2

---

# Historia 11.14

Actualización en Tiempo Real

Implementar

- [ ] Actualización automática
- [ ] Refetch inteligente
- [ ] Indicador de sincronización

Estado

Backlog

Prioridad

P1

---

# Historia 11.15

Responsive

Optimizar para

- [ ] Escritorio
- [ ] Tablet
- [ ] PWA móvil

Estado

Backlog

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

Estado

Backlog

Prioridad

P0

---

# Historia 11.17

Auditoría

Registrar

- [ ] Exportaciones
- [ ] Cambios de configuración
- [ ] Widgets personalizados
- [ ] Accesos al Dashboard

Estado

Backlog

Prioridad

P2

---

# Historia 11.18

Integración

Integrar con

- Proyectos
- Clientes
- Intermediarios
- Tareas
- Hitos
- Archivos
- Comentarios
- Reportes
- Notificaciones

Estado

Backlog

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

- [ ] Obtener listado de reportes
- [x] Validar permisos
- [ ] Registrar auditoría

### Frontend

- [ ] Pantalla principal
- [ ] Categorías
- [x] Buscador
- [ ] Favoritos

Estado

Backlog

Prioridad

P1

---

# Historia 12.2

Reporte de Proyectos

Mostrar

- [ ] Total de proyectos
- [ ] Proyectos activos
- [ ] Proyectos finalizados
- [ ] Proyectos cancelados
- [ ] Estado por proyecto
- [ ] Tiempo estimado vs real
- [ ] Riesgo
- [ ] Productividad

Exportar

- [ ] PDF
- [ ] Excel
- [ ] CSV

Estado

Backlog

Prioridad

P1

---

# Historia 12.3

Reporte de Clientes

Mostrar

- [ ] Clientes activos
- [ ] Clientes inactivos
- [ ] Cantidad de proyectos
- [ ] Estado general
- [ ] Última actividad

Estado

Backlog

Prioridad

P1

---

# Historia 12.4

Reporte de Intermediarios

Mostrar

- [ ] Clientes asignados
- [ ] Proyectos asignados
- [ ] Avance promedio
- [ ] Actividad

Estado

Backlog

Prioridad

P1

---

# Historia 12.5

Reporte de Tareas

Mostrar

- [ ] Total de tareas
- [ ] Completadas
- [ ] Pendientes
- [ ] Bloqueadas
- [ ] Retrasadas
- [ ] Productividad

Estado

Backlog

Prioridad

P1

---

# Historia 12.6

Reporte de Hitos

Mostrar

- [ ] Hitos completados
- [ ] Hitos pendientes
- [ ] Retrasos
- [ ] Cumplimiento

Estado

Backlog

Prioridad

P2

---

# Historia 12.7

Reporte de Horas

Calcular

- [ ] Horas estimadas
- [ ] Horas reales
- [ ] Horas restantes
- [ ] Desviación

Estado

Backlog

Prioridad

P1

---

# Historia 12.8

Reporte de Productividad

Indicadores

- [ ] Proyectos finalizados
- [ ] Tareas completadas
- [ ] Horas trabajadas
- [ ] Cumplimiento de fechas
- [ ] Tendencias

Estado

Backlog

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

Backlog

Prioridad

P1

---

# Historia 12.10

Exportaciones

Permitir exportar

- [ ] PDF
- [ ] Excel
- [ ] CSV

Aplicable a

- Reportes
- Tablas
- Dashboards
- Estadísticas

Estado

Backlog

Prioridad

P1

---

# Historia 12.11

Programación de Reportes

Permitir

- [ ] Generación manual
- [ ] Generación automática
- [ ] Programación futura (preparado)

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

Backlog

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

Backlog

Prioridad

P1

---

# Historia 12.14

Gráficos

Implementar

- [ ] Barras
- [ ] Líneas
- [ ] Pastel
- [ ] Área
- [ ] Indicadores KPI

Estado

Backlog

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

Backlog

Prioridad

P2

---

# Historia 12.16

Permisos

Developer

- [ ] Todos los reportes

Intermediary

- [ ] Reportes propios

Client

- [ ] Reportes de sus proyectos

Administrator

- [ ] Gestión completa

Super Administrator

- [ ] Acceso completo

Estado

Backlog

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

Backlog

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

- [ ] Obtener notificaciones
- [ ] Paginación
- [ ] Búsqueda
- [x] Filtros

### Frontend

- [ ] Panel de notificaciones
- [ ] Indicador de no leídas
- [ ] Agrupación por fecha
- [ ] Scroll infinito

Estado

Backlog

Prioridad

P0

---

# Historia 13.2

Notificaciones In-App

Generar automáticamente cuando ocurra alguno de los siguientes eventos.

- [ ] Proyecto creado
- [ ] Proyecto actualizado
- [x] Cambio de estado
- [ ] Nueva tarea
- [ ] Nueva subtarea
- [ ] Nuevo comentario
- [ ] Nuevo archivo
- [ ] Hito completado
- [ ] Fecha límite próxima
- [ ] Proyecto finalizado

Estado

Backlog

Prioridad

P0

---

# Historia 13.3

Notificaciones por Correo Electrónico

Permitir enviar correos cuando exista.

- [ ] Asignación de proyecto
- [ ] Cambio importante
- [ ] Comentario mencionado
- [ ] Recordatorio
- [ ] Entrega próxima
- [ ] Proyecto finalizado

Configuración

- [ ] Activar
- [ ] Desactivar
- [ ] Personalizar frecuencia

Estado

Backlog

Prioridad

P1

---

# Historia 13.4

Notificaciones Push (Preparado)

Preparar la arquitectura para futuras notificaciones Push en la PWA.

### Backend

- [ ] Modelo de suscripción
- [ ] Registro de dispositivos
- [ ] Gestión de tokens

### Frontend

- [ ] Solicitar permisos
- [ ] Registrar dispositivo

Estado

Backlog

Prioridad

P2

---

# Historia 13.5

Recordatorios Automáticos

Enviar recordatorios para.

- [ ] Próximas entregas
- [ ] Hitos próximos
- [ ] Tareas vencidas
- [ ] Proyectos sin actividad
- [ ] Comentarios sin responder

Estado

Backlog

Prioridad

P1

---

# Historia 13.6

Preferencias de Notificaciones

Permitir configurar.

- [ ] Canales
- [ ] Frecuencia
- [ ] Horario permitido
- [ ] Tipos de eventos

Estado

Backlog

Prioridad

P1

---

# Historia 13.7

Centro de Actividad

Mostrar cronológicamente.

- [ ] Cambios de proyectos
- [ ] Cambios de tareas
- [ ] Comentarios
- [ ] Archivos
- [ ] Hitos
- [ ] Asignaciones

Filtros

- Usuario
- Proyecto
- Fecha
- Tipo de actividad

Estado

Backlog

Prioridad

P1

---

# Historia 13.8

Notificaciones Inteligentes

Evitar.

- [ ] Duplicados
- [ ] Spam
- [ ] Eventos repetitivos

Agrupar automáticamente eventos relacionados.

Estado

Backlog

Prioridad

P2

---

# Historia 13.9

Marcar como Leídas

Permitir.

- [ ] Marcar individualmente
- [ ] Marcar todas
- [ ] Restaurar estado (opcional)

Estado

Backlog

Prioridad

P0

---

# Historia 13.10

Búsqueda

Buscar notificaciones por.

- Texto
- Proyecto
- Usuario
- Fecha
- Tipo

Estado

Backlog

Prioridad

P2

---

# Historia 13.11

Notificaciones por Rol

Developer

- Cambios internos
- Asignaciones
- Comentarios
- Archivos

Intermediary

- Proyectos asignados
- Comentarios visibles
- Entregas

Client

- Avance
- Entregas
- Archivos compartidos
- Cambios importantes

Estado

Backlog

Prioridad

P1

---

# Historia 13.12

Indicadores

Mostrar.

- Total
- No leídas
- Hoy
- Esta semana
- Por tipo

Estado

Backlog

Prioridad

P2

---

# Historia 13.13

Auditoría

Registrar.

- Notificación enviada
- Notificación leída
- Notificación descartada
- Cambio de preferencias

Estado

Backlog

Prioridad

P2

---

# Historia 13.14

Permisos

Developer

- [ ] Gestión de sus notificaciones

Intermediary

- [ ] Gestión de sus notificaciones

Client

- [ ] Gestión de sus notificaciones

Administrator

- [ ] Configuración global

Super Administrator

- [ ] Acceso completo

Estado

Backlog

Prioridad

P1

---

# Historia 13.15

Integración

Integrar con.

- Proyectos
- Clientes
- Intermediarios
- Hitos
- Tareas
- Dashboard
- Comentarios
- Archivos
- Reportes
- Auditoría

Estado

Backlog

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

Nota: la cola está disponible como infraestructura (`enqueueOfflineMutation` + `registerSyncHandler`); los módulos de features la adoptarán al migrar sus formularios a mutaciones de cliente.

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

- Preferencias
- Últimos proyectos
- Últimas tareas
- Configuración del Dashboard
- Sesión cuando sea seguro hacerlo

Estado

Backlog

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

- Nueva versión disponible
- Actualización instalada
- Reinicio necesario

Permitir

- Actualizar ahora
- Recordar después

Estado

Backlog

Prioridad

P1

---

# Historia 14.10

Optimización de Rendimiento

Optimizar

- Lazy Loading
- Code Splitting
- Prefetch
- Precarga de recursos
- Imágenes optimizadas

Estado

Backlog

Prioridad

P1

---

# Historia 14.11

Compatibilidad

Validar funcionamiento en

- Chrome
- Edge
- Firefox
- Safari

Dispositivos

- Escritorio
- Tablet
- Android
- iPhone

Estado

Backlog

Prioridad

P1

---

# Historia 14.12

Notificaciones Push (Preparado)

Preparar soporte para

- Recordatorios
- Comentarios
- Cambios de proyecto
- Cambios de tareas
- Próximas entregas

La implementación dependerá del proveedor seleccionado en el futuro.

Estado

Backlog

Prioridad

P2

---

# Historia 14.13

Configuración de la PWA

Permitir configurar

- Actualizaciones automáticas
- Uso de datos
- Caché
- Notificaciones
- Sincronización

Estado

Backlog

Prioridad

P2

---

# Historia 14.14

Auditoría

Registrar

- Instalación
- Actualización
- Sincronización
- Errores Offline
- Recuperación de conexión

Estado

Backlog

Prioridad

P2

---

# Historia 14.15

Integración

Integrar con

- Dashboard
- Proyectos
- Tareas
- Hitos
- Comentarios
- Archivos
- Notificaciones
- Configuración
- Auditoría

Estado

Backlog

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

- [ ] Configuración persistente
- [ ] Validación
- [ ] Auditoría

### Frontend

- [ ] Panel administrativo
- [ ] Navegación por categorías
- [ ] Búsqueda

Estado

Backlog

Prioridad

P0

---

# Historia 15.2

Información de la Organización

Administrar

- [ ] Nombre de la organización
- [ ] Logo
- [ ] Descripción
- [ ] Correo principal
- [ ] Teléfono
- [ ] Dirección
- [ ] Zona horaria
- [ ] Idioma
- [ ] Formato de fecha

Estado

Backlog

Prioridad

P1

---

# Historia 15.3

Preferencias Globales

Permitir configurar

- [ ] Tema
- [ ] Modo oscuro
- [ ] Formato de hora
- [ ] Cantidad de registros por página
- [ ] Idioma del sistema
- [ ] Página inicial

Estado

Backlog

Prioridad

P2

---

# Historia 15.4

Configuración de Proyectos

Permitir administrar

- [ ] Estados
- [ ] Prioridades
- [ ] Etiquetas
- [ ] Categorías
- [ ] Colores
- [ ] Plantillas

Estado

Backlog

Prioridad

P1

---

# Historia 15.5

Configuración de Tareas

Permitir administrar

- [ ] Estados
- [ ] Prioridades
- [ ] Tipos
- [ ] Etiquetas
- [ ] Plantillas
- [ ] Horas por defecto

Estado

Backlog

Prioridad

P1

---

# Historia 15.6

Configuración de Hitos

Permitir administrar

- [ ] Estados
- [ ] Colores
- [ ] Tipos
- [ ] Plantillas

Estado

Backlog

Prioridad

P2

---

# Historia 15.7

Configuración de Notificaciones

Permitir definir

- [ ] Eventos
- [ ] Frecuencia
- [ ] Correos automáticos
- [ ] Recordatorios
- [ ] Notificaciones Push (futuro)

Estado

Backlog

Prioridad

P1

---

# Historia 15.8

Gestión de Catálogos

Administrar

- [ ] Categorías
- [ ] Tipos de archivo
- [ ] Etiquetas globales
- [ ] Estados personalizados

Estado

Backlog

Prioridad

P2

---

# Historia 15.9

Seguridad

Configurar

- [ ] Tiempo de sesión
- [ ] Políticas de contraseña
- [ ] Intentos de inicio de sesión
- [ ] Bloqueo automático
- [ ] Dispositivos confiables (futuro)

Estado

Backlog

Prioridad

P1

---

# Historia 15.10

Gestión de Plantillas

Crear plantillas para

- [ ] Proyectos
- [ ] Tareas
- [ ] Hitos
- [ ] Reportes

Estado

Backlog

Prioridad

P2

---

# Historia 15.11

Personalización

Permitir configurar

- [ ] Colores institucionales
- [ ] Logo
- [ ] Favicon
- [ ] Pantalla de inicio
- [ ] Mensajes del sistema

Estado

Backlog

Prioridad

P2

---

# Historia 15.12

Respaldos de Configuración

Permitir

- [ ] Exportar configuración
- [ ] Importar configuración
- [ ] Restaurar valores por defecto

Estado

Backlog

Prioridad

P3

---

# Historia 15.13

Permisos

Developer

- [ ] Sin acceso

Intermediary

- [ ] Sin acceso

Client

- [ ] Sin acceso

Administrator

- [ ] Gestión parcial

Super Administrator

- [ ] Gestión completa

Estado

Backlog

Prioridad

P0

---

# Historia 15.14

Auditoría

Registrar

- Cambios de configuración
- Cambios de parámetros
- Cambios de seguridad
- Restauraciones
- Importaciones
- Exportaciones

Estado

Backlog

Prioridad

P1

---

# Historia 15.15

Integración

Integrar con

- Usuarios
- Proyectos
- Tareas
- Hitos
- Dashboard
- Reportes
- Notificaciones
- PWA
- Auditoría

Estado

Backlog

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

Done

Dependencias

- Todas las épicas anteriores

---

# Historia 16.1

Sistema Central de Auditoría

## Objetivo

Implementar un servicio unificado de auditoría para toda la plataforma.

### Backend

- [ ] Servicio central de auditoría
- [ ] Registro automático
- [ ] API de consulta
- [ ] Optimización de consultas

### Frontend

- [ ] Panel de auditoría
- [x] Filtros
- [ ] Búsqueda
- [ ] Exportación

### QA

- [ ] Registro correcto
- [ ] Rendimiento
- [ ] Permisos

Estado

Backlog

Prioridad

P0

---

# Historia 16.2

Registro de Acciones

Registrar automáticamente

- [ ] Inicio de sesión
- [ ] Cierre de sesión
- [ ] Intentos fallidos
- [ ] Creación
- [ ] Actualización
- [ ] Eliminación lógica
- [ ] Restauración
- [ ] Exportaciones
- [ ] Descargas
- [ ] Subidas de archivos

Estado

Backlog

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

Estado

Backlog

Prioridad

P0

---

# Historia 16.4

Auditoría de Tareas

Registrar

- Creación
- Edición
- Cambio de prioridad
- Cambio de responsable
- Cambio de estado
- Registro de tiempo
- Eliminación lógica

Estado

Backlog

Prioridad

P0

---

# Historia 16.5

Auditoría de Hitos

Registrar

- Creación
- Actualización
- Cambio de fechas
- Cambio de estado
- Asociación de tareas

Estado

Backlog

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

Estado

Backlog

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

Estado

Backlog

Prioridad

P0

---

# Historia 16.8

Historial de Cambios

Mostrar

- Valor anterior
- Valor nuevo
- Usuario responsable
- Fecha
- Hora

Aplicable a

- Proyectos
- Clientes
- Intermediarios
- Tareas
- Hitos
- Configuración

Estado

Backlog

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

Estado

Backlog

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

Estado

Backlog

Prioridad

P2

---

# Historia 16.11

Exportación

Permitir exportar auditorías

- [ ] PDF
- [ ] Excel
- [ ] CSV

Estado

Backlog

Prioridad

P2

---

# Historia 16.12

Retención de Registros

Configurar

- Tiempo de retención
- Eliminación automática (cuando aplique)
- Archivado histórico

Estado

Backlog

Prioridad

P2

---

# Historia 16.13

Eventos de Seguridad

Registrar

- Accesos denegados
- Errores de permisos
- Intentos sospechosos
- Bloqueos de cuenta
- Cambios críticos

Estado

Backlog

Prioridad

P1

---

# Historia 16.14

Permisos

Developer

- Sin acceso

Intermediary

- Sin acceso

Client

- Sin acceso

Administrator

- Consulta limitada

Super Administrator

- Acceso completo

Estado

Backlog

Prioridad

P0

---

# Historia 16.15

Integración

Integrar con

- Usuarios
- Clientes
- Intermediarios
- Proyectos
- Hitos
- Tareas
- Comentarios
- Archivos
- Reportes
- Notificaciones
- Configuración

Estado

Backlog

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

Backlog

Dependencias

- Todas las épicas anteriores

---

# Historia 17.1

API Pública

## Objetivo

Diseñar una API segura para permitir futuras integraciones.

### Backend

- [ ] Arquitectura REST
- [ ] Versionado de API
- [ ] Documentación OpenAPI
- [ ] Paginación
- [x] Filtros
- [ ] Rate Limiting

### QA

- [ ] Seguridad
- [ ] Rendimiento
- [ ] Versionado

Estado

Backlog

Prioridad

P1

---

# Historia 17.2

Autenticación de API

Implementar

- [ ] API Keys
- [ ] Tokens de acceso
- [ ] Expiración
- [ ] Revocación
- [ ] Rotación de credenciales

Estado

Backlog

Prioridad

P1

---

# Historia 17.3

Webhooks

Permitir enviar eventos cuando ocurra.

- Proyecto creado
- Proyecto actualizado
- Proyecto finalizado
- Nueva tarea
- Cambio de estado
- Nuevo comentario
- Archivo subido
- Nuevo cliente

Configuración

- [ ] URL destino
- [ ] Reintentos
- [ ] Firma de seguridad
- [ ] Historial de entregas

Estado

Backlog

Prioridad

P1

---

# Historia 17.4

Integración con Calendarios

Preparar integración con

- Google Calendar
- Microsoft Outlook

Funciones

- [ ] Sincronizar hitos
- [ ] Sincronizar entregas
- [ ] Sincronizar recordatorios

Estado

Backlog

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

Estado

Backlog

Prioridad

P2

---

# Historia 17.7

Motor de Eventos

Implementar un sistema de eventos internos.

Funciones

- [ ] Publicación de eventos
- [ ] Suscripción
- [ ] Procesamiento asíncrono
- [ ] Reintentos

Estado

Backlog

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

Estado

Backlog

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

Estado

Backlog

Prioridad

P3

---

# Historia 17.10

Importación de Datos

Permitir importar

- Clientes
- Proyectos
- Usuarios
- Tareas
- Hitos

Formatos

- CSV
- Excel

Estado

Backlog

Prioridad

P2

---

# Historia 17.11

Exportación Global

Permitir exportar

- Base de proyectos
- Clientes
- Reportes
- Auditoría
- Configuración

Formatos

- ZIP
- CSV
- Excel
- PDF

Estado

Backlog

Prioridad

P2

---

# Historia 17.12

Monitoreo

Registrar

- Rendimiento
- Errores
- Latencia
- Uso de recursos
- Disponibilidad

Preparado para futuras herramientas de observabilidad.

Estado

Backlog

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

Estado

Backlog

Prioridad

P2

---

# Historia 17.14

Roadmap Técnico

Documentar futuras versiones.

Versión 2

- Gantt
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

Estado

Backlog

Prioridad

P3

---

# Historia 17.15

Permisos

Developer

- Uso de integraciones autorizadas

Intermediary

- Sin acceso administrativo

Client

- Sin acceso administrativo

Administrator

- Configuración parcial

Super Administrator

- Gestión completa

Estado

Backlog

Prioridad

P1

---

# Historia 17.16

Auditoría

Registrar

- Uso de API
- Creación de API Keys
- Webhooks enviados
- Automatizaciones ejecutadas
- Errores de integración

Estado

Backlog

Prioridad

P2

---

# Historia 17.17

Integración

Integrar con

- Todos los módulos existentes
- API Pública
- Webhooks
- Auditoría
- Configuración
- Notificaciones

Estado

Backlog

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
