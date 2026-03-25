# Dependencies & Versions

> Adjust versions to your project. These represent a known-working combination as of the time of writing. Pin or widen ranges to match your stability requirements.

---

## Runtime Environment

| Dependency | Version | Description |
|------------|---------|-------------|
| Node.js | >=20 | JavaScript runtime |
| pnpm | ^10.x | Package manager |

---

## Core Framework

| Package | Version | Description |
|---------|---------|-------------|
| next | ^15.x | React framework for production |
| react | ^19.x | UI library |
| react-dom | ^19.x | React DOM renderer |
| typescript | ^5.x | TypeScript language |

---

## Backend

### API Layer

| Package | Version | Description |
|---------|---------|-------------|
| hono | ^4.x | Lightweight web framework |
| @orpc/server | ^1.x | oRPC server implementation |
| @orpc/client | ^1.x | oRPC client |
| @orpc/zod | ^1.x | oRPC Zod integration |
| @orpc/openapi | ^1.x | OpenAPI schema generation |
| zod | ^4.x | Schema validation |

### Database

| Package | Version | Description |
|---------|---------|-------------|
| drizzle-orm | ^0.44.x | TypeScript ORM |
| drizzle-kit | ^0.31.x | Drizzle CLI tools |
| drizzle-zod | ^0.8.x | Drizzle + Zod integration |
| pg | ^8.x | PostgreSQL client |

### Authentication

| Package | Version | Description |
|---------|---------|-------------|
| better-auth | ^1.x | Authentication library |

### Caching & Queue

| Package | Version | Description |
|---------|---------|-------------|
| @upstash/redis | ^1.x | Redis client (Upstash) |
| @upstash/qstash | ^2.x | Message queue |

---

## AI Integration

| Package | Version | Description |
|---------|---------|-------------|
| ai | ^5.x | Vercel AI SDK core |
| @ai-sdk/react | ^2.x | AI SDK React hooks |
| @ai-sdk/openai | ^2.x | OpenAI provider |
| @ai-sdk/anthropic | ^2.x | Anthropic provider |

---

## Frontend

### UI Components

| Package | Version | Description |
|---------|---------|-------------|
| @radix-ui/* | latest | Headless UI primitives |
| lucide-react | ^0.x | Icon library |
| cmdk | ^1.x | Command palette |
| sonner | ^2.x | Toast notifications |

### Styling

| Package | Version | Description |
|---------|---------|-------------|
| tailwindcss | ^4.x | Utility-first CSS (v4 config format) |
| @tailwindcss/postcss | ^4.x | PostCSS plugin |
| tailwind-merge | ^3.x | Tailwind class merging |
| class-variance-authority | ^0.7.x | Variant management |
| clsx | ^2.x | Class name utility |

### State Management

| Package | Version | Description |
|---------|---------|-------------|
| @tanstack/react-query | ^5.x | Data fetching & caching |
| @orpc/tanstack-query | ^1.x | oRPC + React Query bridge |
| nuqs | ^2.x | URL state management |
| react-hook-form | ^7.x | Form state management |
| @hookform/resolvers | ^5.x | Form validation resolvers |

### Internationalization

| Package | Version | Description |
|---------|---------|-------------|
| next-intl | ^4.x | Next.js i18n |

### Utilities

| Package | Version | Description |
|---------|---------|-------------|
| date-fns | ^4.x | Date utilities |
| es-toolkit | ^1.x | Utility functions |
| nanoid | ^5.x | ID generation |
| p-limit | ^7.x | Concurrency control |

---

## Monitoring & Logging

| Package | Version | Description |
|---------|---------|-------------|
| @sentry/nextjs | ^10.x | Error tracking |

---

## Development Tools

### Build & Bundling

| Package | Version | Description |
|---------|---------|-------------|
| turbo | ^2.x | Monorepo build system |
| tsx | ^4.x | TypeScript executor |

### Code Quality

| Package | Version | Description |
|---------|---------|-------------|
| @biomejs/biome | ^2.x | Linter & formatter |
| husky | ^9.x | Git hooks |

### Testing

| Package | Version | Description |
|---------|---------|-------------|
| @playwright/test | ^1.x | E2E testing |

---

## Important Notes

1. **React 19**: Major version with breaking changes from React 18
2. **Next.js 15**: App Router is the primary routing pattern
3. **TailwindCSS 4**: Uses the new v4 configuration format (not `tailwind.config.js`)
4. **Zod 4**: Latest version with improved TypeScript support
5. **Monorepo**: Use `@your-app/*` for internal workspace package references

---

## Updating Dependencies

When updating dependencies:

1. Check compatibility with React 19 and Next.js 15
2. Update pnpm overrides if changing React or Drizzle versions
3. Run `pnpm install` from the root directory
4. Run `pnpm type-check` to verify TypeScript compatibility
5. Run `pnpm build` to ensure production build works
