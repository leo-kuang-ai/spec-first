# Next.js Full-Stack Development Guidelines

Universal development guidelines for production Next.js applications with oRPC API layer and PostgreSQL.

## Structure

### [Frontend](./frontend/index.md)

React 19 + Next.js 15 App Router frontend development patterns:

- [Directory Structure](./frontend/directory-structure.md)
- [Components](./frontend/components.md)
- [State Management](./frontend/state-management.md)
- [Hooks](./frontend/hooks.md)
- [API Integration](./frontend/api-integration.md)
- [oRPC Usage](./frontend/orpc-usage.md)
- [Authentication](./frontend/authentication.md)
- [AI SDK Integration](./frontend/ai-sdk-integration.md)
- [CSS & Layout](./frontend/css-layout.md)
- [Type Safety](./frontend/type-safety.md)
- [Quality Checklist](./frontend/quality.md)

### [Backend](./backend/index.md)

oRPC + Drizzle ORM backend development patterns:

- [Directory Structure](./backend/directory-structure.md)
- [oRPC Usage](./backend/orpc-usage.md)
- [Authentication](./backend/authentication.md)
- [Database](./backend/database.md)
- [AI SDK Integration](./backend/ai-sdk-integration.md)
- [Logging](./backend/logging.md)
- [Performance](./backend/performance.md)
- [Type Safety](./backend/type-safety.md)
- [Quality Checklist](./backend/quality.md)

### [Shared](./shared/index.md)

Cross-cutting concerns:

- [Dependencies](./shared/dependencies.md)
- [Code Quality](./shared/code-quality.md)
- [TypeScript Conventions](./shared/typescript.md)

### [Guides](./guides/index.md)

Development thinking guides:

- [Pre-Implementation Checklist](./guides/pre-implementation-checklist.md)
- [Cross-Layer Thinking Guide](./guides/cross-layer-thinking-guide.md)

### [Common Issues / Pitfalls](./big-question/index.md)

Common issues and solutions:

- [PostgreSQL JSON vs JSONB](./big-question/postgres-json-jsonb.md)
- [WebKit Tap Highlight](./big-question/webkit-tap-highlight.md)
- [Sentry & next-intl Conflict](./big-question/sentry-nextintl-conflict.md)
- [Turbopack vs Webpack Flexbox](./big-question/turbopack-webpack-flexbox.md)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS 4, Radix UI, React Query
- **Backend**: oRPC, Drizzle ORM, PostgreSQL, better-auth
- **AI**: Vercel AI SDK (multi-provider)
- **Real-time**: Ably / WebSocket / SSE
- **Build**: Turborepo + pnpm (monorepo)
- **Monitoring**: Sentry + OpenTelemetry

## Usage

These guidelines can be used as:

1. **New Project Template** - Copy the entire structure for new Next.js projects
2. **Reference Documentation** - Consult specific guides when implementing features
3. **Code Review Checklist** - Verify implementations against established patterns
4. **Onboarding Material** - Help new developers understand project conventions
