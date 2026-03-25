# API Module Organization

> Hono-based API module layout for Cloudflare Workers.

---

## Overview

> **A universal backend API module structure with TypeScript + Zod + strict type safety**
>
> This pattern ensures consistency, maintainability, and type safety across your API codebase.

### Core Principles

1. **Domain-Driven Structure** - Organize by business domain (e.g., `users`, `products`, `orders`)
2. **Type Safety First** - Use Zod schemas for all inputs/outputs
3. **Single Source of Truth** - Types defined once in `types.ts`
4. **Code Reuse** - Extract common logic to `lib/`
5. **Clear Separation** - Each file has a specific responsibility

### Benefits

- **Type Safety** - Catch errors at compile time
- **Consistency** - Same structure across all modules
- **Maintainability** - Easy to locate and modify code
- **Scalability** - Add new features without chaos
- **Onboarding** - New developers understand structure quickly

## Directory Structure

```
src/routes/[domain]/
├── types.ts              # Zod schemas + TypeScript types (REQUIRED)
├── router.ts             # Route definitions (REQUIRED)
├── procedures/           # Endpoint handlers (REQUIRED)
│   ├── create.ts         # POST /create
│   ├── update.ts         # PUT /update
│   ├── list.ts           # GET /list
│   ├── get.ts            # GET /:id
│   └── delete.ts         # DELETE /:id
├── lib/                  # Shared business logic (OPTIONAL)
│   ├── [entity]-utils.ts # Entity-specific utilities
│   ├── validators.ts     # Custom validators
│   └── helpers.ts        # General helpers
└── api/                  # API documentation (OPTIONAL)
    ├── create.md
    ├── update.md
    └── list.md
```

**Example Domains:**

| Domain       | Description          | Example Endpoints                           |
| ------------ | -------------------- | ------------------------------------------- |
| `workspaces` | Workspace management | `create`, `list`, `get`, `update`, `delete` |
| `users`      | User management      | `create`, `list`, `get`, `update`, `delete` |
| `posts`      | Post CRUD            | `create`, `list`, `get`, `update`, `delete` |
| `auth`       | Authentication       | `login`, `logout`, `refresh`                |

## types.ts - Schema & Type Definitions

**Purpose**: Define ALL Zod schemas and TypeScript types for this module.

**Rules**:

1. Every API endpoint MUST have a Zod schema for input/output
2. Use `z.infer<>` to derive TypeScript types from schemas
3. Export both schemas and types
4. Import shared enums from a central location

**Template**:

```typescript
// src/routes/workspaces/types.ts
import { z } from "zod";

// ============= Input Schemas =============

export const createWorkspaceInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceInputSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const listWorkspacesInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ============= Output Schemas =============

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createWorkspaceOutputSchema = z.object({
  success: z.boolean(),
  workspace: workspaceSchema.optional(),
  reason: z.string().optional(),
});

export const listWorkspacesOutputSchema = z.object({
  success: z.boolean(),
  workspaces: z.array(workspaceSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

// ============= Type Exports =============

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
export type CreateWorkspaceOutput = z.infer<typeof createWorkspaceOutputSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceInputSchema>;
export type ListWorkspacesInput = z.infer<typeof listWorkspacesInputSchema>;
export type ListWorkspacesOutput = z.infer<typeof listWorkspacesOutputSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
```

**Response Format Standards**:

| Operation Type   | Required Fields                                                            | Optional Fields                                        |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Single operation | `success: boolean`                                                         | `reason?: string`, `error?: string`, entity data       |
| Batch operation  | `success: boolean`, `total: number`, `processed: number`, `failed: number` | `errors?: Array<{id, error}>`                          |
| List operation   | `success: boolean`, `items: Array<T>`, `total: number`                     | `limit?: number`, `offset?: number`, `cursor?: string` |

## API and Frontend Route Namespace Separation

**CRITICAL**: API routes (Hono) and frontend routes (React Router) share the same URL namespace. When Hono mounts a route at `/oauth/*`, it intercepts ALL requests to that path **before** React Router can handle them.

**Problem Example:**

