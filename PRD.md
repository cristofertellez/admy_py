Sistema Integral de Gestión, Control y Visualización de Proyectos

Versión: 1.0.0

Estado: Draft

Tipo de proyecto: Progressive Web Application (PWA)

Documento maestro del proyecto

Control de versiones
Versión	Fecha	Autor	Descripción
1.0.0	2026	Equipo de Producto	Documento inicial del proyecto
Índice
Introducción
Visión del producto
Objetivos
Alcance
Exclusiones
Público objetivo
Roles del sistema
Arquitectura General
Tecnologías
Convenciones del proyecto
Lineamientos de Diseño
Arquitectura del Software
Modelo de Datos
Sistema de Autenticación
Sistema RBAC
Dashboard del Desarrollador
Dashboard del Cliente
Dashboard del Intermediario
Gestión de Clientes
Gestión de Intermediarios
Gestión de Proyectos
Gestión de Tareas
Gestión de Comentarios
Gestión de Archivos
Sistema de Notificaciones
Sistema de Progreso
Estimaciones de Tiempo
KPIs
Reportes
Auditoría
Configuración
Progressive Web App
Requisitos Funcionales
Requisitos No Funcionales
Seguridad
Rendimiento
Escalabilidad
Roadmap
Convenciones para IA de Desarrollo
Checklist Final
1. Introducción
Descripción

Este documento define de forma integral los requisitos funcionales, técnicos, arquitectónicos y operativos para el desarrollo de una plataforma especializada en la gestión, control, seguimiento y visualización de proyectos.

El objetivo es que este documento sea la única fuente de verdad para el desarrollo del sistema y que cualquier desarrollador o IA pueda implementar la aplicación sin necesidad de asumir comportamientos o requisitos no especificados.

Este documento debe utilizarse como referencia durante todo el ciclo de vida del producto.

Propósito

La plataforma permitirá centralizar en un único sistema:

Clientes.
Intermediarios.
Proyectos.
Equipos de desarrollo.
Tareas.
Comentarios.
Archivos.
Historial.
Indicadores.
Reportes.
Métricas.
Progreso.
Estimaciones.
Comunicación.

Todo desde una interfaz moderna, responsive y preparada para dispositivos móviles mediante una Progressive Web Application.

Problema actual

Actualmente el seguimiento de proyectos suele distribuirse entre diferentes plataformas como hojas de cálculo, aplicaciones de mensajería, documentos compartidos y gestores de tareas. Esto genera:

Duplicidad de información.
Pérdida del historial.
Comunicación desorganizada.
Dificultad para medir avances.
Falta de transparencia con el cliente.
Escasa trazabilidad de cambios.
Baja capacidad de auditoría.
Dependencia de procesos manuales.

El sistema propuesto busca eliminar estos problemas centralizando toda la gestión del ciclo de vida de un proyecto en una única plataforma.

2. Visión del Producto

La plataforma debe convertirse en el centro de operaciones para empresas de desarrollo de software, agencias digitales, consultoras tecnológicas o equipos que administren múltiples proyectos de forma simultánea.

Debe ofrecer una experiencia clara y diferenciada según el rol del usuario, permitiendo que cada uno acceda únicamente a la información necesaria para desempeñar sus funciones.

El sistema deberá priorizar:

Simplicidad de uso.
Alto rendimiento.
Seguridad.
Escalabilidad.
Modularidad.
Mantenibilidad.
Experiencia de usuario consistente.

La aplicación debe estar preparada para evolucionar con nuevas funcionalidades sin requerir refactorizaciones importantes.

3. Objetivos del Producto
Objetivo General

Crear una plataforma moderna para la administración integral de proyectos que permita controlar el progreso, organizar tareas, gestionar clientes y ofrecer transparencia durante todo el ciclo de vida del proyecto.

Objetivos Específicos
Gestión centralizada

Toda la información relacionada con un proyecto debe encontrarse en un único lugar.

Transparencia

Cada cliente podrá consultar en tiempo real el estado de sus proyectos sin necesidad de solicitar información al equipo de desarrollo.

Organización

El equipo de desarrollo dispondrá de herramientas para planificar, organizar y supervisar el trabajo mediante proyectos, tareas, hitos y comentarios.

Comunicación

Toda la comunicación relevante deberá mantenerse dentro del sistema para conservar un historial completo y facilitar el seguimiento.

Escalabilidad

La arquitectura deberá permitir la incorporación de nuevos módulos sin afectar los ya existentes.

Trazabilidad

Cada acción importante realizada dentro del sistema deberá quedar registrada para auditoría y seguimiento.

Productividad

Reducir tiempos administrativos y mejorar la coordinación entre desarrolladores, clientes e intermediarios.

4. Alcance del Proyecto

La primera versión del sistema incluirá:

Gestión de usuarios
Registro mediante NextAuth (Auth.js).
Inicio de sesión.
Recuperación de contraseña.
Gestión de perfil.
Cambio de contraseña.
Cierre de sesión.
Gestión de sesiones.
Gestión de roles

Roles iniciales:

Developer
Client
Intermediary

El sistema deberá diseñarse para permitir la creación de nuevos roles en el futuro sin modificar la arquitectura principal.

Gestión de clientes

Cada cliente podrá tener uno o múltiples proyectos.

El sistema permitirá:

Alta.
Baja lógica.
Modificación.
Consulta.
Historial.
Búsqueda.
Filtrado.
Etiquetado.
Gestión de intermediarios

Un intermediario podrá representar múltiples clientes y consultar todos los proyectos asociados.

No tendrá permisos administrativos sobre la configuración interna del sistema.

Gestión de proyectos

Cada proyecto contará con:

Información general.
Estado.
Prioridad.
Responsable.
Cliente asociado.
Intermediario.
Progreso.
Estimaciones.
Archivos.
Comentarios.
Historial.
Tareas.
Actividad reciente.
Gestión de tareas

Cada proyecto podrá contener una cantidad ilimitada de tareas.

Las tareas podrán organizarse mediante diferentes vistas y estados.

Gestión documental

Todos los proyectos podrán almacenar archivos relacionados utilizando Cloudflare R2.

Comunicación

El sistema incluirá un módulo de comentarios por proyecto y por tarea.

Cada comentario conservará:

Fecha.
Autor.
Historial.
Archivos adjuntos.
Respuestas (hilos).
Seguimiento

El sistema calculará automáticamente el progreso general del proyecto utilizando la información registrada en las tareas.

Dashboards

Cada tipo de usuario visualizará un panel diferente según sus permisos.

Progressive Web App

Toda la plataforma deberá funcionar como una aplicación instalable desde:

Android.
iPhone.
Tablets.
Windows.
macOS.
Linux.

Sin necesidad de instalar aplicaciones nativas.

5. Exclusiones

La primera versión no incluirá:

Facturación electrónica.
Contabilidad.
Gestión de nómina.
Videollamadas.
Chat en tiempo real (se dejará preparada la arquitectura para futuras implementaciones).
Integraciones con ERP.
CRM completo.
Gestión de inventario.
Firma electrónica.
Automatizaciones mediante IA (aunque la arquitectura deberá permitir su incorporación en el futuro).
6. Público Objetivo

La plataforma está orientada a organizaciones que gestionan múltiples proyectos de manera simultánea y requieren un control centralizado de su operación.

Ejemplos de uso
Empresas de desarrollo de software.
Agencias de marketing digital.
Estudios de diseño.
Consultoras tecnológicas.
Equipos freelance.
Empresas de ingeniería.
Firmas de arquitectura.
Equipos de desarrollo interno.
Empresas que administran proyectos para terceros.
Perfil de usuarios
Desarrollador

Responsable de administrar la plataforma, crear proyectos, asignar tareas y supervisar el avance general.

Cliente

Usuario que desea consultar el estado de sus proyectos, revisar avances, participar mediante comentarios y acceder a la documentación compartida.

Intermediario

Representa agencias, gestores comerciales o responsables de varios clientes. Puede supervisar múltiples proyectos y mantener la comunicación con el equipo de desarrollo sin intervenir en la administración interna.

Principios de diseño del producto

La aplicación deberá cumplir los siguientes principios:

