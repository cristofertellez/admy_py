# QA — Historia 14.11: Compatibilidad de la PWA

Objetivo: validar el funcionamiento de la PWA en los navegadores y
dispositivos de soporte objetivo.

## Matriz de verificación

### Navegadores de escritorio

| Navegador | Instalación | Offline (SW caché) | Cola de acciones | Actualización SW | Estado |
|-----------|-------------|--------------------|------------------|------------------|--------|
| Chrome (última) | beforeinstallprompt | OK | OK | OK (auto o prompt según ajuste `pwa_auto_updates`) | [ ] Verificado |
| Edge (última) | beforeinstallprompt | OK | OK | OK | [ ] Verificado |
| Firefox (última) | Sin prompt nativo (instalación manual) | OK | OK | OK | [ ] Verificado |
| Safari macOS | Guía manual (Compartir → Añadir al Dock) | OK | OK | OK | [ ] Verificado |

### Dispositivos

| Dispositivo | Instalación | Offline | Sync al reconectar | Push (preparado) | Estado |
|-------------|-------------|---------|-------------------|------------------|--------|
| Escritorio (Windows/macOS/Linux) | Según navegador | Páginas visitadas + RSC | Automática | Handler registrado en `sw.js`; falta proveedor VAPID | [ ] Verificado |
| Tablet Android | beforeinstallprompt | OK | Automática | Handler registrado | [ ] Verificado |
| Android (Chrome) | beforeinstallprompt | OK | Automática | Handler registrado | [ ] Verificado |
| iPhone/iPad (Safari) | Guía manual "Add to Home Screen" | OK | Automática al abrir la app | Safari no soporta Web Push en < 16.4; handler registrado | [ ] Verificado |

## Puntos de verificación manual

1. **Instalación** — el banner `InstallPrompt` aparece una vez y es
   re-dismissible; el evento `pwa_installed` queda en el Activity Log.
2. **Modo offline** — navegar con conexión a Proyectos, Tareas y Detalle
   de proyecto/tarea; activar modo offline del navegador; las páginas
   visitadas siguen navegables (caché del SW) y el banner "You are
   offline" aparece en el dashboard.
3. **Recientes offline** — la página `/offline` lista los últimos
   proyectos/tareas visitados (Historia 14.6) y enlaza a las versiones
   cacheadas.
4. **Cola de acciones** — con la conexión cortada, crear un comentario de
   proyecto/tarea o editar una tarea; se muestra el mensaje de cola; al
   reconectar se sincroniza y se audita `pwa_sync_completed`.
5. **Actualizaciones** — con `pwa_auto_updates = false` (Ajustes →
   Progressive Web App), publicar una nueva versión; debe aparecer el
   diálogo "A new version is available" con "Update now" / "Remind later"
   y auditar `pwa_updated` al aplicar.
6. **Accesibilidad** — zoom activo (el viewport no fija maximumScale en
   flujos de lectura), foco visible en todos los botones del banner y
   contraste suficiente.

## Hallazgos conocidos

- El viewport fija `maximumScale: 1` (WCAG 1.4.4): pendiente de decisión
  de diseño para permitir zoom nativo.
- Web Push: arquitectura preparada (tabla `push_subscriptions`, handlers
  `push`/`notificationclick`); requiere proveedor VAPID para activarse.
- Background Sync nativo del Service Worker: mejora futura (14.15); hoy
  la cola se procesa con la pestaña abierta.
