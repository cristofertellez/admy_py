# QA — Historia 16.13: Bloqueo de cuenta por intentos fallidos

Alcance: protección contra fuerza bruta en el login usando los ajustes
`login_max_attempts` (por defecto 5) y `auto_lock_minutes` (por defecto 15).

## Flujo de verificación

1. **Contador de intentos** — con credenciales incorrectas para un usuario
   existente, cada intento incrementa `users.failed_login_attempts`; el
   Activity Log registra `login_failed` (solo el email, nunca el
   contraste).
2. **Bloqueo** — al alcanzar `login_max_attempts`, `users.locked_until`
   se fija a ahora + `auto_lock_minutes`, el contador se resetea a 0 y el
   evento `account_locked` queda en el Activity Log (visible con el filtro
   "Security events only").
3. **Mensajes** — con la cuenta bloqueada, el formulario de login muestra
   "Account temporarily locked due to failed attempts. Try again after
   HH:MM:SS" (pre-check en la acción); aunque se invoque `signIn`
   directamente, el proveedor de credenciales rechaza con `locked_until`
   vigente.
4. **Recuperación** — esperado el plazo (o manualmente en base de datos
   en pruebas), un login correcto entra y limpia
   `failed_login_attempts`/`locked_until`.
5. **Ajustes** — Ajustes → Security permite cambiar ambos umbrales; con
   `login_max_attempts` alto el bloqueo no se dispara en pruebas de humo.

## Notas

- El bloqueo se aplica dentro del `authorize` del proveedor de
  credenciales (`auth.ts`), de modo que cubre cualquier cliente de
  `signIn`, no solo el formulario.
- Migración 00014 (`failed_login_attempts`, `locked_until`).