Experiencia mobile-first, garantizando un uso cómodo desde dispositivos móviles al ser una PWA.
Navegación simple, consistente y predecible.
Interfaces limpias y enfocadas en la productividad.
Componentes reutilizables y accesibles.
Rendimiento óptimo incluso con grandes volúmenes de información.
Separación clara entre lógica de negocio, presentación y acceso a datos.
Consistencia visual y de interacción siguiendo estrictamente las definiciones del archivo DESING.md.
Preparación para crecimiento modular sin afectar los módulos existentes.

7. Roles del Sistema

La plataforma utilizará un sistema RBAC (Role Based Access Control) propio, implementado sobre NextAuth (Auth.js) y reforzado mediante controles de autorización en la capa de acceso a datos.

El objetivo es que cada usuario acceda únicamente a la información y acciones correspondientes a su rol.

Roles iniciales
Developer

Es el administrador operativo del sistema.

Tiene acceso completo a todos los clientes, intermediarios, proyectos, tareas y configuraciones.

Permisos principales:

Crear, editar y archivar clientes.
Crear, editar, archivar y restaurar proyectos.
Crear y administrar tareas.
Asignar responsables.
Gestionar estados.
Definir prioridades.
Gestionar estimaciones.
Crear hitos.
Gestionar comentarios.
Gestionar archivos.
Ver reportes.
Ver estadísticas.
Gestionar usuarios.
Gestionar permisos.
Administrar intermediarios.
Configurar el sistema.
Client

Representa al propietario del proyecto.

No administra la plataforma.

Puede:

Ver únicamente sus proyectos.
Ver el progreso.
Consultar tareas.
Descargar archivos.
Comentar.
Responder comentarios.
Consultar historial.
Ver fechas estimadas.
Ver hitos.
Consultar indicadores.

No puede:

Editar tareas.
Cambiar estados.
Crear proyectos.
Modificar configuraciones.
Ver otros clientes.
Ver proyectos ajenos.
Intermediary

Representa agencias, gestores o vendedores.

Puede administrar varios clientes simultáneamente.

Puede:

Ver todos sus clientes.
Consultar proyectos.
Comentar.
Subir archivos si posee permisos.
Consultar métricas.
Ver cronogramas.
Ver progreso.

No puede modificar información crítica del proyecto.

Roles futuros

La arquitectura deberá permitir incorporar nuevos roles sin modificar el núcleo del sistema.

Ejemplos:

Project Manager
QA
Diseñador
Supervisor
Administrador financiero
Contabilidad
Soporte
Invitado
Auditor
Permisos

Los permisos deberán gestionarse mediante una tabla independiente.

Ejemplo:

Roles

↓

Permisos

↓

Usuarios

↓

Acciones

Nunca deberán existir permisos escritos directamente en el código.

Todo permiso deberá ser configurable.

8. Arquitectura General

La aplicación seguirá una arquitectura modular.

Cada módulo será independiente.

Cada módulo deberá contener:

Componentes.
Hooks.
Servicios.
Tipos.
Validaciones.
Acciones.
Interfaces.
Lógica de negocio.

No se permitirá mezclar lógica entre módulos.

Arquitectura por dominios
Clientes

Proyectos

Tareas

Usuarios

Comentarios

Archivos

Dashboard

Reportes

Configuración

Cada dominio deberá ser completamente desacoplado.

Principios arquitectónicos

Toda la aplicación deberá seguir:

Clean Architecture
Separation of Concerns
SOLID
DRY
KISS
Composition over inheritance

No deberá existir lógica de negocio dentro de componentes visuales.

9. Tecnologías
Framework principal

Next.js 16

Uso obligatorio de App Router.

No utilizar Pages Router.

Lenguaje

TypeScript

Configurado en modo estricto.

No se permitirá:

any

salvo casos totalmente justificados.

Base de datos

Turso (libSQL)

Toda la persistencia dependerá de Turso.

Autenticación

NextAuth (Auth.js)

Métodos previstos:

Email
Magic Link
OAuth (preparado)
Autorización

RBAC propio.

Autorización en la capa de acceso a datos.

Reglas de acceso por tabla.

UI

Tailwind CSS

shadcn/ui

No deberán utilizarse librerías adicionales de componentes salvo aprobación futura.

Formularios

React Hook Form

Todos los formularios deberán utilizarlo.

No habrá formularios controlados manualmente.

Validación

Zod

Toda entrada deberá validarse:

Cliente

Servidor

Server Actions

API

Estado

TanStack Query

Se utilizará únicamente cuando exista beneficio real.

No convertir toda la aplicación en cliente innecesariamente.

Tablas

TanStack Table

Obligatorio para:

Clientes

Usuarios

Proyectos

Archivos

Tareas

Reportes

Storage

Cloudflare R2

Organizado por buckets.

Ejemplo:

avatars/

projects/

attachments/

logos/

exports/
10. Progressive Web App

La plataforma será una PWA.

Características mínimas:

Instalable.

Responsive.

Manifest.

Service Worker.

Iconos.

Splash Screen.

Modo Standalone.

Offline parcial.

Actualizaciones automáticas.

Cache inteligente.

Offline

El sistema deberá seguir funcionando parcialmente.

Ejemplos:

Consultar proyectos recientemente abiertos.

Consultar tareas recientes.

Consultar comentarios descargados.

Visualizar archivos previamente descargados.

Cuando vuelva Internet deberá sincronizar automáticamente.

11. Lineamientos de Diseño

Toda decisión visual deberá seguir:

DESING.md

Es un documento obligatorio.

Si un componente no está especificado:

El desarrollador deberá crear uno siguiendo exactamente el lenguaje visual existente.

No deberá improvisarse un nuevo estilo.

Principios UI

Consistencia.

Espaciado uniforme.

Tipografía uniforme.

Colores consistentes.

Accesibilidad.

Responsive.

Animaciones discretas.

Componentes reutilizables.

12. Convenciones del Proyecto

Toda la aplicación utilizará:

PascalCase

↓

Componentes

camelCase

↓

Funciones

Variables

Hooks

kebab-case

↓

Rutas

Carpetas públicas

snake_case

↓

Base de datos

No mezclar idiomas.

Todo el código deberá escribirse en inglés.

La interfaz podrá internacionalizarse posteriormente.

Convenciones de commits

Se recomienda Conventional Commits.

Ejemplos:

feat:

fix:

refactor:

docs:

style:

test:

build:
13. Arquitectura de Carpetas
app/

components/

features/

hooks/

providers/

schemas/

services/

actions/

lib/

utils/

types/

constants/

styles/

public/

middleware.ts

turso/

Features

Cada módulo deberá vivir dentro de:

features/

Ejemplo

projects/

tasks/

clients/

dashboard/

comments/

reports/


Cada módulo será independiente.

Componentes

Separar:

ui/

layout/

dashboard/

tables/

forms/

dialogs/

charts/

shared/


Nunca crear componentes gigantes.

14. Convenciones de Componentes

Cada componente deberá:

Ser reutilizable.

Aceptar props tipadas.

Evitar lógica pesada.

No realizar consultas directamente.

Ejemplo

Incorrecto

Tabla hace consultas
↓

Tabla modifica datos

↓

Tabla valida datos

Correcto

Consulta

↓

Hook

↓

Componente
15. Gestión del Estado

Preferencias:

Server Components siempre que sea posible.

Client Components únicamente cuando exista interacción.

Evitar estados globales innecesarios.

Orden de preferencia

1 Server Components

↓

2 Server Actions

↓

3 TanStack Query

↓

4 Context

↓

5 Estado local

16. Seguridad

Toda petición deberá validarse.

Nunca confiar en el cliente.

Toda operación importante deberá validarse nuevamente en servidor.

No confiar únicamente en:

Ocultar botones.

Ocultar páginas.

Deshabilitar inputs.

La seguridad siempre estará en backend.

17. Seguridad a Nivel de Datos

Todas las tablas sensibles deberán tener controles de acceso aplicados en la capa de acceso a datos.

Ejemplos:

Projects

Tasks

Comments

Files

Notifications

Users

Clients

Ejemplo conceptual

Cliente

↓

Solo puede leer sus proyectos

Intermediario

↓

Solo proyectos asignados

Developer

↓

Acceso total

18. Middleware

El middleware deberá:

Validar sesión.

Renovar tokens.

Validar acceso.

Redireccionar.

Bloquear rutas protegidas.

No deberá contener lógica de negocio.

19. Gestión de Errores