```typescript
// src/index.ts
app.route("/oauth", oauthRouter);  // Hono handles /oauth/*

// app/routes.ts (React Router)
route("oauth/consent", "routes/oauth.consent.tsx"),  // Never reached!
```

When user navigates to `/oauth/consent`:

1. Request hits Cloudflare Workers
2. Hono sees `/oauth/*` -> routes to oauthRouter
3. oauthRouter has no `/consent` handler -> 404
4. React Router NEVER sees the request

**Solution: Use Different Namespaces**

| Route Type                     | Namespace                          | Example                              |
| ------------------------------ | ---------------------------------- | ------------------------------------ |
| API routes (Hono)              | `/api/*`, `/oauth/*`               | `/api/workspaces`, `/oauth/token`    |
| Frontend routes (React Router) | `/auth/*`, `/app/*`, `/settings/*` | `/auth/login`, `/auth/oauth-consent` |

**Correct Implementation:**

```typescript
// Hono API routes stay at /oauth
app.route("/oauth", oauthRouter);  // /oauth/authorize, /oauth/token

// Frontend consent page uses /auth namespace
route("auth/oauth-consent", "routes/auth.oauth-consent.tsx"),  // Works!
```

**URL structure after fix:**

```
/oauth/authorize  ->  Hono API (redirects to consent page)
/auth/oauth-consent  ->  React Router (renders consent UI)
/oauth/token  ->  Hono API (token exchange)
```

**Rule of Thumb:**

- If it returns JSON -> use `/api/*` or `/oauth/*` namespace (Hono)
- If it renders HTML/UI -> use different namespace like `/auth/*` (React Router)

## router.ts - Endpoint Routing

**Purpose**: Define route structure and map endpoints to procedures.

**Rules**:

1. Keep routing logic minimal
2. Import procedures from `procedures/` directory
3. Apply middleware at route level if needed

**Pattern: Hono Router**:

```typescript
// src/routes/workspaces/router.ts
import { Hono } from "hono";
import type { AppEnv } from "../../types";
import { createWorkspace } from "./procedures/create";
import { updateWorkspace } from "./procedures/update";
import { listWorkspaces } from "./procedures/list";
import { getWorkspace } from "./procedures/get";
import { deleteWorkspace } from "./procedures/delete";
import { requireSession } from "../../middleware/auth";

const app = new Hono<AppEnv>();

// Apply auth middleware to all routes
app.use("*", requireSession());

// Mount procedures
app.post("/create", createWorkspace);
app.put("/update", updateWorkspace);
app.get("/list", listWorkspaces);
app.get("/:id", getWorkspace);
app.delete("/:id", deleteWorkspace);

export default app;
```

## procedures/ - Endpoint Handlers

**Purpose**: Implement the actual endpoint logic.

**Rules**:

1. One file per endpoint
2. Import schemas from `types.ts`
3. Validate inputs using Zod
4. Return typed outputs
5. Handle errors gracefully

**Template**:

```typescript
// src/routes/workspaces/procedures/create.ts
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../../types";
import type { CreateWorkspaceOutput } from "../types";
import { createWorkspaceInputSchema } from "../types";
import { workspaces, workspaceMembers } from "../../../db/schema";
import { createDb } from "../../../db";
import { HTTPException } from "hono/http-exception";

export const createWorkspace: MiddlewareHandler<AppEnv> = async (c) => {
  const logger = c.get("logger");
  const user = c.get("user");

  try {
    // 1. Validate input
    const body = await c.req.json();
    const validatedInput = createWorkspaceInputSchema.parse(body);

    // 2. Business logic
    const db = createDb(c.env);

    // 3. Database operation
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: validatedInput.name,
        description: validatedInput.description,
        ownerId: user!.id,
      })
      .returning();

    // 4. Create owner membership
    await db.insert(workspaceMembers).values({
      workspaceId: newWorkspace.id,
      userId: user!.id,
      role: "owner",
    });

    // 5. Log success
    logger.info("workspace_created", {
      workspaceId: newWorkspace.id,
      userId: user!.id,
    });

    // 6. Return success response
    const output: CreateWorkspaceOutput = {
      success: true,
      workspace: newWorkspace,
    };

    return c.json(output);
  } catch (error) {
    logger.error("failed_to_create_workspace", { error });

    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, reason: "Invalid input", error: error.message },
        400,
      );
    }

    throw new HTTPException(500, {
      message: "Failed to create workspace",
    });
  }
};
```

