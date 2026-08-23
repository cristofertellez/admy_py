# Contributing

## Development Workflow

1. Read [PRD.md](./PRD.md) for requirements
2. Read [BACKLOG.md](./BACKLOG.md) for priorities
3. Read [DESIGN.md](./DESIGN.md) for design system
4. Read [AGENTS.md](./AGENTS.md) for coding conventions
5. Implement the feature
6. Verify build: `npm run build`
7. Verify lint: `npm run lint`

## Code Style

- **TypeScript strict mode** — No `any` without justification
- **Components** — PascalCase, small and focused
- **Functions** — camelCase, pure when possible
- **Database** — snake_case tables and columns
- **Routes** — kebab-case URLs

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructuring
- `docs:` — Documentation
- `style:` — Formatting
- `test:` — Tests
- `build:` — Build system

## Pull Requests

- One objective per PR
- Keep scope limited
- Respect existing architecture
- Update documentation when needed