Toda excepción deberá manejarse correctamente.

Nunca mostrar errores internos.

Los mensajes deberán ser claros.

Ejemplo

Incorrecto

Error 500

SQL Exception

Undefined

Correcto

No fue posible guardar el proyecto.

Intente nuevamente.

Los errores técnicos deberán almacenarse en logs internos.

20. Logging

Toda acción importante generará un registro.

Ejemplos:

Inicio de sesión.

Creación de proyecto.

Cambio de estado.

Cambio de responsable.

Subida de archivo.

Comentario.

Cambio de permisos.

Eliminación.

Restauración.

Cada log incluirá:

Usuario.

Fecha.

Hora.

IP (si es posible).

Acción.

Entidad.

Valor anterior.

Valor nuevo.

# PRD.md

# Parte 3 — Modelo de Datos, Entidades y Reglas de Negocio

---

# 21. Modelo de Datos

La base de datos deberá diseñarse bajo un enfoque relacional utilizando SQLite mediante Turso (libSQL).

El diseño deberá cumplir con los siguientes principios:

- Normalización hasta 3FN como mínimo.
- Uso de UUID como identificadores primarios.
- Eliminación lógica cuando sea apropiado.
- Campos de auditoría en todas las tablas.
- Control de acceso definido en la capa de aplicación.
- Preparación para futuras relaciones sin romper el modelo existente.

Toda entidad deberá incluir, como mínimo, los siguientes campos de auditoría:

```sql
id UUID PRIMARY KEY

created_at

updated_at

created_by

updated_by

deleted_at (nullable)

is_active BOOLEAN
```

No se recomienda eliminar registros físicamente salvo excepciones muy justificadas.

---

# 22. Entidades Principales

El sistema estará compuesto inicialmente por las siguientes entidades:

```text
Users

Roles

Permissions

RolePermissions

Clients

Intermediaries

Projects

ProjectMembers

Milestones

Tasks

TaskComments

ProjectComments

Attachments

Notifications

ActivityLogs

Tags

ProjectTags

TaskTags

TimeEstimates

TimeEntries

ProjectStatusHistory

TaskStatusHistory

Settings
```

Estas entidades constituyen el núcleo funcional del sistema.

---

# 23. Users

Representa cualquier usuario autenticado mediante NextAuth (Auth.js).

Campos recomendados

- id
- auth_user_id
- first_name
- last_name
- email
- phone
- avatar
- role_id
- last_login
- timezone
- language
- created_at
- updated_at
- is_active

Relaciones

Un usuario:

Puede crear muchos proyectos.

Puede comentar.

Puede crear tareas.

Puede registrar horas.

Puede pertenecer a múltiples proyectos (preparado para crecimiento futuro).

---

# Reglas

El correo electrónico deberá ser único.

No podrá existir un usuario sin rol.

No podrá eliminarse un usuario que tenga historial asociado.

---

# 24. Roles

Tabla encargada del RBAC.

Ejemplos iniciales

Developer

Client

Intermediary

Project Manager

QA

Viewer

No deberán estar codificados directamente en el frontend.

---

# 25. Permissions

Lista completa de permisos.

Ejemplos

```text
projects.create

projects.read

projects.update

projects.delete

tasks.create

tasks.update

tasks.delete

clients.create

comments.create

attachments.upload

reports.read
```

La aplicación siempre verificará permisos antes de ejecutar acciones.

---

# 26. Clients

Representa a los clientes finales.

Campos

id

company_name

contact_name

email

phone

address

country

city

website

notes

logo

status

created_at

updated_at

Relaciones

Un cliente

↓

Muchos proyectos

Puede tener

↓

Un intermediario principal

---

# Reglas

No podrá existir un proyecto sin cliente.

El cliente podrá estar activo o inactivo.

Los clientes inactivos conservarán su historial.

---

# 27. Intermediaries

Representan agencias o gestores.

Campos

id

company

contact_name

email

phone

website

notes

status

Relaciones

Un intermediario

↓

Muchos clientes

↓

Muchos proyectos

---

# 28. Projects

Es la entidad principal del sistema.

Campos

id

code

name

description

client_id

intermediary_id

status_id

priority

estimated_start_date

estimated_end_date

real_start_date

real_end_date

estimated_hours

worked_hours

completion_percentage

budget (preparado)

visibility

notes

created_at

updated_at

---

# Reglas

Todo proyecto deberá tener:

Cliente

Estado

Prioridad

Responsable

No podrá existir un proyecto sin cliente.

---

# Estados del proyecto

Propuesto

Pendiente

Planificación

Diseño

Desarrollo

QA

En revisión

Correcciones

Listo para entrega

Entregado

Finalizado

Suspendido

Cancelado

Archivado

La arquitectura permitirá agregar nuevos estados.

---

# Prioridades

Muy Baja

Baja

Media

Alta

Crítica

Urgente

---

# Visibilidad

Privado

Cliente

Intermediario

Interno

---

# 29. Project Members

Permite asignar múltiples usuarios a un proyecto.

Campos

project_id

user_id

role

joined_at

---

Esto permitirá en futuras versiones trabajar con equipos completos.

---

# 30. Milestones

Los hitos representan entregables importantes.

Campos

id

project_id

title

description

estimated_date

completed_date

status

completion_percentage

order

---

Ejemplos

Diseño aprobado

Backend terminado

Frontend terminado

QA finalizado

Entrega versión Beta

Entrega versión Final

---

Los hitos también participarán en el cálculo del progreso.

---

# 31. Tasks

Cada proyecto tendrá múltiples tareas.

Campos

id

project_id

parent_task_id

title

description

assigned_to

status

priority

estimated_hours

worked_hours

estimated_start

estimated_end

real_start

real_end

completion_percentage

position

created_at

updated_at

---

Subtareas

Una tarea podrá contener subtareas.

No existirá límite de profundidad, aunque la interfaz inicialmente soportará:

Nivel 1

↓

Nivel 2

↓

Nivel 3

---

Estados

Pendiente

En progreso

Bloqueada

En revisión

QA

Completada

Cancelada

---

Prioridades

Muy Baja

Baja

Media

Alta

Crítica

Urgente

---

# Dependencias

Las tareas podrán depender de otras.

Ejemplo

Backend API

↓

Frontend Login

El frontend no debería iniciarse antes de finalizar la API.

---

# 32. Project Comments

Comentarios generales del proyecto.

Campos

id

project_id

user_id

parent_comment

message

edited

edited_at

created_at

---

Funciones

Responder comentarios

Editar

Eliminar (según permisos)

Adjuntar archivos

Menciones

Reacciones (preparado)

---

# 33. Task Comments

Misma lógica que los comentarios de proyecto pero asociados a tareas específicas.

Esto permitirá mantener conversaciones independientes para cada actividad.

---

# 34. Attachments

Todos los archivos se almacenarán en Cloudflare R2.

La base únicamente almacenará la referencia.

Campos

id

bucket

path

filename

extension

mime_type

size

uploaded_by

entity_type

entity_id

created_at

---

Entity Type

Project

Task

Comment

User

Milestone

---

# Reglas

No almacenar archivos dentro de la base de datos.

Siempre usar Storage.

---

# 35. Tags

Permite clasificar proyectos y tareas.

Ejemplos

Frontend

Backend

Urgente

Bug

Cliente

Marketing

Documentación

API

DevOps

Mobile

---

Una etiqueta podrá asociarse a:

Proyecto

Tarea

Cliente (preparado)

---

# 36. Notifications

Campos

id

receiver_id

sender_id

title

message

type

entity_type

entity_id

read

created_at

---

Tipos

Comentario

Nueva tarea

Proyecto actualizado

Archivo agregado

Fecha próxima

Retraso

Sistema

---

# 37. Activity Logs

Toda acción relevante generará un log.

Campos

id

user_id

action

entity

entity_id

old_value

new_value

ip

user_agent

created_at

---

Ejemplos

Proyecto creado

Proyecto archivado

Estado cambiado

Comentario agregado

Archivo eliminado

Permiso actualizado

---

Nunca podrán eliminarse los logs.

---

# 38. Settings

Configuraciones generales.

Ejemplos

Idioma

Zona horaria

Formato de fecha

Tema

Configuración PWA

Notificaciones

Logo

Nombre de empresa

Correo corporativo

Configuraciones futuras

