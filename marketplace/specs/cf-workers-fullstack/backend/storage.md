# Storage & Caching

> Session caching with Cloudflare Cache API and R2 storage patterns.

---

## Session Caching (Cloudflare Cache API)

### Overview

Use Cloudflare Workers Cache API to cache session data, reducing database queries for Bearer Token authentication.

### Why Cache Sessions?

| Scenario                        | Without Cache           | With Cache            |
| ------------------------------- | ----------------------- | --------------------- |
| Client making 100 API calls/min | 100 DB queries/min      | ~2 DB queries/min     |
| Session validation latency      | 20-50ms (DB round-trip) | <1ms (edge cache hit) |
| Database load                   | High                    | Low                   |

### Implementation Architecture

```
Request (Bearer Token)
    |
hashToken(token)  ->  tokenHash
    |
+---------------------+
| Cache API lookup    |  <- caches.default.match(cacheKey)
+----------+----------+
           |
      [Cache Hit] -> Validate expiry -> Return SessionData
           |
      [Cache Miss]
           |
+---------------------+
| Database query      |
+----------+----------+
           |
      [Found] -> Write to cache (non-blocking) -> Return SessionData
           |
      [Not Found] -> Return null
```

### Cache Configuration

| Setting    | Value                      | Rationale                                            |
| ---------- | -------------------------- | ---------------------------------------------------- |
| TTL        | 1 hour (3600s)             | Balance between cache hits and staleness             |
| Cache Key  | Pseudo-URL with tokenHash  | `https://session-cache.internal/session/{tokenHash}` |
| Write Mode | Non-blocking (`waitUntil`) | Don't slow down response                             |

### Core Implementation

#### Cache Module

```typescript
// src/lib/session-cache.ts

// Cloudflare Workers extends CacheStorage with .default
interface CloudflareCacheStorage extends CacheStorage {
  default: Cache;
}

const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_URL_PREFIX = "https://session-cache.internal/session/";

function buildCacheKey(tokenHash: string): Request {
  const url = `${CACHE_URL_PREFIX}${tokenHash}`;
  return new Request(url, { method: "GET" });
}

// Read from cache
export async function getSessionFromCache(
  tokenHash: string,
): Promise<CachedSessionData | null> {
  const cache = (caches as CloudflareCacheStorage).default;
  const cacheKey = buildCacheKey(tokenHash);

  const response = await cache.match(cacheKey);
  if (!response) return null;

  const data = await response.json<CachedSessionData>();

  // Restore Date object (JSON serializes as string)
  return {
    session: {
      ...data.session,
      expiresAt: new Date(data.session.expiresAt),
    },
    user: data.user,
  };
}

// Write to cache (non-blocking)
export function setSessionToCache(
  ctx: ExecutionContext,
  tokenHash: string,
  sessionData: CachedSessionData,
): void {
  const cache = (caches as CloudflareCacheStorage).default;
  const cacheKey = buildCacheKey(tokenHash);

  const response = new Response(JSON.stringify(sessionData), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `s-maxage=${CACHE_TTL_SECONDS}`,
    },
  });

  // Non-blocking write
  ctx.waitUntil(cache.put(cacheKey, response));
}

// Delete from cache (for logout)
export async function deleteSessionFromCache(
  tokenHash: string,
): Promise<boolean> {
  const cache = (caches as CloudflareCacheStorage).default;
  const cacheKey = buildCacheKey(tokenHash);
  return cache.delete(cacheKey);
}
```

#### Usage in Auth Middleware

```typescript
// src/middleware/auth.ts

export async function getSession(
  env: Bindings,
  ctx: ExecutionContext, // Required for cache write
  headers: Headers,
  authHeader?: string | null,
): Promise<SessionData | null> {
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const tokenHash = await hashToken(token);

    // 1. Check cache first
    const cached = await getSessionFromCache(tokenHash);
    if (cached && cached.session.expiresAt > new Date()) {
      return cached;
    }

    // 2. Cache miss - query database
    const sessionRecord = await db.query.session.findFirst({
      where: and(
        eq(schema.session.token, tokenHash),
        gt(schema.session.expiresAt, new Date()),
      ),
      with: { user: true },
    });

    if (sessionRecord?.user) {
      const sessionData = {
        /* ... */
      };

      // 3. Write to cache (non-blocking)
      setSessionToCache(ctx, tokenHash, sessionData);

      return sessionData;
    }
  }

  // ... Cookie session handling
}
```

### Cloudflare Cache API Key Points

1. **Cache Key must be a Request object**

   ```typescript
   // Correct
   const cacheKey = new Request("https://example.com/path", { method: "GET" });

   // Wrong - string doesn't work
   const cacheKey = "session:abc123";
   ```

2. **`caches.default` is Cloudflare-specific**

   ```typescript
   // Standard CacheStorage doesn't have .default
   // Need type assertion for TypeScript
   interface CloudflareCacheStorage extends CacheStorage {
     default: Cache;
   }
   const cache = (caches as CloudflareCacheStorage).default;
   ```

