# QA — Historia 14.2: Instalación de la PWA

Historia: BACKLOG.md → Épica 14 / Historia 14.2 (Instalación)

Fecha de ejecución automatizada: 2026-08-22

---

## 1. Evidencia automatizada (Windows, build producción)

Entorno: `next build` + `next start`, verificación vía HTTP sobre `http://localhost:3100`.

Nota: el Service Worker solo se registra en producción (`ServiceWorkerRegister`), por lo que todo el QA debe ejecutarse contra build de producción.

### 1.1 Recursos estáticos del PWA

| Recurso | Estado | Content-Type |
| --- | --- | --- |
| `/manifest.json` | PASS | application/json |
| `/sw.js` | PASS | application/javascript |
| `/icons/icon-192.png` | PASS | image/png |
| `/icons/icon-512.png` | PASS | image/png |
| `/icons/icon-512-maskable.png` | PASS | image/png |
| `/icons/icon.svg` | PASS | image/svg+xml |

### 1.2 Criterios de instalabilidad del manifest (Chromium / Android)

| Criterio | Resultado |
| --- | --- |
| `name` presente | PASS (AdmiPy) |
| `short_name` presente | PASS (AdmiPy) |
| `start_url` dentro de `scope` | PASS (`/dashboard` en `/`) |
| `display` instalable | PASS (`standalone`) |
| Icono 192x192 | PASS |
| Icono 512x512 | PASS |
| Icono `maskable` | PASS |

### 1.3 Headers del Service Worker

| Header | Resultado |
| --- | --- |
| `Service-Worker-Allowed: /` | PASS |
| `Cache-Control: public, max-age=0, must-revalidate` | PASS |

### 1.4 Metadatos HTML (página renderizada)

| Metadato | Resultado |
| --- | --- |
| `<link rel="manifest">` | PASS |
| `<link rel="apple-touch-icon">` (192px) | PASS |
| `<meta name="mobile-web-app-capable">` | PASS |
| `<meta name="apple-mobile-web-app-capable">` (legado iOS < 16.4) | PASS |
| `<meta name="apple-mobile-web-app-title">` | PASS |
| `<meta name="apple-mobile-web-app-status-bar-style">` | PASS |
| `<meta name="theme-color">` | PASS |
| Viewport `width=device-width` | PASS |

### 1.5 Flujo instalado sin sesión

`GET /dashboard` sin cookies → `307` a `/login?redirect=/dashboard`. La app instalada siempre aterriza en login si no hay sesión. PASS.

### 1.6 Lighthouse PWA (lighthouse@10.4.0, headless Chrome)

Resultado de categoría PWA: **100%**.

| Auditoría | Resultado |
| --- | --- |
| Registers a service worker that controls page and `start_url` | PASS |
| Web app manifest and service worker meet the installability requirements | PASS |
| Has a `<meta name="viewport">` tag with `width` or `initial-scale` | PASS |
| Configured for a custom splash screen | PASS |
| Sets a theme color for the address bar | PASS |
| Manifest has a maskable icon | PASS |
| Content is sized correctly for the viewport | PASS |

La auditoría "installability requirements" es exactamente la que Chrome, Edge (escritorio y Android) usan para habilitar el prompt de instalación, por lo que cubre los criterios de las plataformas Chromium al nivel de criterios técnicos.

---

## 2. Checklist manual por plataforma (pendiente de dispositivos físicos)

Requiere despliegue HTTPS (o túnel tipo ngrok para móviles). El prompt nativo de Chromium puede requerir interacción previa del usuario (heurística de engagement); el banner propio (`InstallPrompt`) aparece independientemente tras cargar el dashboard.

### Google Chrome (Windows)

- [ ] Abrir la app, verificar banner "Install AdmiPy" en el dashboard.
- [ ] Aceptar instalación → ventana independiente sin barra de URL.
- [ ] Verificar icono en menú inicio/escritorio y que abre `/dashboard`.
- [ ] Desinstalar desde `chrome://apps`.

### Microsoft Edge (Windows)

- [ ] Mismo flujo vía banner o menú → Aplicaciones → Instalar este sitio como aplicación.
- [ ] Verificar ventana standalone y acceso desde menú inicio.
- [ ] Confirmar que comparte criterios de instalabilidad (motor Chromium).

### Windows (genérico)

- [ ] Atajos creados correctamente.
- [ ] App listada en "Aplicaciones instaladas" y desinstalable.

### macOS (Chrome)

- [ ] Banner de instalación visible.
- [ ] App creada en `chrome://apps` / Launchpad.

### Safari (macOS)

- [ ] Archivo → Agregar al Dock (Safari 17+).
- [ ] Ventana standalone con icono correcto (usa apple-touch-icon/manifest).

### Android (Chrome)

- [ ] Menú ⋮ → "Instalar aplicación" disponible.
- [ ] Banner inferior "Add the app to your home screen" visible en dashboard.
- [ ] Tras instalar: icono en launcher, splash screen con fondo `#0f0f0f` y logo.
- [ ] Sin sesión iniciada previamente: la app instalada redirige a `/login`.

### iOS / iPadOS (Safari)

- [ ] Compartir → "Agregar a pantalla de inicio".
- [ ] El banner de AdmiPy muestra la guía manual ("Tap the Share icon…") porque Safari no dispara `beforeinstallprompt`.
- [ ] Icono en pantalla de inicio usa el apple-touch-icon (no captura de pantalla).
- [ ] Al abrir: modo standalone (sin barras de Safari), status bar `black-translucent`.
- [ ] Probar también iPad (iPadOS detecta como Mac: verificado por `maxTouchPoints > 1`).

---

## 3. Notas y hallazgos

1. El registro del SW está condicionado a `NODE_ENV === production`: en `next dev` no habrá SW ni prompt nativo. Es esperado.
2. `InstallPrompt` guarda la preferencia de descarte en `localStorage` (`pwa-install-dismissed`): una vez descartada o instalada, no vuelve a mostrarse.
3. `next.config.ts` define `Cache-Control: must-revalidate` para `/sw.js`, garantizando detección de nuevas versiones del SW (base para Historia 14.9).
4. Hallazgo fuera de alcance: `maximumScale: 1` en el viewport impide zoom (accesibilidad WCAG 1.4.4). Registrarlo para Historia 14.11 / accesibilidad general.
 5. Las credenciales Supabase vacías en local impedían renderizar páginas dinámicas (obsoleto: el proyecto migró a Turso + NextAuth; el QA de assets PWA no depende de ellas y el matcher del proxy excluye `manifest.json`, `sw.js` e `icons/`).