---

# 39. Relaciones del Sistema

```text
Client
│
├── Projects
│      │
│      ├── Milestones
│      │
│      ├── Tasks
│      │      ├── Task Comments
│      │      ├── Attachments
│      │      └── Time Entries
│      │
│      ├── Project Comments
│      │
│      ├── Attachments
│      │
│      ├── Activity Logs
│      │
│      └── Notifications
│
└── Intermediary
```

---

# 40. Principios del Modelo de Datos

Todas las tablas deberán:

- Tener índices donde corresponda.
- Estar preparadas para controles de acceso en la capa de aplicación.
- Utilizar UUID.
- Tener claves foráneas.
- Evitar duplicidad.
- Permitir escalabilidad.
- Mantener integridad referencial.
- Contar con auditoría.
- Ser compatibles con futuras migraciones.

El modelo deberá mantenerse desacoplado de la lógica del frontend para facilitar futuras integraciones mediante API, aplicaciones móviles nativas u otros servicios.

---

# PRD.md

# Parte 4 — Módulos Funcionales, Dashboards y Gestión Operativa

---

# 41. Filosofía de la Plataforma

La plataforma debe convertirse en el centro de operaciones de la empresa.

Toda la información relacionada con un proyecto debe encontrarse dentro del sistema.

No deberá ser necesario utilizar herramientas externas para conocer:

- Estado del proyecto.
- Avance.
- Responsable.
- Comentarios.
- Archivos.
- Próximas entregas.
- Historial.
- Tiempo invertido.
- Tiempo estimado.
- Riesgos.

Cada módulo deberá proporcionar la información necesaria para tomar decisiones rápidamente.

---

# 42. Dashboard General

Después del inicio de sesión cada usuario será dirigido automáticamente a un dashboard diferente según su rol.

No existirán dashboards compartidos.

Cada uno deberá mostrar únicamente la información relevante para ese tipo de usuario.

---

# 43. Dashboard del Developer

Este será el panel más completo de toda la plataforma.

Su objetivo es proporcionar una visión completa del estado de la empresa y de todos los proyectos.

El dashboard deberá poder personalizarse en el futuro mediante widgets.

---

## Tarjetas Resumen (KPIs)

Mostrar como mínimo:

- Total de clientes.
- Clientes activos.
- Clientes inactivos.
- Total de proyectos.
- Proyectos activos.
- Proyectos finalizados.
- Proyectos atrasados.
- Proyectos suspendidos.
- Tareas pendientes.
- Tareas en progreso.
- Tareas bloqueadas.
- Tareas completadas.
- Horas estimadas.
- Horas trabajadas.
- Horas restantes.
- Progreso promedio.
- Próximas entregas.
- Cantidad de comentarios recientes.

Todas estas tarjetas deberán ser clicables y redirigir al módulo correspondiente.

---

## Actividad reciente

Mostrar una línea de tiempo con las últimas acciones registradas.

Ejemplos

Juan creó el proyecto "Portal Web"

Carlos cambió el estado de la tarea "Login"

María agregó un comentario

Cliente ABC descargó un archivo

Pedro cerró una tarea

---

La actividad deberá poder filtrarse por:

Proyecto

Cliente

Usuario

Fecha

Tipo de acción

---

## Proyectos críticos

Mostrar automáticamente proyectos que presenten alguno de los siguientes indicadores:

Retraso mayor al 20%

Más de 3 tareas bloqueadas

Más de 5 días sin actividad

Más del 90% del tiempo consumido

Fecha de entrega cercana

Estos proyectos deberán resaltarse visualmente.

---

## Próximas entregas

Lista ordenada cronológicamente.

Cada elemento mostrará:

Proyecto

Cliente

Fecha estimada

Estado

Responsable

Porcentaje completado

Indicador de riesgo

---

## Tareas pendientes

Mostrar las tareas:

Pendientes

En progreso

Bloqueadas

Ordenadas por prioridad.

---

## Indicadores de productividad

Ejemplos:

Horas registradas esta semana

Horas registradas este mes

Cantidad de tareas cerradas

Promedio de cierre

Tiempo promedio por tarea

Cumplimiento de cronogramas

---

## Accesos rápidos

Botones para:

Nuevo proyecto

Nuevo cliente

Nuevo intermediario

Nueva tarea

Nuevo comentario

Subir archivo

Exportar reporte

---

# 44. Dashboard del Cliente

El cliente debe visualizar únicamente la información relacionada con sus proyectos.

La interfaz debe ser mucho más simple que la del desarrollador.

---

## Resumen

Mostrar

Cantidad de proyectos activos

Cantidad de proyectos finalizados

Próximas entregas

Comentarios recientes

Archivos recientes

---

## Mis proyectos

Cada proyecto deberá mostrarse como una tarjeta o tabla configurable.

Información mínima

Nombre

Estado

Porcentaje

Fecha estimada

Tiempo restante

Responsable

Prioridad

Indicador visual

---

## Progreso

Cada proyecto mostrará:

Barra de progreso

Porcentaje

Estado actual

Fase

Tiempo estimado restante

Tiempo consumido

Fecha estimada de entrega

---

## Comentarios recientes

Mostrar únicamente los últimos comentarios del proyecto.

El cliente podrá responder.

No podrá eliminar comentarios de otros usuarios.

---

## Archivos

Listado de documentos disponibles.

Podrá:

Visualizar

Descargar

Buscar

Filtrar

---

## Cronograma

Vista resumida.

Mostrar:

Inicio

Entregas

Hitos

Fecha final estimada

---

# 45. Dashboard del Intermediario

El intermediario visualizará todos los proyectos correspondientes a los clientes bajo su responsabilidad.

No visualizará proyectos de otros intermediarios.

---

## Resumen

Cantidad de clientes

Cantidad de proyectos

Proyectos activos

Proyectos finalizados

Próximas entregas

Indicadores de riesgo

---

## Vista por cliente

Cliente

↓

Lista de proyectos

↓

Estado

↓

Progreso

↓

Última actividad

---

## Vista consolidada

Tabla general con todos los proyectos.

Columnas sugeridas

Cliente

Proyecto

Estado

Prioridad

Porcentaje

Tiempo estimado

Tiempo restante

Fecha final

Riesgo

---

# 46. Gestión de Clientes

Este módulo será exclusivo para Developers.

---

## Funciones

Crear cliente

Editar cliente

Desactivar cliente

Reactivar cliente

Consultar historial

Buscar

Filtrar

Ordenar

Etiquetar

Exportar información

---

## Información del cliente

Cada cliente tendrá una ficha completa.

Datos generales

Información de contacto

Empresa

Logo

Proyectos

Comentarios internos

Notas

Historial

Archivos

Facturación (preparado)

---

## Vista del cliente

Al abrir un cliente deberá mostrarse una vista tipo CRM.

Secciones

Información general

Proyectos

Archivos

Actividad

Comentarios internos

Estadísticas

---

# Estadísticas del cliente

Cantidad de proyectos

Proyectos activos

Proyectos terminados

Horas invertidas

Promedio de duración

Tiempo promedio de respuesta

Comentarios realizados

---

# 47. Gestión de Intermediarios

Muy similar al módulo de clientes.

Información adicional

Clientes asignados

Cantidad de proyectos

Tiempo promedio

Actividad reciente

Rendimiento

---

El sistema deberá permitir reasignar clientes entre intermediarios sin perder historial.

---

# 48. Gestión de Proyectos

Este será el módulo principal del sistema.

Toda la información girará alrededor del proyecto.

---

## Crear Proyecto

Formulario mínimo

Nombre

Código

Cliente

Intermediario

Descripción

Estado inicial

Prioridad

Fecha estimada de inicio

Fecha estimada de entrega

Horas estimadas

Responsable principal

Etiquetas

---

## Vista del Proyecto

La vista del proyecto estará dividida mediante pestañas.

General

Tareas

Cronograma

Comentarios

Archivos

Equipo

Historial

Indicadores

Configuración

---

## Información General

Código

Nombre

Descripción

Estado

Cliente

Intermediario

Responsable

Prioridad

Fecha inicio

Fecha entrega

Horas estimadas

Horas trabajadas

Tiempo restante

Progreso

Indicador de salud

---

## Indicador de Salud del Proyecto

Cada proyecto tendrá un estado calculado automáticamente.

