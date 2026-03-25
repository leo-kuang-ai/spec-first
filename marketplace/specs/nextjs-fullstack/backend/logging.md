# Logging and Monitoring

This document covers structured logging, error tracking with Sentry, and observability patterns.

## Critical Rules

### NO `console.log` - Use Structured Logger

Never use `console.log` in production code. Always use the structured logger from `@your-app/logs`.

```typescript
// BAD - Unstructured console logging
console.log("Order created:", orderId);
console.error("Failed to process:", error);

// GOOD - Structured logging
import { logger } from "@your-app/logs";

logger.info("Order created", {
  orderId,
  userId,
  total: order.total,
});

logger.error("Failed to process order", {
  orderId,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
});
```

## Logger API

```typescript
import { logger } from "@your-app/logs";

// Log levels
logger.debug("Debug message", { context: "value" });
logger.info("Info message", { orderId, status });
logger.warn("Warning message", { userId, reason: "quota exceeded" });
logger.error("Error message", { error: err.message, stack: err.stack });
```

## Sentry Integration

### Span Tracing

Use the tracing system to monitor performance and track operations.

```typescript
import { SpanPrefix, span } from "../../../lib/tracer";

// Database operations
const orders = await span(
  `${SpanPrefix.DB}GetUserOrders`,
  () => db.select().from(orderTable).where(eq(orderTable.userId, userId)),
  { userId, limit: 20 }
);

// External API calls
const response = await span(
  `${SpanPrefix.Http}FetchInventory`,
  () => inventoryClient.getStock(productIds),
  { productCount: productIds.length }
);

// Redis cache operations
const cached = await span(
  `${SpanPrefix.Redis}GetSession`,
  () => redis.get(sessionKey),
  { sessionKey }
);
```

### SpanPrefix Constants

Use standardized prefixes for consistent Sentry categorization:

```typescript
import { SpanPrefix } from "../../../lib/tracer";

const SpanPrefix = {
  /** Database operations - maps to Sentry op: db.query */
  DB: "DB.",

  /** External HTTP API calls - maps to Sentry op: http.client */
  Http: "Http.",

  /** Redis cache operations - maps to Sentry op: db.redis */
  Redis: "Redis.",

  /** AI model invocations - maps to Sentry op: ai.run */
  AI: "AI.",

  /** Generic cache operations - maps to Sentry op: cache */
  Cache: "Cache.",

  /** Queue/message operations - maps to Sentry op: queue */
  Queue: "Queue.",
} as const;
```

### Naming Convention

```typescript
// Pattern: ${SpanPrefix.Type}${Action}${Resource}

// Database
`${SpanPrefix.DB}GetUserOrders`
`${SpanPrefix.DB}BatchUpdateProducts`
`${SpanPrefix.DB}CreateOrder`

// External APIs
`${SpanPrefix.Http}FetchPaymentStatus`
`${SpanPrefix.Http}SendNotification`

// Redis
`${SpanPrefix.Redis}GetSession`
`${SpanPrefix.Redis}SetCache`

// AI
`${SpanPrefix.AI}ClassifyContent`
`${SpanPrefix.AI}GenerateResponse`
```

### Error Capture

```typescript
import { captureError } from "../../../lib/tracer";

try {
  await processOrder(orderId);
} catch (error) {
  captureError(error, {
    tags: {
      operation: "processOrder",
      orderId,
    },
    extra: {
      userId: context.user.id,
      orderStatus: order.status,
    },
  });

  throw error; // Re-throw if needed
}
```

### Trace Context

For complex operations, use trace context to correlate logs:

```typescript
import { runWithTrace, getLogId } from "../../../lib/tracer";

export async function processOrderBatch(orderIds: string[]) {
  return runWithTrace(`batch-${Date.now()}`, async () => {
    const logId = getLogId();

    logger.info("Starting batch processing", {
      logId,
      orderCount: orderIds.length
    });

    for (const orderId of orderIds) {
      await span(
        `${SpanPrefix.DB}ProcessOrder`,
        () => processSingleOrder(orderId),
        { orderId }
      );
    }

    logger.info("Batch processing complete", { logId });
  });
}
```

## AI SDK Telemetry

When using the Vercel AI SDK, enable telemetry for token tracking:

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: userPrompt,
  experimental_telemetry: {
    isEnabled: true,
    functionId: "classify-content",
    metadata: {
      userId,
      contentLength: content.length,
    },
  },
});
```

### Telemetry Metadata

Include relevant context in telemetry:

```typescript
experimental_telemetry: {
  isEnabled: true,
  functionId: "generate-response",  // Unique identifier for this AI function
  metadata: {
    // User context
    userId: context.user.id,

    // Input metrics
    promptTokens: estimatedTokens,

    // Business context
    feature: "auto-reply",
    priority: "high",
  },
}
```

## Error Handling Patterns

### Structured Error Logging

```typescript
async function processPayment(orderId: string) {
  try {
    const result = await paymentGateway.charge(orderId);

    logger.info("Payment processed", {
      orderId,
      transactionId: result.transactionId,
      amount: result.amount,
    });

    return result;
  } catch (error) {
    logger.error("Payment processing failed", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as any).code,
    });

    // Capture to Sentry with context
    captureError(error, {
      tags: { service: "payment", operation: "charge" },
      extra: { orderId },
    });

    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Payment processing failed",
    });
  }
}
```

### Batch Operation Logging

```typescript
async function batchUpdateInventory(updates: InventoryUpdate[]) {
  const results: ProcessResult[] = [];

  logger.info("Starting batch inventory update", {
    updateCount: updates.length,
  });

  const processed = await Promise.allSettled(
    updates.map(update => processUpdate(update))
  );

  const successful = processed.filter(r => r.status === "fulfilled").length;
  const failed = processed.filter(r => r.status === "rejected").length;

  logger.info("Batch inventory update complete", {
    total: updates.length,
    successful,
    failed,
  });

  if (failed > 0) {
    logger.warn("Some inventory updates failed", {
      failedCount: failed,
      errors: processed
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map(r => r.reason?.message || "Unknown error"),
    });
  }

  return { successful, failed };
}
```

## Logging Best Practices

### What to Log

**Always log:**
- Request/response for external API calls
- Database write operations (create, update, delete)
- Authentication events
- Business-critical operations
- Errors and exceptions

**Log with care (avoid sensitive data):**
- User inputs (sanitize PII)
- Request payloads (redact secrets)

**Never log:**
- Passwords or tokens
- Credit card numbers
- Personal identification numbers
- API keys or secrets

### Log Levels Guide

| Level | Use Case | Example |
|-------|----------|---------|
| `debug` | Development diagnostics | Variable values, flow tracing |
| `info` | Normal operations | Order created, user logged in |
| `warn` | Recoverable issues | Rate limit approaching, retry attempted |
| `error` | Failures requiring attention | API call failed, database error |

### Structured Context

Always include relevant context as structured data:

```typescript
// BAD - String interpolation
logger.info(`User ${userId} created order ${orderId} for $${total}`);

// GOOD - Structured context
logger.info("Order created", {
  userId,
  orderId,
  total,
  currency: "USD",
  itemCount: items.length,
});
```
