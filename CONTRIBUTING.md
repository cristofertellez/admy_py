# Contributing

## Development Workflow

1. Read [PRD.md](./PRD.md) for requirements
2. Read [BACKLOG.md](./BACKLOG.md) for priorities
3. Read [DESIGN.md](./DESIGN.md) for design system
4. Read [AGENTS.md](./AGENTS.md) for coding conventions
5. Identify existing reusable modules before writing new code
6. Implement the feature (server-side authorization, Zod validation, loading/empty/error states)
7. Verify TypeScript: `npx tsc --noEmit`
8. Verify lint: `npm run lint`
9. Verify build: `npm run build`
10. Update documentation (README / ARCHITECTURE / BACKLOG) when the change affects them

## Code Style

- **TypeScript strict mode** — No `any` without justification
- **Components** — PascalCase, small and focused, stateless when possible
- **Functions** — camelCase, pure when possible
- **Database** — snake_case tables and columns
- **Routes** — kebab-case URLs
- **Dead code** — Remove unused exports and files; do not leave commented-out code

## Commit Conventions

Commit messages should clearly explain what changed and why (see [AGENTS.md](./AGENTS.md)). Keep commits focused — one logical change per commit.

## Pull Requests

- One objective per PR
- Keep scope limited
- Respect existing architecture
- Reuse existing components and services
- Update documentation when needed
