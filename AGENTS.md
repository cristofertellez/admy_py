<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

# Relevant files

- ./DESIGN.md -> Complete design system and UI guidelines.
- ./PRD.md -> Product Requirements Document.
- ./BACKLOG.md -> Complete development roadmap.

---

# Project Overview

This project is a professional Project Management Platform focused on project planning, tracking, collaboration and visualization.

The system is intended for software development teams that work with external clients and intermediaries.

The platform allows:

- Client management
- Intermediary management
- Project management
- Milestone management
- Task management
- Comments
- File management
- Dashboards
- Reports
- Notifications
- Complete audit logs
- Progressive Web App (PWA)

The application must be production-ready, scalable, secure, maintainable and highly reusable.

The priority is usability.

Every feature must be designed so that non-technical users can use the platform without prior training.

---

# Tech Stack

Use ONLY the following technologies.

## Frontend

- Next.js 16
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Next.js Server Actions
- Route Handlers
- Turso SDK (@libsql/client)

## Database

- Turso (libSQL)

## Authentication

- NextAuth (Auth.js)

## Authorization

- Custom RBAC
- Server-side authorization middleware

## Storage

- Cloudflare R2

## Forms

- React Hook Form
- Zod

## Tables

- TanStack Table

## State Management

- TanStack Query (only where appropriate)

## Deployment

Compatible with

- Vercel
- Turso
- Serverless infrastructure

Do not introduce major external dependencies without strong justification.

---

# Core Domain

The platform revolves around the following entities.

- User
- Role
- Permission

- Client

- Intermediary

- Project

- Milestone

- Task

- Subtask

- Comment

- File

- Dashboard

- Report

- Notification

- Audit Log

- Activity Log

Every entity must follow the business rules defined inside PRD.md.

Never invent new entities without justification.

# Architecture Rules

The architecture must always prioritize:

- Scalability
- Maintainability
- Readability
- Reusability
- Security
- Simplicity

Avoid premature optimization.

Always prefer clear code over clever code.

Every new module must be independent whenever possible.

Never couple unrelated business domains.

---

# General Development Rules

Always:

- Follow the PRD.
- Follow the BACKLOG.
- Follow the DESIGN system.
- Respect the existing architecture.
- Reuse existing components before creating new ones.
- Prefer composition over inheritance.
- Keep components small and focused.
- Separate business logic from UI.
- Prefer pure functions.
- Write self-documented code.

Never:

- Duplicate code.
- Create business logic inside components.
- Hardcode values.
- Ignore validation.
- Skip authorization.
- Skip error handling.
- Skip loading states.
- Skip empty states.
- Skip responsive behavior.

---

# Folder Organization

Respect the project structure.

Do not create arbitrary folders.

New modules must follow the established architecture.

Group files by feature rather than by file type whenever possible.

Example:

app/
modules/
components/
lib/
hooks/
types/
actions/
repositories/
services/
validators/

---

# Components

Components must follow these principles.

- Small
- Reusable
- Accessible
- Stateless whenever possible

Avoid giant components.

Split components when responsibilities begin to diverge.

Prefer composition.

Never duplicate UI.

---

# Server Components

Use Server Components by default.

Convert to Client Components only if required by:

- useState
- useEffect
- Browser APIs
- Event handlers
- Client-only libraries

Never add "use client" without necessity.

---

# Client Components

Client Components should be as small as possible.

Move expensive operations to the server whenever possible.

Avoid unnecessary client-side rendering.

---

# Data Fetching

Prefer:

Server Components

↓

Server Actions

↓

TanStack Query (only when necessary)

Do not fetch data inside random components.

Keep fetching centralized.

Cache where appropriate.

Minimize unnecessary requests.

---

# Business Logic

Business logic belongs in:

- Services
- Server Actions
- Domain modules

Never inside:

- UI Components
- Presentational Components

UI should only display information.

---

# Forms

Every form must use

- React Hook Form
- Zod