Verde

Proyecto dentro del cronograma.

Amarillo

Existe riesgo moderado.

Rojo

Proyecto atrasado.

Este cálculo dependerá de:

Tiempo consumido

Tareas pendientes

Hitos vencidos

Actividad reciente

---

## Timeline

Cada proyecto tendrá una línea de tiempo.

Ejemplo

Proyecto creado

↓

Primera tarea creada

↓

Diseño aprobado

↓

Backend terminado

↓

Frontend terminado

↓

QA

↓

Entrega

↓

Finalización

Toda acción importante deberá agregarse automáticamente.

---

## Equipo del proyecto

Mostrar

Responsables

Rol

Última actividad

Cantidad de tareas

Horas trabajadas

---

## Archivos

Los archivos deberán organizarse mediante carpetas virtuales.

Ejemplo

Contratos

Diseño

Frontend

Backend

Documentación

Recursos

Entregables

Otros

---

## Configuración del Proyecto

Permitir

Cambiar estado

Cambiar prioridad

Cambiar responsable

Archivar

Duplicar proyecto

Exportar proyecto

Transferir cliente

Transferir intermediario

---

# 49. Proyecto Archivado

Los proyectos archivados no podrán modificarse.

Únicamente podrán consultarse.

Podrán restaurarse posteriormente.

Nunca deberán eliminarse definitivamente desde la interfaz.

---

# 50. Búsqueda Global

Toda la plataforma contará con un buscador global.

Permitirá buscar

Clientes

Usuarios

Proyectos

Comentarios

Archivos

Etiquetas

Tareas

Resultados agrupados por categoría.

---

## Filtros Avanzados

El sistema deberá permitir combinar múltiples filtros.

Ejemplo

Cliente

+

Estado

+

Fecha

+

Responsable

+

Prioridad

+

Intermediario

+

Etiquetas

+

Rango de horas

---

## Guardado de filtros

El usuario podrá guardar filtros personalizados para reutilizarlos posteriormente.

---

## Favoritos

Los usuarios podrán marcar como favoritos:

Clientes

Proyectos

Tareas

Archivos

Estos aparecerán en un acceso rápido del dashboard.

---

## Recientes

La plataforma mostrará automáticamente los últimos elementos visitados para facilitar la navegación.

---

# PRD.md

# Parte 5 — Gestión de Tareas, Planificación, Estimaciones y Seguimiento del Proyecto

---

# 51. Filosofía del Módulo de Tareas

Las tareas representan la unidad mínima de trabajo del sistema.

Todo trabajo realizado dentro de un proyecto deberá registrarse mediante una tarea.

No deberán existir actividades importantes fuera del módulo de tareas.

El progreso del proyecto dependerá directamente de las tareas y no podrá modificarse manualmente.

---

# 52. Objetivos del módulo

El módulo deberá permitir:

- Planificar el trabajo.
- Distribuir responsabilidades.
- Estimar tiempos.
- Registrar horas.
- Detectar retrasos.
- Calcular progreso.
- Medir productividad.
- Mantener historial.
- Facilitar auditoría.

---

# 53. Crear una tarea

Al crear una tarea se deberá solicitar como mínimo:

## Información General

Título

Descripción

Proyecto

Responsable

Prioridad

Estado inicial

Fecha estimada de inicio

Fecha estimada de finalización

Horas estimadas

Peso de la tarea

Etiquetas

Dependencias

Archivos iniciales

Observaciones

---

## Campos opcionales

Sprint

Milestone

Versión

Epic (preparado)

Componente

Categoría

Tipo de tarea

Color identificador

---

# 54. Tipos de tarea

El sistema deberá soportar diferentes tipos.

Ejemplos

Feature

Bug

Hotfix

Mejora

Investigación

Diseño

Backend

Frontend

Base de Datos

DevOps

Documentación

Testing

QA

Reunión

Otro

Cada tipo podrá tener un color e ícono configurable.

---

# 55. Estados de las tareas

Estados iniciales recomendados

Pendiente

Planificada

Lista para iniciar

En progreso

En revisión

QA

Correcciones

Bloqueada

Esperando cliente

Finalizada

Cancelada

Archivada

La arquitectura deberá permitir crear nuevos estados sin modificar código.

---

# 56. Flujo de estados

Ejemplo recomendado

Pendiente

↓

Planificada

↓

En progreso

↓

En revisión

↓

QA

↓

Finalizada

En cualquier momento podrá pasar a:

Bloqueada

↓

Correcciones

↓

Cancelada

---

No todos los estados deberán permitir cualquier transición.

Las transiciones deberán ser configurables.

---

# 57. Prioridades

Cada tarea tendrá una prioridad.

Muy Baja

Baja

Media

Alta

Crítica

Urgente

La prioridad afectará:

Ordenamiento

Alertas

Indicadores

Paneles

Reportes

---

# 58. Peso de la tarea

Además de las horas estimadas, cada tarea tendrá un peso relativo.

Ejemplo

1

2

3

5

8

13

21

55

89

Preparado para metodologías ágiles basadas en Story Points.

Inicialmente el progreso podrá calcularse usando horas estimadas o peso, según una configuración global.

---

# 59. Subtareas

Una tarea podrá contener subtareas.

Ejemplo

Desarrollar Login

↓

Diseñar interfaz

↓

Crear API

↓

Crear formulario

↓

Validaciones

↓

Pruebas

↓

Documentación

Las subtareas heredarán el proyecto padre.

Cada subtarea podrá tener:

Responsable

Horas

Comentarios

Archivos

Estado

Prioridad

---

# 60. Dependencias

Las tareas podrán depender unas de otras.

Tipos de dependencia

Finish to Start

Start to Start

Finish to Finish

Start to Finish (preparado)

Ejemplo

API Usuarios

↓

Frontend Usuarios

El sistema deberá advertir cuando una tarea dependa de otra aún no finalizada.

---

# 61. Checklists

Cada tarea podrá contener múltiples listas de verificación.

Ejemplo

Login

☐ Diseño aprobado

☐ API creada

☐ Validaciones

☐ Responsive

☐ QA

☐ Documentación

El porcentaje del checklist podrá influir en el avance visual de la tarea, pero no reemplazará su estado.

---

# 62. Comentarios en tareas

Cada tarea tendrá un hilo independiente de conversación.

Cada comentario permitirá:

Texto enriquecido

Responder comentarios

Editar

Eliminar según permisos

Adjuntar archivos

Mencionar usuarios

Reaccionar (preparado)

Registrar fecha

Registrar autor

Registrar edición

---

# 63. Archivos de tareas

Cada tarea podrá contener archivos.

Ejemplos

Diseños

Mockups

PDF

Imágenes

Videos

ZIP

Documentación

Los archivos deberán almacenarse en Cloudflare R2.

---

# 64. Historial de tareas

Toda modificación generará un registro.

Ejemplos

Estado cambiado

Responsable cambiado

Horas modificadas

Archivo agregado

Comentario agregado

Fecha modificada

Prioridad modificada

Etiqueta agregada

No se permitirá eliminar el historial.

---

# 65. Registro de Tiempo (Time Tracking)

Cada tarea permitirá registrar tiempo trabajado.

Cada registro contendrá:

Usuario

Fecha

Hora de inicio

Hora de finalización

Tiempo total

Descripción

Tipo de trabajo

Observaciones

---

Ejemplo

Juan

29/07/2026

09:00

11:30

2h 30m

Implementación del módulo de autenticación.

---

# 66. Horas Estimadas

Toda tarea deberá poseer una estimación inicial.

Las horas estimadas servirán para:

Planificación

KPIs

Cronograma

Indicadores

Alertas

Progreso

No podrán quedar vacías.

---

# 67. Horas Trabajadas

Las horas trabajadas serán calculadas automáticamente mediante el registro de tiempo.

También podrán corregirse manualmente únicamente por usuarios con permisos especiales.

Toda modificación quedará registrada.

---

# 68. Tiempo Restante

El sistema calculará automáticamente:

Tiempo restante = Horas estimadas - Horas trabajadas

Nunca deberá mostrarse un tiempo negativo.

Cuando las horas trabajadas superen las estimadas se mostrará:

Exceso de tiempo

---

# 69. Estimación de Proyectos

Cada proyecto contará con una planificación temporal.

Campos

Fecha estimada de inicio

