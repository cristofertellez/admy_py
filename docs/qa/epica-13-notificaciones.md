# QA — Épica 13: Notificaciones y Centro de Actividad

Alcance: centro de notificaciones (13.1/13.9/13.10/13.12), generación de
eventos (13.2), recordatorios (13.5), preferencias (13.6), destinatarios
por rol (13.11) y arquitectura de email/push (13.3/13.4).

## Centro de notificaciones

1. **Generación** — crear un proyecto, comentar una tarea, subir un archivo
   y completar un hito con un intermediario asignado: cada acción produce
   notificaciones en la audiencia correcta (`getProjectRecipients`:
   miembros + intermediarios + usuario Cliente por email). El autor no se
   auto-notifica.
2. **Dedupe** — recargar el dashboard varias veces el mismo día no duplica
   los recordatorios basados en tiempo (claves por receptor y fecha).
3. **KPIs** — Total/Unread/Today/This week reflejan los datos reales de la
   cuenta (verificado con `getStats`); la campana del header muestra el
   contador de no leídas y enlaza al centro.
4. **Filtros y búsqueda** — texto (título/mensaje), tipo, estado de
   lectura y rango de fechas viven en la URL; la paginación navega sin
   perder el filtro; la agrupación muestra Today/Yesterday/fecha.
5. **Marcar** — "Mark read/unread" alterna por notificación, "Mark all as
   read" marca todo, "Dismiss" oculta sin borrar (`dismissed_at`); todos
   quedan en el Activity Log.
6. **Preferencias** — desactivar in-app o un tipo de evento detiene la
   generación para ese usuario (`create` respeta preferencias); guardar
   audita `updated_notification_preferences`.

## Recordatorios (13.5)

- Con `reminder_enabled = false` en Ajustes, `syncTimeBasedNotifications`
  no genera nada.
- `reminder_days` modifica la ventana de vencimientos (7 por defecto).
- Tarea con `estimated_end` vencida → notificación `task_due_soon` "Task
  overdue" para el responsable.
- Proyecto sin actividad 14 días → recordatorio a su audiencia.
- Comentario raíz sin respuestas 3 días → recordatorio a la audiencia
  (excluyendo al autor).

## Email y Push (preparados)

- `EmailService` registra los correos en consola mientras no exista SMTP
  (arquitectura de transporte, sin dependencias); la preferencia de
  frecuencia y las horas silenciosas se respetan en `sendNotification`.
- `push_subscriptions` registra endpoint/keys por usuario vía acción
  `registerPushSubscription`; el SW contiene handlers `push` y
  `notificationclick` listos para el proveedor VAPID.

## RBAC

- Un Client solo ve notificaciones de sus proyectos; un Intermediary de su
  cartera; los UPDATE/SELECT siempre aplican `receiver_id` del usuario de
  sesión. La configuración global de notificaciones exige `settings.*`.