Validation must exist on:

- Client
- Server

Never trust client validation alone.

Always sanitize user input.

---

# Tables

All administrative tables must use:

TanStack Table

Requirements:

- Pagination
- Sorting
- Filtering
- Global Search
- Column Visibility
- Responsive Layout

Avoid custom table implementations unless justified.

---

# State Management

Prefer:

Server State

↓

URL State

↓

Local Component State

↓

TanStack Query

Avoid unnecessary global state.

Global state should be exceptional.

---

# Error Handling

Every async operation must include:

- Loading state
- Error state
- Empty state
- Retry mechanism where appropriate

Never expose raw errors to users.

Log unexpected errors for diagnostics.

# Database Rules

Turso (libSQL) is the single source of truth.

Every database modification must:

- Respect the existing schema.
- Be backward compatible whenever possible.
- Use migrations.
- Preserve data integrity.
- Follow normalization principles.

Never modify production data manually.

Never remove columns without proper migration strategy.

Avoid nullable fields unless they truly represent optional business data.

Always define foreign keys when relationships exist.

Always index frequently queried columns.

---

# Authentication

Authentication must always use:

NextAuth (Auth.js)

Never create a custom authentication system.

Never store passwords manually.

Never expose authentication tokens.

Respect session expiration.

Respect refresh tokens.

---

# Authorization

Authorization is mandatory.

Use:

- Custom RBAC
- Server-side authorization at the data access layer

Every endpoint.

Every query.

Every mutation.

Must validate permissions.

Never trust frontend permissions.

Authorization must always happen on the server.

---

# Security

Always protect against:

- SQL Injection
- XSS
- CSRF (where applicable)
- Privilege escalation
- Unauthorized access

Never expose:

- Service Role Keys
- Environment variables
- Internal identifiers
- Sensitive logs

Always validate every input.

Always sanitize user-generated content before rendering.

---

# API Rules

Server Actions are preferred.

Use Route Handlers only when necessary.

Every endpoint must:

- Validate input
- Validate authentication
- Validate authorization
- Return typed responses
- Handle expected errors
- Handle unexpected errors

Never expose stack traces.

---

# File Storage

Use only:

Cloudflare R2

Every uploaded file must include metadata.

Validate:

- MIME type
- File size
- Permissions
- Ownership

Never expose storage paths directly.

Prefer signed URLs when files require restricted access.

---

# Validation

Every external input must use Zod.

Validation must occur before any business logic executes.

Never trust:

- Forms
- Query parameters
- Route parameters
- Request bodies
- Uploaded files

Validation rules must remain synchronized with the business rules defined in PRD.md.

---

# Logging

Unexpected errors should be logged.

Expected business errors should return friendly messages.

Never log:

- Passwords
- Tokens
- Sensitive personal information

Audit logs and application logs serve different purposes.

Do not mix them.

---

# Performance

Always prioritize:

- Server Components
- Streaming where appropriate
- Lazy Loading
- Code Splitting
- Image Optimization
- Query Optimization

Avoid unnecessary re-renders.

Avoid N+1 queries.

Avoid duplicate database requests.

Measure before optimizing.

---

# Accessibility

Every interface must follow accessibility best practices.

Always include:

- Keyboard navigation
- Visible focus states
- ARIA attributes where needed
- Sufficient color contrast
- Semantic HTML

Never sacrifice accessibility for aesthetics.

---

# Responsive Design

The platform must work correctly on:

- Mobile
- Tablet
- Desktop

Responsive behavior is mandatory.

Do not create desktop-only features.

Remember that the platform is a Progressive Web App.

# Code Quality

Every contribution must leave the codebase better than it was found.

Always:

- Remove dead code.
- Remove unused imports.
- Remove duplicated logic.
- Keep naming consistent.
- Improve readability when possible.

Never introduce technical debt intentionally.

Prefer maintainability over short-term speed.

---

# Naming Conventions

