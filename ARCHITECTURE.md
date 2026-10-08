# Architecture

## Overview

AdmiPy follows a modular architecture based on Clean Architecture principles with separation of concerns.

## Layers

```
┌──────────────────────────────────────┐
│              UI (Components)          │
│  app/ components/ (Server & Client)  │
├──────────────────────────────────────┤
│           Application (Hooks)        │
│     hooks/ providers/ schemas/       │
├──────────────────────────────────────┤
│             Domain (Services)        │
│       features/ services/            │
├──────────────────────────────────────┤
│          Infrastructure (Lib)       │
│  lib/turso/ lib/auth/ lib/storage/  │
├──────────────────────────────────────┤
│            Data (Turso)             │
│   libSQL NextAuth R2 RBAC           │
└──────────────────────────────────────┘
```

## Key Principles

- **Server Components by default** — Only use Client Components when interactivity is required
- **Domain-driven modules** — Each feature (clients, projects, tasks) is self-contained
- **Services over inline logic** — Business logic lives in service classes, never in components
- **Feature barrels** — Each `features/<domain>` exposes a single `index.ts`; `app/`, `actions/` and `components/` are imported directly
- **Type safety** — TypeScript strict mode, Zod validation on both client and server
- **Security** — Server-side authorization middleware + custom RBAC with row-level scopes (`lib/auth-scope.ts`)

## Data Flow

```
User Action
    ↓
Client Component (React Hook Form + Zod resolver / useActionState)
    ↓
Server Action (validates with shared Zod schema, checks permissions)
    ↓
Feature Service (row-level scope filters from lib/auth-scope)
    ↓
Turso Client (@libsql/client)
    ↓
Turso (libSQL database)
```

## Authentication Flow

```
Login Form → Server Action → NextAuth (Auth.js)
    ↓
Session cookie set
    ↓
Proxy middleware (proxy.ts) refreshes session and guards admin routes
    ↓
RBAC middleware checks permissions (requirePermission in server actions)
    ↓
Page rendered with user context
```

## Authorization

Two complementary layers:

- **Route-level** — `proxy.ts` redirects unauthenticated users and restricts admin-only routes (`lib/routes.ts`).
- **Data-level** — `lib/auth-scope.ts` injects SQL scope filters (visible projects/clients) so Client and Intermediary roles only read/write their own data; full-access roles bypass the filters. Every service query goes through these scopes.

## Database

All tables use:
- UUID primary keys
- Soft deletes (`deleted_at`, `is_active`)
- Full audit timestamps (`created_at`, `updated_at`, `created_by`, `updated_by`)
- Access control enforced by custom RBAC at the data access layer

Migrations live in `turso/migrations/` and are applied with `npm run db:migrate`.

## Integration Subsystems (Épica 17)

- **Event bus** — `lib/events/bus.ts` persists domain events in `system_events` and fans them out via `after()`.
- **Public API v1** — Read-only REST endpoints under `/api/v1` with hashed API keys, per-key rate limiting and OpenAPI spec (`lib/api/public-api.ts`).
- **Webhooks** — Signed deliveries with retry queue and history (`webhook_deliveries`), managed from `/dashboard/integrations`.
- **Automations** — Rule engine (event → action → notifications) driven by the same event bus.

## PWA / Offline

- Service Worker caches visited pages and RSC payloads (Network First) for read-only offline mode.
- Mutations performed offline are queued locally (`lib/offline/`) and replayed automatically on reconnect; server-rejected actions are marked as conflicts for manual resolution.
- Install prompt, connectivity indicator and update flow are driven by PWA settings.

## Exports & Reports

- Report center (`/dashboard/reports`) builds standardized `ModuleReport` objects (KPIs + table + chart) reused by every module.
- Export helpers (`lib/exports.ts`, `lib/export-pdf.ts`) generate PDF/CSV/XLSX from any report; the global export endpoint packages a ZIP.

## File Storage

Files are stored in Cloudflare R2 with metadata references in Turso.
Buckets: `avatars/`, `projects/`, `attachments/`, `logos/`, `exports/`
