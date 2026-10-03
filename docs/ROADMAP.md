# Roadmap Técnico — AdmiPy

Versión: 1.0 · Documento de planificación (BACKLOG Épica 17, Historia 17.14)

Este documento consolida el roadmap de versiones futuras y las decisiones
arquitectónicas que preparan cada etapa sin comprometer el núcleo actual.

---

## Versión 2 — Planificación avanzada

- **Diagrama de Gantt** con dependencias visuales de tareas e hitos
  (las tablas `task_dependencies` y `milestone_dependencies` ya existen y
  validan ciclos).
- **Dependencias avanzadas**: tipos Start-to-Finish/Finish-to-Finish y
  reprogramación en cascada.
- **Automatizaciones visuales**: editor de reglas sobre el motor de
  eventos (`lib/events/bus.ts`, `automation_rules`), con más acciones
  (crear tarea, enviar correo, llamar webhook con plantillas).
- **Webhooks administrados**: UI de pruebas por evento, métricas de
  entrega y reintentos con backoff exponencial.
- **Vista calendario compartible** (ICS bidireccional; hoy la feed es
  de solo lectura en `/api/v1/calendar`).

## Versión 3 — IA y apps nativas

- **Aplicación móvil nativa** (React Native / Expo) consumiendo la API
  pública v1 (`/api/v1/*`, autenticación por API keys ya disponible).
- **API pública completa**: endpoints de escritura con scope `write`
  (reservado en el modelo de keys), OAuth2 para apps de terceros.
- **Funciones de IA**: resúmenes automáticos de actividad, generación de
  reportes, análisis de riesgos y estimaciones. Punto de extensión: los
  eventos internos (`system_events`) y el `ModuleReport` estandarizado
  son las entradas naturales para un servicio de IA.

## Versión 4 — Ecosistema

- **Marketplace de plantillas** (la tabla `templates` ya modela payloads
  por entidad).
- **Sistema de plugins** (Historia 17.8): registro de extensiones que
  pueden suscribirse al bus de eventos (`subscribe()`) y aportar
  widgets de dashboard (`components/dashboard` es una librería de
  widgets puros alimentados por servicios batcheados — el patrón que
  cualquier plugin debería seguir).
- **Integraciones premium**: Slack/Teams/Discord como canales de
  notificación (el `EmailService` define el patrón de transporte; los
  nuevos canales implementan la misma interfaz), sincronización
  bidireccional con Google Calendar/Outlook.

---

## Preparación para Multi-Tenant (17.13)

La arquitectura ya está alineada con la evolución multi-tenant:

- **Autorización centralizada**: todos los accesos a datos pasan por
  `lib/auth-scope.ts`; añadir un filtro `tenant_id` es un cambio local
  en ese módulo (y en las migraciones), no transversal.
- **Claves API por propietario**: `withActor()` permite ejecutar cualquier
  consulta con el perfil de otro actor — base natural para aislamiento
  por tenant.
- **Eventos y colas**: `system_events`, `webhook_deliveries` y la
  ejecución diferida (`after`) escalan a colas de trabajo externas
  (QStash, SQS, Cloudflare Queues) sin cambiar los call sites.
- **Cache distribuido**: los datos se leen por servicio con consultas
  agregadas batcheadas (sin N+1); introducir una capa de cache por
  tenant solo requiere envolver `lib/turso/client`.

## Notas de infraestructura

- **Monitoreo (17.12)**: `/api/health` expone estado + latencia de base
  de datos; el Activity Log registra eventos de seguridad y uso de API.
  La integración con observabilidad externa (Sentry, OTel) se limita a
  instrumentar `console.error` centralizado y el bus de eventos.
- **Escalado horizontal**: despliegue serverless-compatible (Vercel);
  sin estado local salvo cachés de SW en el cliente.
