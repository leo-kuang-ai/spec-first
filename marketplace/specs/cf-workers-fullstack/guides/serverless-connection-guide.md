# Serverless Connection Thinking Guide

> **Purpose**: Debug and prevent connection-related issues in serverless environments (Cloudflare Workers, AWS Lambda, Vercel Edge, etc.)

---

## Why This Guide?

Serverless environments have unique characteristics that break traditional connection patterns:

- **VM reuse**: Instances may be reused across requests, but connections may timeout
- **Cold starts**: New instances have no cached connections
- **No persistent state**: Module-level caches can become stale zombies
- **HTTP-based backends**: Many databases (Turso, Neon, PlanetScale) use HTTP, not TCP

**Most connection bugs come from "didn't think about serverless lifecycle"**.

---

## Quick Reference: When to Use This Guide

### Trigger Symptoms

- [ ] Random "Failed query" errors that work on retry
- [ ] Errors appear after periods of inactivity
- [ ] CLI works fine but deployed code fails
- [ ] SSE/WebSocket long connections fail mid-stream
- [ ] Errors like "connection closed", "ECONNRESET", "socket hang up"
- [ ] SSE works for ~2-3 minutes then all DB queries fail (subrequest limit)

### Trigger Patterns

- [ ] Using module-level cached database client
- [ ] Using connection pools in serverless
- [ ] Long-running connections (SSE, WebSocket)
- [ ] Singleton patterns for external service clients

---

## The Serverless Connection Trap

### What You Expect

```
Request 1 -> Create client -> Query -> Response
Request 2 -> Reuse client -> Query -> Response  (Fast!)
Request 3 -> Reuse client -> Query -> Response  (Fast!)
```

### What Actually Happens

```
Request 1   -> Create client -> Query -> Response
[5 minutes of inactivity - connection times out on server side]
Request 2   -> Reuse stale client -> Query -> FAIL! "connection closed"
Request 3   -> Still using stale client -> FAIL!
...
[Worker instance recycled]
Request N   -> Create new client -> Query -> Response  (Works again)
```

---

## Debugging Methodology

### Step 1: Identify Symptoms vs Root Cause

| Symptom                       | Possible Root Causes                              |
| ----------------------------- | ------------------------------------------------- |
| "Failed query" with valid SQL | Stale connection, auth token expired              |
| Works locally, fails in prod  | Different runtime environment, connection caching |
| Random failures, then works   | Connection timeout, VM reuse with stale cache     |
| Fails after inactivity        | Connection keepalive timeout exceeded             |

### Step 2: CLI vs Production Comparison

```bash
# If this works but production fails, the issue is likely connection caching
turso db shell my-db "SELECT 1"

# Check production logs for patterns
wrangler tail --sampling-rate 0.9999
```

**Key insight**: CLI creates fresh connection per command. Production may reuse stale connections.

### Step 3: Check for Module-Level Caching

Search for these anti-patterns:

```typescript
// Anti-pattern: Module-level cache
let cachedClient: Client | null = null;

export function getDb(env: Env) {
  if (cachedClient) return cachedClient; // Returns zombie connection!
  cachedClient = createClient({ url: env.DATABASE_URL });
  return cachedClient;
}
```

---

## Solutions by Database Type

### HTTP-Based Databases (Turso, Neon HTTP, PlanetScale)

**Recommended**: Create client per request. HTTP clients are stateless and lightweight.

```typescript
// Correct: Fresh client per request
export function getDb(env: Bindings): LibSQLDatabase<typeof schema> {
  const client = createClient({ url: env.DATABASE_URL });
  return drizzle(client, { schema });
}
```

**Why this works**:

- HTTP is stateless - no persistent connection to become stale
- libsql/neon HTTP clients have minimal creation overhead
- Server-side connection pooling handles efficiency

### TCP-Based Databases (PostgreSQL, MySQL direct)

For TCP connections, use:

1. **Connection per request** (simple, slightly higher latency)
2. **Connection with health check** (more complex)
3. **External connection pooler** (PgBouncer, ProxySQL, Hyperdrive)

```typescript
// Option 1: Fresh connection per request
export async function getDb(env: Env) {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  return client;
}

// Option 2: With health check (more complex)
export async function getDb(env: Env) {
  if (cachedClient) {
    try {
      await cachedClient.query("SELECT 1"); // Health check
      return cachedClient;
    } catch {
      cachedClient = null; // Clear stale connection
    }
  }
  cachedClient = new Client({ connectionString: env.DATABASE_URL });
  await cachedClient.connect();
  return cachedClient;
}
```

---

## Long-Running Connection Patterns (SSE, WebSocket)

Long connections are especially vulnerable because:

- Connection may timeout mid-stream
- No natural reconnection point
- Errors affect multiple sequential operations

