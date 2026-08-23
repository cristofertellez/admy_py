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
│ lib/turso/ lib/auth/ utils/ etc.    │
├──────────────────────────────────────┤
│            Data (Turso)             │
│   libSQL NextAuth R2 RBAC           │
└──────────────────────────────────────┘
```

## Key Principles

- **Server Components by default** — Only use Client Components when interactivity is required
- **Domain-driven modules** — Each feature (clients, projects, tasks) is self-contained
- **Services over inline logic** — Business logic lives in service classes, never in components
- **Barrel exports** — Every module exposes a single `index.ts` entry point
- **Type safety** — TypeScript strict mode, Zod validation on both client and server
- **Security** — Server-side authorization middleware + custom RBAC

## Data Flow

```
User Action
    ↓
Client Component (useZodForm / useQuery)
    ↓
React Hook Form / TanStack Query
    ↓
Server Action / Service
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
Proxy middleware refreshes session
    ↓
RBAC middleware checks permissions
    ↓
Page rendered with user context
```

## Database

All tables use:
- UUID primary keys
- Soft deletes (`deleted_at`, `is_active`)
- Full audit timestamps (`created_at`, `updated_at`, `created_by`, `updated_by`)
- Access control enforced by custom RBAC at the data access layer

## File Storage

Files are stored in Cloudflare R2 with metadata references in Turso.
Buckets: `avatars/`, `projects/`, `attachments/`, `logos/`, `exports/`