**Common Procedure Patterns**:

| Pattern       | File Name     | HTTP Method | Purpose                                  |
| ------------- | ------------- | ----------- | ---------------------------------------- |
| Create        | `create.ts`   | POST        | Create new entity                        |
| Get           | `get.ts`      | GET         | Retrieve single entity by ID             |
| List          | `list.ts`     | GET         | Retrieve multiple entities with filters  |
| Update        | `update.ts`   | PUT/PATCH   | Update existing entity                   |
| Delete        | `delete.ts`   | DELETE      | Delete entity                            |
| Custom Action | `[action].ts` | POST        | Custom operation (e.g., `send-email.ts`) |

## lib/ - Shared Business Logic

**Purpose**: Extract reusable logic used by multiple procedures.

**When to Use**:

- Logic used in 2+ procedures
- Complex business rules
- Validation helpers
- Data transformation utilities
- Single-use code should stay in procedure

**Standard Naming Conventions**:

| Pattern       | Naming                         | Purpose                         | Example                                     |
| ------------- | ------------------------------ | ------------------------------- | ------------------------------------------- |
| Auth check    | `getXxxWithAuth(id, userId)`   | Fetch entity + verify ownership | `getWorkspaceWithAuth(workspaceId, userId)` |
| Get or throw  | `getXxxOrThrow(id)`            | Fetch entity or throw error     | `getWorkspaceOrThrow(workspaceId)`          |
| Composite     | `getXxxAndYyy(id)`             | Fetch multiple related entities | `getWorkspaceAndMembers(workspaceId)`       |
| WHERE builder | `getXxxWhereCondition(params)` | Build query conditions          | `getWorkspacesWhereCondition(filters)`      |
| Grouping      | `groupXxxByYyy(items)`         | Group array by key              | `groupMembersByWorkspace(members)`          |

**Example**:

```typescript
// src/routes/workspaces/lib/workspace-utils.ts
import { eq, and } from "drizzle-orm";
import { workspaces, workspaceMembers } from "../../../db/schema";
import type { Workspace } from "../types";
import { HTTPException } from "hono/http-exception";

/**
 * Get workspace and verify requesting user has access
 * @throws HTTPException(404) if workspace not found
 * @throws HTTPException(403) if user unauthorized
 */
export async function getWorkspaceWithAuth(
  db: any,
  workspaceId: string,
  userId: string,
): Promise<Workspace> {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  // Check membership
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
    ),
  });

  if (!membership) {
    throw new HTTPException(403, { message: "Access denied" });
  }

  return workspace;
}

/**
 * Get workspace or throw error
 * @throws HTTPException(404) if workspace not found
 */
export async function getWorkspaceOrThrow(
  db: any,
  workspaceId: string,
): Promise<Workspace> {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new HTTPException(404, {
      message: `Workspace not found: ${workspaceId}`,
    });
  }

  return workspace;
}
```

**lib/ File Organization**:

```
lib/
├── workspace-utils.ts    # Workspace-specific utilities
├── validators.ts         # Custom Zod validators
├── helpers.ts            # General helpers
└── constants.ts          # Module constants
```

## Quick Start Checklist

When creating a new module:

- [ ] Create directory: `src/routes/[domain]/`
- [ ] Create `types.ts` with all Zod schemas
- [ ] Create `router.ts` to define routes
- [ ] Create `procedures/` directory
- [ ] Implement each endpoint in `procedures/[action].ts`
- [ ] Extract shared logic to `lib/` if needed
- [ ] Document endpoints in `api/` if needed
- [ ] Mount router in `src/index.ts`

## Reference

For best practices, common patterns, and anti-patterns, see [api-patterns.md](./api-patterns.md).