Fecha estimada de finalización

Horas estimadas

Horas consumidas

Horas restantes

Días restantes

Porcentaje esperado

Porcentaje real

Desviación

---

# 70. Cálculo del progreso

El progreso no será editable manualmente.

Se calculará automáticamente.

Método inicial

Basado en tareas finalizadas.

Fórmula recomendada

Progreso =
(Suma del peso de tareas finalizadas / Suma total del peso de tareas) × 100

Alternativamente podrá utilizar horas estimadas como base mediante configuración.

---

# 71. Progreso esperado

Además del progreso real, el sistema calculará un progreso esperado según el tiempo transcurrido.

Ejemplo

Duración estimada

100 días

Han pasado

40 días

Progreso esperado

40%

Si el progreso real es:

65%

Proyecto adelantado.

Si el progreso real es:

35%

Proyecto dentro del rango.

Si el progreso real es:

18%

Proyecto atrasado.

---

# 72. Indicador de Riesgo

Cada proyecto tendrá un indicador automático.

Verde

Todo dentro de lo esperado.

Amarillo

Existe riesgo moderado.

Rojo

Proyecto con retrasos importantes.

Factores considerados

Horas consumidas

Tiempo restante

Tareas bloqueadas

Dependencias

Milestones vencidos

Inactividad

---

# 73. Hitos (Milestones)

Los hitos representan entregables importantes.

Ejemplos

Diseño aprobado

Backend terminado

Frontend terminado

Integraciones

QA

Beta

Producción

Cada hito incluirá:

Nombre

Descripción

Fecha estimada

Fecha real

Estado

Responsable

Progreso

Tareas asociadas

---

# 74. Vista Kanban

La plataforma deberá incluir una vista Kanban.

Columnas

Pendiente

En progreso

En revisión

QA

Finalizada

Bloqueada

Las columnas deberán ser configurables.

---

Funciones

Drag & Drop

Filtros

Agrupar

Colapsar

Ordenar

Búsqueda

Cambio masivo

---

# 75. Vista Lista

También deberá existir una vista tipo tabla.

Columnas configurables

Título

Proyecto

Responsable

Estado

Prioridad

Horas estimadas

Horas trabajadas

Tiempo restante

Fecha límite

Etiquetas

---

# 76. Vista Calendario

Permitirá visualizar:

Inicio de tareas

Entrega

Milestones

Eventos importantes

Vacaciones (preparado)

Filtros

Proyecto

Responsable

Estado

Cliente

---

# 77. Vista Timeline

Cada proyecto contará con una línea temporal.

Ejemplo

Proyecto creado

↓

Milestone 1

↓

Backend

↓

Frontend

↓

QA

↓

Entrega

↓

Cierre

---

# 78. Vista Gantt (Preparada)

La arquitectura deberá contemplar una futura implementación de un diagrama de Gantt.

Se deberán almacenar todos los datos necesarios para:

Dependencias

Fechas

Duraciones

Hitos

Retrasos

Ruta crítica (futuro)

---

# 79. KPIs de Productividad

El sistema calculará automáticamente indicadores como:

Horas estimadas vs. horas reales.

Tiempo promedio por tarea.

Tiempo promedio por proyecto.

Cantidad de tareas finalizadas.

Tareas bloqueadas.

Retrasos.

Cumplimiento de fechas.

Productividad semanal.

Productividad mensual.

Cumplimiento por responsable.

---

# 80. Reglas de Negocio del Módulo

- Ninguna tarea podrá existir sin un proyecto asociado.
- Toda tarea deberá tener un responsable, salvo que permanezca en estado "Pendiente" o "Planificada".
- El progreso del proyecto se calculará automáticamente y no podrá editarse manualmente.
- Toda modificación importante generará un registro en el historial.
- Los cambios de estado deberán respetar el flujo configurado.
- Los registros de tiempo no podrán eliminarse; únicamente podrán corregirse dejando evidencia del cambio.
- Las tareas bloqueadas deberán indicar obligatoriamente el motivo del bloqueo.
- Las tareas con dependencias pendientes mostrarán advertencias visuales.
- El cierre de un proyecto requerirá que todos los hitos obligatorios estén completados o justificados.

---

# PRD.md

# Parte 6 — Comunicación, Notificaciones, Gestión Documental, Reportes y Analítica

---

# 81. Filosofía del Módulo de Comunicación

Toda la comunicación relacionada con un proyecto deberá permanecer dentro de la plataforma.

El objetivo es eliminar la dependencia de aplicaciones externas para mantener la trazabilidad de las decisiones, solicitudes y cambios.

La plataforma deberá convertirse en la fuente oficial de comunicación entre:

- Equipo de desarrollo.
- Cliente.
- Intermediario.

Cada conversación deberá estar asociada a una entidad específica (proyecto, tarea o hito) para facilitar su seguimiento.

---

# 82. Sistema de Comentarios

Los comentarios estarán disponibles en:

- Proyectos.
- Tareas.
- Hitos (Milestones).
- Archivos (preparado).

Cada comentario será un registro permanente del historial del proyecto.

---

## Información de un comentario

Cada comentario deberá contener:

- Autor.
- Fecha de creación.
- Fecha de edición.
- Contenido.
- Estado (activo/eliminado lógicamente).
- Archivos adjuntos.
- Respuestas.
- Reacciones (preparado).

---

## Editor de comentarios

El editor deberá permitir:

- Texto enriquecido (Markdown básico).
- Listas.
- Enlaces.
- Bloques de código.
- Citas.
- Imágenes.
- Archivos adjuntos.

No se permitirá HTML arbitrario por razones de seguridad.

---

## Respuestas

Los comentarios podrán responderse formando hilos.

Ejemplo:

Proyecto X

> Comentario principal

>> Respuesta

>>> Respuesta de la respuesta

La interfaz deberá mantener la conversación organizada y fácil de seguir.

---

## Menciones

Los usuarios podrán mencionar a otros mediante:

```
@usuario
```

Cuando un usuario sea mencionado:

- Se generará una notificación.
- El comentario quedará vinculado a su historial de notificaciones.

---

## Estado de los comentarios

Activo

Editado

Eliminado lógicamente

Nunca deberán eliminarse físicamente de la base de datos.

---

# 83. Gestión Documental

Todo proyecto dispondrá de un repositorio documental.

El almacenamiento físico se realizará mediante Cloudflare R2.

La base de datos almacenará únicamente los metadatos y referencias.

---

## Tipos de archivos permitidos

PDF

DOCX

XLSX

PPTX

TXT

CSV

ZIP

RAR

PNG

JPG

SVG

WEBP

MP4

MOV

JSON

Otros formatos configurables.

---

## Organización

Los archivos podrán organizarse mediante carpetas virtuales.

Ejemplo:

```
Proyecto

│

├── Contratos

├── Documentación

├── Diseño

├── Backend

├── Frontend

├── Recursos

├── QA

└── Entregables
```

---

## Información de un archivo

Cada archivo deberá registrar:

Nombre

Extensión

Tipo MIME

Peso

Fecha de carga

Usuario que lo subió

Proyecto asociado

Entidad asociada

Versión

Descripción

Etiquetas

---

## Versionado

La plataforma deberá prepararse para soportar versiones de archivos.

Ejemplo

Diseño_v1

↓

Diseño_v2

↓

Diseño_v3

↓

Diseño_Final

Cada versión conservará su historial.

---

## Acciones disponibles

Subir

Visualizar

Descargar

Renombrar

Mover

Duplicar

Archivar

Eliminar (según permisos)

Restaurar

Compartir mediante enlace (preparado)

---

## Vista previa

Cuando el tipo de archivo lo permita deberá existir una vista previa.

Ejemplos

PDF

Imagen

Video

Texto

Markdown

---

# 84. Centro de Notificaciones

Todos los eventos importantes generarán notificaciones.

---

## Tipos

Nuevo proyecto

Nueva tarea

Cambio de estado

Nuevo comentario

Mención

Archivo agregado

Milestone próximo

Proyecto atrasado

Cambio de responsable

Cambio de prioridad

Sistema

---

## Estados

No leída

Leída

Archivada

---

## Acciones

Marcar como leída

Marcar todas como leídas

Filtrar

Buscar

Eliminar (solo de la vista personal)

---

## Canales futuros

