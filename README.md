# AdmiPy — Project Management Platform

Professional platform for project planning, tracking, collaboration and visualization.

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions, Route Handlers
- **Database:** Turso (libSQL)
- **Auth:** NextAuth (Auth.js) + Custom RBAC
- **Storage:** Cloudflare R2
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **State:** TanStack Query
- **PWA:** Installable, offline-ready

## Getting Started

### Prerequisites

- Node.js 20+
- Turso account ([turso.tech](https://turso.tech))
- Cloudflare account with R2 enabled ([developers.cloudflare.com/r2](https://developers.cloudflare.com/r2/))

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.local` and fill in your credentials:

```bash
# Turso
TURSO_DATABASE_URL=libsql://your-database-your-org.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# NextAuth (Auth.js)
AUTH_SECRET=your-auth-secret

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
```

### Database Setup

1. Create a new Turso database: `turso db create <database-name>`
2. Apply the migrations in `turso/migrations/`

```bash
npm run db:migrate
```

### Seed Demo Data

Populate an **empty** database with coherent demo data (users, clients,
projects, milestones, tasks, comments, tags and activity) so the dashboard
renders meaningful KPIs and charts.

```bash
npm run db:seed
```

- Demo users are created with the password `Demo1234!`.
- The script **aborts** if the database already contains data. To wipe demo
  records and reseed, use:

```bash
npm run db:seed -- --reset --yes
```

> Never run the seed against a production database.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Project Structure

```
app/              # Next.js App Router pages and API routes
  dashboard/      # Authenticated application (per-module pages)
  api/            # Route Handlers (files, exports, public API v1, health)
components/       # Reusable UI components
  ui/             # Base components (Button)
  layout/         # Layout components (Header, NotificationsBell)
  tables/         # DataTable components
  forms/          # Form fields
  shared/         # Shared components (Badge, Card, GlobalSearch...)
  charts/         # Chart widgets (BarChart, Timeline, ProgressRing)
  dashboard/      # Dashboard widget library (KpiCard, ListCard...)
  pwa/            # PWA components (InstallPrompt, OfflineBanner...)
features/         # Business logic by domain (service + types + index.ts)
  clients/ projects/ tasks/ milestones/ comments/ files/
  intermediaries/ users/ dashboard/ reports/ notifications/
  settings/ preferences/ tags/ time-entries/ templates/ checklists/
  reactions/ activity/ api-keys/ webhooks/ automations/
actions/          # Server Actions by domain (auth, projects, tasks...)
schemas/          # Zod validation schemas (shared by client and server)
hooks/            # React hooks (useDebounce, useConnectivity, offline queue)
services/         # Cross-cutting services (activity/audit log)
lib/              # Core utilities and infrastructure
  turso/         # Database client and query helpers
  auth/          # Password hashing
  auth-scope.ts  # Row-level authorization filters (Client/Intermediary scopes)
  api/            # Public API helpers (auth, rate limiting, metrics)
  events/        # Internal event bus (system_events)
  offline/        # PWA offline action queue
  sync/          # Online/offline sync manager
  storage/        # Cloudflare R2 client
  routes.ts      # Role-based route protection
  exports.ts      # CSV/XLSX export helpers
  monitoring.ts   # Health-check and API metrics
providers/        # React context providers
types/            # Shared TypeScript type definitions
constants/        # App constants (statuses, transitions, options)
docs/             # QA guides and technical roadmap
scripts/          # Migration and seed scripts
turso/            # Database migrations
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (app, lib, features, actions, components, hooks, services) |
| `npm run format` | Prettier (all files) |
| `npm run db:migrate` | Apply Turso migrations |
| `npm run db:seed` | Seed demo data (see above) |

## Documentation

- [PRD.md](./PRD.md) — Product Requirements
- [DESIGN.md](./DESIGN.md) — Design System
- [BACKLOG.md](./BACKLOG.md) — Development Roadmap
- [AGENTS.md](./AGENTS.md) — AI Development Rules
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contributing Guide
- [docs/ROADMAP.md](./docs/ROADMAP.md) — Technical roadmap (v2–v4)
- [docs/qa/](./docs/qa/) — QA testing guides

## License

Private — All rights reserved.