### Pattern: Fresh DB Client in Long-Running Loops

```typescript
// Correct: Get fresh db reference in each poll iteration
app.get('/sse', async (c) => {
  return streamSSE(c, async (stream) => {
    while (isRunning) {
      try {
        const db = getDb(c.env);  // Fresh client each iteration
        const events = await db.query.syncEvent.findMany({ ... });
        // Process events...
      } catch (error) {
        logger.error('poll_error', error);
        // Error doesn't cascade to next iteration
      }
      await stream.sleep(3000);
    }
  });
});
```

---

## Prevention Checklist

Before deploying database code to serverless:

- [ ] **No module-level client caching** for HTTP databases
- [ ] **Fresh client per request** is the default pattern
- [ ] **Long connections** (SSE, cron) get fresh client each operation
- [ ] **Tested with actual deployment**, not just local dev
- [ ] **Logs include request IDs** for tracing connection issues

---

## Common Mistakes

| Mistake                                | Why It's Wrong                      | Fix                      |
| -------------------------------------- | ----------------------------------- | ------------------------ |
| Module-level `let client = null` cache | Connection becomes zombie           | Create per request       |
| Global singleton pattern               | Same as above                       | Create per request       |
| Assuming "lightweight" means "free"    | Creation cost is often negligible   | Measure, don't assume    |
| Only testing locally                   | Local dev doesn't have VM reuse     | Test deployed version    |
| Ignoring intermittent errors           | "Works most of the time" hides bugs | Investigate all failures |

---

## Reference

### Official Documentation

- [Cloudflare Workers + Turso Tutorial](https://developers.cloudflare.com/workers/tutorials/connect-to-turso-using-workers/)
- [Drizzle ORM + LibSQL](https://orm.drizzle.team/docs/connect-turso)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)

---

## Platform Limits

### Cloudflare Workers Subrequest Limit

**Critical**: Cloudflare Workers Free tier has a **50 subrequest limit per request**.

Each of these counts as 1 subrequest:

- Database query (HTTP-based like Turso/libsql)
- Fetch to external API
- KV read/write
- R2 read/write

**Impact on Long Connections (SSE)**:

```
SSE connection started
Poll 1: DB query (subrequest 1)
Poll 2: DB query (subrequest 2)
...
Poll 50: DB query (subrequest 50)
Poll 51: DB query -> FAILS! "Failed query"
Poll 52: Still fails
...
[All subsequent polls fail until SSE reconnects]
```

**With 3s polling**: 50 queries = ~2.5 minutes before hitting limit
**With 5s polling**: 50 queries = ~4 minutes before hitting limit

**Solution**: Force SSE reconnection before hitting limit

```typescript
const POLL_INTERVAL_MS = 5000; // 5s between polls
const MAX_CONNECTION_MS = 2 * 60 * 1000; // 2 min max connection
const MAX_POLLS = 40; // Stay under 50 limit

while (isRunning) {
  pollCount++;

  // Force reconnection before hitting limit
  if (pollCount >= MAX_POLLS) {
    logger.info("sse_max_polls_reached");
    break; // Client will auto-reconnect
  }

  // ... poll logic
}
```

**Client behavior**: SSE closes gracefully -> client reconnects -> new request with fresh subrequest quota.

---

## Lessons Learned

### Case 1: libsql Stale Connection

**Symptoms**:

- Random "Failed query" errors
- SSE polling failed every 6 seconds for 7.5 minutes
- Same SQL worked in CLI

**Root Cause**:

- Module-level cached libsql client became stale
- Cloudflare Workers reused VM but connection was dead

**Fix**:

- Removed module-level cache
- Create fresh client per `getDb()` call

**Key Insight**: HTTP-based database clients (libsql, neon http) are stateless. The "optimization" of caching them is actually harmful in serverless.

### Case 2: SSE Subrequest Limit

**Symptoms**:

- SSE worked for ~2.5 minutes, then all DB polls failed with "Failed query"
- Heartbeats still worked (no DB query)
- After client restart, SSE worked again for ~2.5 minutes

**Root Cause**:

- Cloudflare Workers Free has 50 subrequest limit per request
- SSE with 3s polling = 20 polls/min = 50 polls in 2.5 min
- After 50th poll, all subsequent DB queries fail

**Fix**:

- Increased poll interval: 3s -> 5s
- Added max polls counter: 40 (under 50 limit)
- Reduced max connection time: 10min -> 2min
- On error, break loop instead of retry (let client reconnect)

**Key Insight**: Long-lived SSE connections in Cloudflare Workers must proactively close before hitting platform limits. The client reconnection is the "reset" mechanism.

---

**Core Principle**: In serverless, connection freshness > connection reuse.

---

**Language**: All documentation must be written in **English**.