Aunque inicialmente las notificaciones serán internas, la arquitectura deberá permitir integrar:

Correo electrónico.

Notificaciones Push.

WhatsApp.

Slack.

Discord.

Microsoft Teams.

Webhooks.

---

# 85. Actividad Reciente

La plataforma mostrará un feed cronológico.

Ejemplo

09:00

Juan creó una tarea.

09:05

Carlos comentó.

09:15

Proyecto actualizado.

09:40

Cliente descargó un archivo.

10:00

Milestone completado.

---

El feed podrá filtrarse por:

Proyecto

Cliente

Usuario

Tipo

Fecha

---

# 86. Reportes

El sistema deberá generar reportes administrativos.

---

## Reportes de proyectos

Listado general.

Estado.

Progreso.

Tiempo consumido.

Tiempo restante.

Horas estimadas.

Horas reales.

Indicadores.

---

## Reportes de tareas

Pendientes.

Finalizadas.

Bloqueadas.

Por responsable.

Por prioridad.

Por proyecto.

---

## Reportes de clientes

Cantidad de proyectos.

Horas consumidas.

Tiempo promedio.

Estado de proyectos.

Actividad reciente.

---

## Reportes de intermediarios

Clientes administrados.

Proyectos activos.

Tiempo promedio.

Productividad.

---

## Reportes ejecutivos

Resumen general.

Indicadores.

Proyectos críticos.

Proyectos atrasados.

Horas.

Costos (preparado).

---

# 87. Exportaciones

Toda tabla administrativa deberá poder exportarse.

Formatos

CSV

Excel

PDF

JSON (preparado)

---

Las exportaciones respetarán los filtros aplicados.

---

# 88. Dashboard Ejecutivo

Pensado para propietarios o gerencia.

No muestra detalle operativo.

Solo indicadores.

---

## KPIs

Cantidad de clientes.

Proyectos activos.

Proyectos finalizados.

Proyectos atrasados.

Horas estimadas.

Horas trabajadas.

Cumplimiento.

Tiempo promedio.

Carga de trabajo.

Productividad.

---

## Gráficas

La arquitectura deberá permitir:

Líneas.

Barras.

Pastel.

Área.

Indicadores.

No depender de una librería específica; deberá ser fácilmente reemplazable.

---

# 89. Sistema de Búsqueda

La búsqueda será global.

Permitirá encontrar:

Proyecto.

Cliente.

Usuario.

Comentario.

Archivo.

Etiqueta.

Milestone.

Tarea.

---

## Características

Búsqueda parcial.

Búsqueda por código.

Búsqueda por nombre.

Búsqueda por descripción.

Búsqueda por etiquetas.

Orden por relevancia.

---

# 90. Filtros Avanzados

Todos los módulos deberán ofrecer filtros consistentes.

Ejemplos

Estado.

Prioridad.

Cliente.

Proyecto.

Responsable.

Fecha.

Horas.

Etiquetas.

Intermediario.

Tipo.

Los filtros podrán combinarse libremente.

---

# 91. Favoritos

Cada usuario podrá marcar como favorito:

Proyectos.

Clientes.

Archivos.

Tareas.

Reportes.

Los favoritos aparecerán en un acceso rápido del Dashboard.

---

# 92. Elementos Recientes

El sistema mantendrá una lista de los últimos elementos abiertos por cada usuario.

Ejemplos

Últimos proyectos.

Últimos clientes.

Últimas tareas.

Últimos archivos.

Esto permitirá volver rápidamente al trabajo reciente.

---

# 93. Sistema de Auditoría

Toda acción importante deberá registrarse.

Ejemplos

Inicio de sesión.

Cambio de contraseña.

Creación de proyecto.

Cambio de estado.

Cambio de prioridad.

Archivo eliminado.

Permiso modificado.

Comentario eliminado.

---

## Información registrada

Usuario.

Fecha.

Hora.

Entidad.

Acción.

Valor anterior.

Valor nuevo.

Dirección IP (si está disponible).

Navegador.

Sistema operativo (cuando sea posible).

---

## Consulta de auditoría

Solo los usuarios autorizados podrán acceder al historial completo.

El historial deberá permitir:

Buscar.

Filtrar.

Exportar.

Comparar cambios.

---

# 94. Configuración General

El sistema contará con un módulo centralizado de configuración.

---

## Configuración de empresa

Nombre.

Logotipo.

Correo.

Sitio web.

Zona horaria.

Idioma por defecto.

Formato de fecha.

Formato de hora.

---

## Configuración de proyectos

Estados disponibles.

Prioridades.

Tipos de tarea.

Tipos de proyecto.

Colores.

Reglas de cálculo del progreso.

Método de estimación.

---

## Configuración de usuarios

Avatar.

Idioma.

Zona horaria.

Tema.

Preferencias de notificaciones.

---

# 95. Internacionalización (Preparado)

Aunque la primera versión estará disponible en un idioma principal, toda la aplicación deberá prepararse para soportar múltiples idiomas mediante archivos de traducción.

No deberán existir textos fijos directamente en los componentes.

---

# 96. Accesibilidad

La aplicación deberá cumplir buenas prácticas de accesibilidad:

- Navegación mediante teclado.
- Etiquetas ARIA cuando sean necesarias.
- Contraste adecuado.
- Componentes accesibles.
- Soporte para lectores de pantalla.
- Indicadores visuales y textuales para estados importantes.

---

# 97. Reglas Generales de Comunicación

- Toda conversación deberá quedar asociada a una entidad.
- No se permitirá la eliminación física de comentarios.
- Los archivos adjuntos deberán respetar permisos.
- Las notificaciones deberán ser idempotentes para evitar duplicados.
- Las exportaciones deberán respetar los permisos del usuario.
- La auditoría deberá registrar todas las acciones críticas del sistema.

---

# PRD.md

# Parte 7 — Requisitos Funcionales, Arquitectura de Desarrollo, Seguridad, Roadmap y Criterios de Aceptación

---

# 98. Requisitos Funcionales (RF)

Los siguientes requisitos funcionales representan el comportamiento esperado del sistema. Todos deberán implementarse para considerar el producto conforme a este PRD.

---

## RF-001 Autenticación

El sistema deberá permitir:

- Inicio de sesión mediante NextAuth (Auth.js).
- Cierre de sesión.
- Recuperación de contraseña.
- Renovación automática de sesión.
- Protección de rutas privadas.

---

## RF-002 Gestión de Usuarios

El sistema deberá permitir:

- Crear usuarios.
- Editar usuarios.
- Desactivar usuarios.
- Reactivar usuarios.
- Asignar roles.
- Actualizar perfil.

---

## RF-003 Gestión de Clientes

El sistema deberá permitir:

- Crear clientes.
- Editar clientes.
- Archivar clientes.
- Buscar clientes.
- Filtrar clientes.
- Consultar historial.
- Asociar múltiples proyectos.

---

## RF-004 Gestión de Intermediarios

El sistema deberá permitir:

- Registrar intermediarios.
- Asociar clientes.
- Reasignar clientes.
- Consultar proyectos.
- Ver indicadores.

---

## RF-005 Gestión de Proyectos

El sistema deberá permitir:

- Crear proyectos.
- Editar proyectos.
- Duplicar proyectos.
- Archivar proyectos.
- Restaurar proyectos.
- Consultar historial.
- Asignar equipo.
- Configurar estados.

---

## RF-006 Gestión de Tareas

El sistema deberá permitir:

- Crear tareas.
- Crear subtareas.
- Registrar tiempo.
- Cambiar estado.
- Reordenar tareas.
- Mover mediante Drag & Drop.
- Registrar dependencias.
- Agregar checklists.
- Agregar comentarios.

---

## RF-007 Gestión Documental

El sistema deberá permitir:

- Subir archivos.
- Descargar archivos.
- Versionar archivos.
- Buscar archivos.
- Organizar archivos.

---

## RF-008 Comentarios

El sistema deberá permitir:

- Crear comentarios.
- Responder comentarios.
- Editar comentarios.
- Adjuntar archivos.
- Mencionar usuarios.

---

## RF-009 Dashboard

Cada rol visualizará un dashboard distinto con información personalizada.

---

## RF-010 Reportes

El sistema deberá generar reportes exportables en diferentes formatos.

---

## RF-011 Auditoría

Toda acción importante deberá quedar registrada.