Use descriptive names.

Variables

- camelCase

Functions

- camelCase

Components

- PascalCase

Types

- PascalCase

Interfaces

- PascalCase

Enums

- PascalCase

Database tables

- snake_case

Database columns

- snake_case

Avoid abbreviations unless they are universally understood.

Bad

projectMgr

Good

projectManager

---

# Comments

Write comments only when they provide business context.

Do NOT explain obvious code.

Bad

// increment counter

Good

// A project cannot be archived while it has active milestones.

Prefer expressive code over comments.

---

# Documentation

Whenever introducing:

- New module
- New architecture
- New business rule
- New infrastructure

Update documentation if necessary.

Documentation is part of the feature.

Never leave documentation outdated.

---

# Testing Philosophy

Features should be designed to be testable.

Business logic must remain isolated.

Avoid tightly coupling logic with UI.

Prefer deterministic behavior.

When creating reusable modules, consider future automated testing.

---

# Git Guidelines

Keep commits focused.

One logical change per commit.

Commit messages should clearly explain:

- What changed
- Why it changed

Avoid mixing unrelated modifications.

---

# Pull Requests

Every Pull Request should:

- Solve one objective.
- Keep scope limited.
- Respect existing architecture.
- Avoid unrelated refactors.
- Include documentation updates when necessary.

---

# Refactoring

Before creating new code:

Search whether similar functionality already exists.

If reusable code exists:

Reuse it.

If reusable code almost exists:

Extend it.

Avoid creating parallel implementations.

---

# Performance Guidelines

Do not optimize blindly.

Profile first.

Optimize only real bottlenecks.

Prefer reducing:

- Network requests
- Bundle size
- Client JavaScript
- Database queries

---

# Design Rules

Every interface must follow DESIGN.md.

Never invent:

- Colors
- Typography
- Shadows
- Border radius
- Component spacing

Always reuse:

- Existing UI components
- Existing layouts
- Existing design tokens

Consistency is more important than creativity.

---

# User Experience

Every screen should answer:

What can the user do?

What is happening?

What should they do next?

Avoid confusing workflows.

Always provide feedback for:

- Success
- Error
- Loading
- Empty state

Critical actions should request confirmation when appropriate.

---

# Development Workflow

Before implementing a feature:

1. Read PRD.md.
2. Read BACKLOG.md.
3. Read DESIGN.md.
4. Identify existing reusable modules.
5. Verify permissions (RBAC).
6. Verify server-side authorization requirements.
7. Implement the feature.
8. Validate responsive behavior.
9. Validate accessibility.
10. Update documentation if necessary.

Never skip these steps.

---

# AI Agent Behavior

When working on this repository, always:

- Follow the Product Requirements Document (PRD.md).
- Follow the development roadmap (BACKLOG.md).
- Follow the design system (DESIGN.md).
- Preserve architectural consistency.
- Reuse existing components.
- Respect project conventions.
- Keep changes minimal and focused.
- Explain architectural decisions when introducing significant changes.

Never:

- Invent business rules.
- Ignore acceptance criteria.
- Replace existing patterns without justification.
- Introduce breaking changes unless explicitly requested.
- Add dependencies without clear value.
- Modify unrelated modules.

If requirements are ambiguous:

- Ask for clarification before implementing.

If a requested implementation conflicts with the PRD or BACKLOG:

- Inform the user of the conflict.
- Suggest an alternative aligned with the project documentation.

---

# Definition of Done

A task is considered complete only if:

- Business requirements are satisfied.
- Acceptance criteria are met.
- RBAC rules are respected.
- Server-side authorization is considered where applicable.
- Validation is implemented.
- Error handling is complete.
- Loading and empty states are implemented.
- Responsive behavior is verified.
- Accessibility has been considered.
- Documentation is updated when necessary.
- No unnecessary code was introduced.

---

# Final Principle

The objective of every contribution is not only to make the feature work.