3. **Use `waitUntil` for non-blocking writes**

   ```typescript
   // Non-blocking - response returns immediately
   ctx.waitUntil(cache.put(cacheKey, response));

   // Blocking - waits for cache write
   await cache.put(cacheKey, response);
   ```

4. **TTL via Cache-Control header**
   ```typescript
   const response = new Response(JSON.stringify(data), {
     headers: {
       "Cache-Control": "s-maxage=3600", // 1 hour
     },
   });
   ```

### Cache Invalidation Strategy

| Event              | Action                                   |
| ------------------ | ---------------------------------------- |
| User logs out      | Call `deleteSessionFromCache(tokenHash)` |
| Session expires    | Cache TTL handles automatically          |
| Permissions change | Short TTL (1h) limits staleness          |
| Token revoked      | DB check will fail, cache ignored        |

### Session Cache Best Practices

**DO:**

- Always check session expiry after cache hit
- Use `waitUntil` for non-blocking cache writes
- Use pseudo-URL as cache key (e.g., `https://cache.internal/...`)
- Handle Date serialization (JSON -> string -> Date)
- Delete cache on logout

**DON'T:**

- Cache sensitive data that changes frequently
- Use very long TTL (>1h) for security-sensitive data
- Forget to pass `ExecutionContext` to cache write functions
- Block response waiting for cache write

---

## R2 Storage Guidelines

> **Cloudflare R2 storage operations with type-safe wrapper**

### Directory Structure

```
src/lib/r2/
├── index.ts          # Main entry - exports all functions and types
├── types.ts          # Type definitions (StoragePrefix, R2UploadOptions, etc.)
├── operations.ts     # Core operations (upload, download, delete, list)
└── utils.ts          # Utilities (key generation, MIME types, validation)
```

### Storage Key Convention

All storage keys follow this format:

```
{prefix}/{workspaceId}/{entityId?}/{filename}
```

**Supported Prefixes:**

| Prefix        | Purpose                            | Cache Control      |
| ------------- | ---------------------------------- | ------------------ |
| `attachments` | Entity attachments (images, files) | 1 year (immutable) |
| `avatars`     | User/workspace avatars             | 1 day              |
| `exports`     | Exported data (CSV, JSON)          | 1 hour             |
| `temp`        | Temporary files                    | 5 minutes          |

### Basic Usage

```typescript
import {
  generateStorageKey,
  generateUniqueFilename,
  uploadObject,
  downloadObject,
  deleteObject,
} from "../lib/r2";

// 1. Generate a unique storage key
const key = generateStorageKey({
  prefix: "attachments",
  workspaceId: workspace.id,
  entityId: entity.id,
  filename: generateUniqueFilename(file.name),
});
// => 'attachments/ws_123/ent_456/1702800000000-a1b2c3d4-image.png'

// 2. Upload file
const result = await uploadObject(c.env.R2_BUCKET, key, file.stream(), {
  contentType: file.type,
});

if (result.success) {
  // Save metadata to database
  await db.insert(attachment).values({
    storageKey: key,
    fileName: file.name,
    fileSize: result.size,
    fileType: file.type,
  });
}

// 3. Download file
const download = await downloadObject(c.env.R2_BUCKET, key);
if (download.success) {
  return new Response(download.body, {
    headers: { "Content-Type": download.contentType },
  });
}

// 4. Delete file
await deleteObject(c.env.R2_BUCKET, attachment.storageKey);
```

### Upload Endpoint Pattern

```typescript
// src/routes/attachments/procedures/upload.ts
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../../types";
import {
  generateStorageKey,
  generateUniqueFilename,
  uploadObject,
  validateUpload,
} from "../../../lib/r2";

export const uploadAttachment: MiddlewareHandler<AppEnv> = async (c) => {
  const logger = c.get("logger");
  const user = c.get("user");
  const workspaceId = c.get("workspaceId");

  if (!user || !workspaceId) {
    return c.json({ success: false, reason: "Unauthorized" }, 401);
  }

  // 1. Validate request
  const contentLength = c.req.header("content-length");
  const contentType = c.req.header("content-type");

  const validationError = validateUpload(
    contentLength ? parseInt(contentLength, 10) : null,
    contentType ?? null,
  );

  if (validationError) {
    return c.json(validationError, 400);
  }

  // 2. Get file from form data
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return c.json({ success: false, reason: "No file provided" }, 400);
  }

  // 3. Generate storage key
  const key = generateStorageKey({
    prefix: "attachments",
    workspaceId,
    filename: generateUniqueFilename(file.name),
  });

  // 4. Upload to R2
  const result = await uploadObject(c.env.R2_BUCKET, key, file.stream(), {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedBy: user.id,
    },
  });

  if (!result.success) {
    logger.error("upload_failed", { error: result.message });
    return c.json(result, 500);
  }

  // 5. Save to database
  const db = getDb(c.env);
  const [attachment] = await db
    .insert(attachmentTable)
    .values({
      workspaceId,
      storageKey: key,
      fileName: file.name,
      fileType: file.type,
      fileSize: result.size,
      createdBy: user.id,
    })
    .returning();

  logger.info("attachment_uploaded", {
    attachmentId: attachment.id,
    key,
    size: result.size,
  });

  return c.json({
    success: true,
    attachment: {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
    },
  });
};
```