---

## RF-012 Notificaciones

El sistema notificará automáticamente los eventos relevantes.

---

## RF-013 Estimaciones

El sistema calculará automáticamente:

- Horas restantes.
- Tiempo restante.
- Desviación.
- Progreso esperado.
- Progreso real.

---

## RF-014 KPIs

El sistema calculará indicadores automáticamente.

---

## RF-015 Progressive Web App

El sistema deberá instalarse como aplicación desde cualquier navegador compatible.

---

# 99. Requisitos No Funcionales (RNF)

---

## RNF-001 Rendimiento

Las páginas deberán cargar rápidamente.

Se recomienda mantener:

- Consultas optimizadas.
- Paginación.
- Lazy Loading.
- Suspense.
- Streaming cuando aplique.

---

## RNF-002 Escalabilidad

La arquitectura deberá soportar crecimiento sin modificaciones estructurales importantes.

---

## RNF-003 Seguridad

Toda operación crítica deberá validarse tanto en cliente como en servidor.

---

## RNF-004 Accesibilidad

La plataforma deberá cumplir buenas prácticas WCAG cuando sea posible.

---

## RNF-005 Compatibilidad

Compatible con:

- Chrome
- Edge
- Firefox
- Safari

Compatible con:

- Windows
- macOS
- Linux
- Android
- iOS

---

## RNF-006 PWA

Debe funcionar correctamente como aplicación instalable.

---

## RNF-007 Disponibilidad

La aplicación deberá estar preparada para ejecutarse sobre infraestructura serverless.

---

## RNF-008 Mantenibilidad

El código deberá:

- Ser modular.
- Reutilizable.
- Tipado.
- Documentado cuando aporte valor.

---

## RNF-009 Calidad

No deberá existir código duplicado innecesariamente.

---

# 100. Arquitectura de Despliegue

La infraestructura inicial estará compuesta por:

Frontend

↓

Next.js

↓

Vercel

Backend

↓

Turso

↓

libSQL

↓

Storage

↓

Cloudflare R2

↓

Auth

↓

NextAuth (Auth.js)

---

La arquitectura deberá facilitar futuras integraciones con:

Redis.

Servicios de colas.

Funciones serverless.

Microservicios.

IA.

---

# 101. Estrategia de Seguridad

Toda la aplicación deberá seguir el principio de menor privilegio.

---

## Seguridad del Cliente

- Validación con Zod.
- Sanitización de entradas.
- Formularios seguros.

---

## Seguridad del Servidor

- Validación de sesión.
- Validación de permisos.
- Validación de datos.
- Control de acceso.

---

## Seguridad de Base de Datos

- Autorización en la capa de acceso a datos.
- Reglas de acceso por tabla.
- Restricciones.
- Integridad referencial.

---

## Seguridad de Archivos

Validación de:

Tipo.

Tamaño.

Permisos.

Origen.

---

# 102. Estrategia de Optimización

El proyecto deberá priorizar:

Server Components.

Server Actions.

Streaming.

Lazy Loading.

Code Splitting.

Optimización de imágenes.

Caching inteligente.

Paginación.

Consultas indexadas.

---

# 103. Estrategia de Testing (Preparada)

La arquitectura deberá facilitar:

Pruebas unitarias.

Pruebas de integración.

Pruebas E2E.

Pruebas visuales.

No es obligatorio implementarlas en la primera versión, pero el diseño no debe impedir su incorporación.

---

# 104. Convenciones para IA de Desarrollo

Este proyecto podrá desarrollarse parcialmente con herramientas de IA (Codex, Cursor, Claude Code, Gemini, etc.). Para garantizar consistencia, se establecen las siguientes reglas obligatorias:

## Arquitectura

- No romper la estructura modular definida en este PRD.
- Mantener separación estricta entre lógica de negocio, acceso a datos y presentación.
- No duplicar lógica.
- Favorecer composición sobre herencia.

## Código

- TypeScript en modo estricto.
- No utilizar `any` salvo justificación excepcional.
- Mantener funciones pequeñas y enfocadas.
- Utilizar nombres descriptivos.
- Evitar comentarios innecesarios; el código debe ser autoexplicativo.

## Diseño

- Respetar estrictamente el documento `DESING.md`.
- No introducir estilos personalizados que contradigan el sistema de diseño.
- Reutilizar componentes antes de crear nuevos.

## Formularios

- Todos los formularios deberán usar React Hook Form.
- Validaciones compartidas con Zod.

## Datos

- No acceder directamente a la base de datos desde componentes de UI.
- Centralizar el acceso a datos en servicios o acciones.
- Mantener tipos compartidos.

## Componentes

- Un componente debe tener una única responsabilidad.
- Evitar componentes excesivamente grandes.
- Dividir componentes cuando superen una complejidad razonable.

## Base de Datos

- Toda modificación deberá realizarse mediante migraciones.
- Mantener consistencia entre esquema, tipos y reglas de acceso.

---

# 105. Roadmap de Versiones

## Versión 1.0

- Autenticación.
- RBAC.
- Clientes.
- Intermediarios.
- Proyectos.
- Tareas.
- Comentarios.
- Archivos.
- Dashboards.
- Reportes básicos.
- PWA.

---

## Versión 1.1

- Notificaciones Push.
- Compartición de archivos mediante enlaces.
- Personalización de dashboard.
- Exportaciones avanzadas.

---

## Versión 1.2

- Integración con GitHub.
- Integración con GitLab.
- Integración con Slack.
- Integración con Discord.
- Integración con Microsoft Teams.

---

## Versión 2.0

- Multiempresa (Multi-tenant).
- API pública.
- Automatizaciones.
- Motor de reglas.
- Automatización mediante IA.
- Asistente inteligente para gestión de proyectos.

---

# 106. Criterios de Aceptación

El proyecto se considerará conforme cuando:

- Todos los módulos definidos en este PRD estén implementados.
- Los permisos funcionen correctamente.
- La PWA sea instalable.
- El progreso se calcule automáticamente.
- Las estimaciones funcionen.
- La comunicación quede registrada.
- La auditoría registre todas las acciones críticas.
- Se respeten las convenciones de desarrollo.
- El diseño siga `DESING.md`.

---

# 107. Funcionalidades Futuras (Backlog)

Las siguientes funcionalidades quedan fuera del alcance inicial, pero la arquitectura deberá permitir su incorporación sin refactorizaciones mayores:

- Chat en tiempo real.
- Videollamadas.
- Integración con calendarios externos.
- Facturación.
- Gestión de pagos.
- Firma electrónica.
- OCR de documentos.
- Automatización mediante IA.
- Predicción de retrasos.
- Análisis de productividad con IA.
- Aplicaciones móviles nativas.
- Marketplace de extensiones.

---

# 108. Checklist de Implementación

## Infraestructura

- [ ] Configuración de Next.js 16.
- [ ] Configuración de Turso.
- [ ] Configuración de Tailwind CSS.
- [ ] Configuración de shadcn/ui.
- [ ] Configuración de TypeScript estricto.

## Seguridad

- [ ] NextAuth (Auth.js).
- [ ] RBAC.
- [ ] Autorización en la capa de datos.
- [ ] Middleware de autenticación.

## Módulos

- [ ] Dashboard Developer.
- [ ] Dashboard Cliente.
- [ ] Dashboard Intermediario.
- [ ] Clientes.
- [ ] Intermediarios.
- [ ] Proyectos.
- [ ] Tareas.
- [ ] Hitos.
- [ ] Comentarios.
- [ ] Archivos.
- [ ] Reportes.
- [ ] Auditoría.
- [ ] Configuración.

## PWA

- [ ] Manifest.
- [ ] Service Worker.
- [ ] Instalación.
- [ ] Caché.
- [ ] Iconos.

---

# 109. Conclusión

Este PRD constituye la especificación funcional y técnica de referencia para el desarrollo de la plataforma de gestión, control y visualización de proyectos.

Toda implementación deberá respetar las decisiones aquí documentadas y cualquier modificación futura deberá reflejarse en este documento para mantener una única fuente de verdad del producto.

La combinación de una arquitectura modular, un modelo de datos escalable, un sistema robusto de permisos, una experiencia optimizada para PWA y una integración estrecha con Turso permitirá construir una solución preparada para evolucionar hacia un producto SaaS de nivel profesional.