The objective is to make the platform easier to maintain, easier to extend, safer, more consistent and closer to the long-term vision defined by the PRD, BACKLOG and DESIGN documents.

Every change should improve the project, not only solve the immediate problem.

---

# AI Development Principles

The purpose of the AI assistant is not only to generate code.

Its primary responsibility is to preserve the long-term quality of the project.

Every implementation should improve the platform without compromising its architecture, maintainability or consistency.

When implementing any feature:

1. Understand the business objective.
2. Read the corresponding section in PRD.md.
3. Verify the feature exists in BACKLOG.md.
4. Follow the UI rules from DESIGN.md.
5. Respect this AGENTS.md.

Never implement functionality based on assumptions.

---

# Incremental Development

Always work incrementally.

Large features should be divided into smaller deliverables.

Prefer several focused implementations instead of one massive implementation.

Each implementation should leave the project in a working state.

Avoid partially completed implementations that break existing functionality.

---

# Backward Compatibility

Whenever possible:

- Preserve existing interfaces.
- Preserve public APIs.
- Preserve reusable components.
- Preserve data compatibility.

Breaking changes should only be introduced when explicitly requested.

---

# Database Evolution

Database changes must always be performed through migrations.

Never modify database structure manually.

When introducing new tables:

- Define relationships.
- Define indexes.
- Define access rules at the data access layer.
- Define constraints.
- Define timestamps.
- Define soft delete strategy when applicable.

---

# Dependency Management

Before adding a dependency:

Ask:

1. Can the current stack solve this?

2. Can existing project utilities solve this?

3. Is the dependency actively maintained?

4. Is the dependency necessary?

Avoid dependency bloat.

---

# UI Consistency

Every new page should look like it already existed.

Avoid creating isolated design patterns.

Navigation should remain consistent across the platform.

Every page should include:

- Loading state
- Empty state
- Error state
- Success feedback

---

# Reusability First

Before creating:

- Component
- Hook
- Utility
- Validator
- Repository
- Service

Search the project first.

Reuse existing implementations whenever possible.

Avoid creating similar solutions.

---

# Feature Completion

A feature is not finished when it works.

A feature is finished when it is:

- Tested
- Responsive
- Accessible
- Authorized
- Validated
- Documented
- Consistent

---

# Code Review Checklist

Before considering any implementation complete, verify:

- Business rules respected.
- No duplicated logic.
- No dead code.
- Naming conventions respected.
- Type safety maintained.
- No TypeScript errors.
- No ESLint errors.
- Responsive design verified.
- Accessibility reviewed.
- Permissions verified.
- Server-side authorization considered.
- Documentation updated.

---

# Long-Term Vision

This project is expected to evolve over multiple versions.

Every implementation should be designed with future growth in mind.

Future planned capabilities include:

- Multi-tenant architecture.
- Public API.
- Webhooks.
- AI-powered features.
- Advanced analytics.
- Workflow automation.
- Native mobile applications.
- Plugin ecosystem.

Current implementations should not make these future capabilities difficult to introduce.

---

# Non-Negotiable Rules

The following rules must never be violated:

- Do not bypass authentication.
- Do not bypass authorization.
- Do not bypass validation.
- Do not bypass server-side authorization.
- Do not hardcode business rules.
- Do not duplicate business logic.
- Do not expose sensitive information.
- Do not ignore accessibility.
- Do not ignore responsive behavior.
- Do not introduce unnecessary complexity.

When in doubt:

Choose the simplest solution that satisfies the business requirements while preserving the architecture.

---

# Project Philosophy

This platform is designed to become a long-term, scalable and maintainable SaaS application.

Every decision should prioritize:

- Maintainability over shortcuts.
- Consistency over creativity.
- Simplicity over unnecessary abstraction.
- Reusability over duplication.
- Security over convenience.
- User experience over implementation speed.

The quality of the architecture is as important as the quality of the code.

Every contribution should move the project closer to its long-term vision.