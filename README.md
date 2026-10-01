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
app/              # Next.js App Router pages
components/       # Reusable UI components
  ui/             # Base components (Button, Input)
  layout/         # Layout components (Header, Sidebar)
  tables/         # DataTable components
  forms/          # Form fields
  shared/         # Shared components (Badge, Card)
features/         # Business logic by domain
  clients/        # Client management
  projects/       # Project management
  tasks/          # Task management
  comments/       # Comments system
  dashboard/      # Dashboard stats
  reports/        # Reports service
hooks/            # React hooks
providers/        # React context providers
schemas/          # Zod validation schemas
services/         # Base service classes
actions/          # Server Actions barrel
lib/              # Utilities, Turso client and auth config
types/            # TypeScript type definitions
constants/        # App constants
utils/            # Helper functions
turso/            # Database migrations
```

## Documentation

- [PRD.md](./PRD.md) — Product Requirements
- [DESIGN.md](./DESIGN.md) — Design System
- [BACKLOG.md](./BACKLOG.md) — Development Roadmap
- [AGENTS.md](./AGENTS.md) — AI Development Rules
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contributing Guide

## License

Private — All rights reserved.