### Download Endpoint Pattern

```typescript
// src/routes/attachments/procedures/download.ts
import { downloadObjectWithHeaders } from "../../../lib/r2";

export const downloadAttachment: MiddlewareHandler<AppEnv> = async (c) => {
  const attachmentId = c.req.param("id");
  const workspaceId = c.get("workspaceId");

  // 1. Get attachment from database
  const db = getDb(c.env);
  const attachment = await db.query.attachment.findFirst({
    where: and(
      eq(attachmentTable.id, attachmentId),
      eq(attachmentTable.workspaceId, workspaceId),
    ),
  });

  if (!attachment) {
    return c.json({ success: false, reason: "Attachment not found" }, 404);
  }

  // 2. Serve from R2 with HTTP caching support
  return downloadObjectWithHeaders(
    c.env.R2_BUCKET,
    attachment.storageKey,
    c.req.raw.headers,
  );
};
```

### Batch Delete Pattern

```typescript
import { deleteObjects, buildEntityPrefix, listObjects } from "../../../lib/r2";

// Delete all attachments for an entity
async function deleteEntityAttachments(
  bucket: R2Bucket,
  workspaceId: string,
  entityId: string,
): Promise<void> {
  const prefix = buildEntityPrefix("attachments", workspaceId, entityId);

  // List all objects with this prefix
  const result = await listObjects(bucket, { prefix });

  if (result.success && result.objects.length > 0) {
    const keys = result.objects.map((obj) => obj.key);
    await deleteObjects(bucket, keys);
  }
}
```

### Available Functions

| Function                                          | Purpose                            |
| ------------------------------------------------- | ---------------------------------- |
| `generateStorageKey(params)`                      | Generate storage key from params   |
| `generateUniqueFilename(name)`                    | Add timestamp + random to filename |
| `parseStorageKey(key)`                            | Parse key back to params           |
| `uploadObject(bucket, key, body, options)`        | Upload file to R2                  |
| `downloadObject(bucket, key)`                     | Download file from R2              |
| `downloadObjectWithHeaders(bucket, key, headers)` | Download with HTTP caching         |
| `getObjectMeta(bucket, key)`                      | Get metadata without body          |
| `deleteObject(bucket, key)`                       | Delete single object               |
| `deleteObjects(bucket, keys)`                     | Batch delete objects               |
| `listObjects(bucket, options)`                    | List objects with prefix           |
| `objectExists(bucket, key)`                       | Check if object exists             |
| `validateUpload(contentLength, contentType)`      | Validate upload request            |

### Error Handling

All operations return discriminated unions:

```typescript
const result = await uploadObject(bucket, key, body);

if (result.success) {
  // result is R2UploadResult
  console.log(result.key, result.size, result.etag);
} else {
  // result is R2Error
  console.log(result.code, result.message);
  // code: 'NOT_FOUND' | 'FORBIDDEN' | 'PAYLOAD_TOO_LARGE' | 'INVALID_KEY' | 'UPLOAD_FAILED' | 'UNKNOWN'
}
```

### R2 Best Practices

**DO:**

- Always use `generateStorageKey()` for consistent key format
- Use `generateUniqueFilename()` to prevent collisions
- Store `storageKey` in database for later retrieval
- Use `downloadObjectWithHeaders()` for serving files (supports Range, ETag)
- Validate file size before upload with `validateUpload()`
- Delete R2 objects when deleting database records
- Use batch delete for multiple objects

**DON'T:**

- Construct storage keys manually (use `generateStorageKey`)
- Store files without workspace isolation
- Forget to handle upload errors
- Use `downloadObject` for HTTP endpoints (use `downloadObjectWithHeaders`)
- Leave orphaned R2 objects after database deletion

### Configuration

R2 bucket is configured in `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "your-bucket-name"
```

Access via `c.env.R2_BUCKET` in handlers.

---

## KV Storage (Quick Reference)

For key-value storage needs:

```typescript
// Read
const value = await c.env.MY_KV.get("key");
const data = await c.env.MY_KV.get("key", "json");

// Write
await c.env.MY_KV.put("key", "value");
await c.env.MY_KV.put("key", JSON.stringify(data), {
  expirationTtl: 3600, // 1 hour
});

// Delete
await c.env.MY_KV.delete("key");

// List
const list = await c.env.MY_KV.list({ prefix: "user:" });
```

Configure in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MY_KV"
id = "your-kv-namespace-id"
```

## Reference

- [Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
