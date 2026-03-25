# Cloudflare Workers Full-Stack Development Guidelines

Production development guidelines for full-stack Cloudflare Workers applications with Hono framework, Drizzle ORM, and Turso database.

## Structure

### [Backend](./backend/index.md)

Cloudflare Workers + Hono + Drizzle ORM backend development patterns:

- [API Module](./backend/api-module.md)
- [API Patterns](./backend/api-patterns.md)
- [Database](./backend/database.md)
- [Environment](./backend/environment.md)
- [Error & Logging](./backend/error-logging.md)
- [Hono Framework](./backend/hono-framework.md)
- [Quality Checklist](./backend/quality.md)
- [Security](./backend/security.md)
- [Storage](./backend/storage.md)
- [Type Safety](./backend/type-safety.md)

### [Frontend](./frontend/index.md)

React Router v7 + Vite + TailwindCSS frontend development patterns:

- [Authentication](./frontend/authentication.md)
- [Components](./frontend/components.md)
- [Directory Structure](./frontend/directory-structure.md)
- [Hooks](./frontend/hooks.md)
- [Quality Checklist](./frontend/quality.md)
- [Type Safety](./frontend/type-safety.md)
- [Examples: Frontend Design](./frontend/examples/frontend-design/)

### [Shared](./shared/index.md)

Cross-cutting concerns:

- [Code Quality](./shared/code-quality.md)
- [Dependency Versions](./shared/dependency-versions.md)
- [TypeScript Conventions](./shared/typescript.md)
- [Timestamp](./shared/timestamp.md)

### [Guides](./guides/index.md)

Development thinking guides and design patterns:

- [OAuth Consent Flow](./guides/oauth-consent-flow.md)
- [Serverless Connection Guide](./guides/serverless-connection-guide.md)

### [Common Issues / Pitfalls](./big-question/index.md)

Common issues and solutions for Cloudflare Workers applications:

- [Workers Node.js Compatibility](./big-question/workers-nodejs-compat.md)
- [Cross-Layer Contract](./big-question/cross-layer-contract.md)
- [CSS Debugging Thinking Guide](./big-question/css-debugging-thinking-guide.md)
- [Environment Configuration](./big-question/env-configuration.md)
- [System Constraints](./big-question/system-constraints.md)

## Tech Stack

- **Runtime**: Cloudflare Workers (Wrangler v4+)
- **Backend**: Hono, Drizzle ORM, Turso (libSQL/SQLite)
- **Frontend**: React Router v7, Vite, TailwindCSS, shadcn/ui
- **Auth**: Better Auth
- **Storage**: Cloudflare KV, R2
- **Build**: Vite + @cloudflare/vite-plugin
- **Language**: TypeScript throughout

## Usage

These guidelines can be used as:

1. **New Project Template** - Copy the entire structure for new Cloudflare Workers projects
2. **Reference Documentation** - Consult specific guides when implementing features
3. **Code Review Checklist** - Verify implementations against established patterns
4. **Onboarding Material** - Help new developers understand project conventions
