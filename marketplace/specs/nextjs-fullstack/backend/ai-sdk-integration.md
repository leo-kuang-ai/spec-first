# AI SDK Backend Integration Guidelines

## 1. Overview

This document covers backend integration patterns using the Vercel AI SDK (`ai` package) for AI-powered features.

### Supported Providers
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- **Google Gemini**: gemini-1.5-pro, gemini-1.5-flash
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus

### Package Dependencies
```bash
pnpm add ai @ai-sdk/openai @ai-sdk/google @ai-sdk/anthropic
```

## 2. Basic Usage

### generateText

Use `generateText` for simple text generation tasks where you need a complete response.

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: "Summarize this document...",
});
```

### generateObject (Structured Output with Zod)

Use `generateObject` when you need type-safe structured output. The AI SDK validates the response against your Zod schema automatically.

```typescript
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const classificationSchema = z.object({
  category: z.enum(["urgent", "normal", "low"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

const { object } = await generateObject({
  model: openai("gpt-4o-mini"),
  schema: classificationSchema,
  prompt: "Classify the priority of this task...",
});
// object is typed as { category: "urgent" | "normal" | "low", confidence: number, reasoning: string }
```

### streamText (For SSE/Streaming)

Use `streamText` for real-time streaming responses, ideal for chat interfaces and long-form content generation.

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = streamText({
  model: openai("gpt-4o"),
  messages: conversationHistory,
  system: "You are a helpful assistant.",
});

// Return as SSE stream
return result.toDataStreamResponse();
```

## 3. Telemetry Configuration

**IMPORTANT**: Always enable telemetry for token tracking and performance monitoring.

```typescript
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

const { object } = await generateObject({
  model: openai("gpt-4o-mini"),
  schema: mySchema,
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    functionId: "orders.classify",  // Module.function naming
    metadata: {
      orderId,
      userId,
    },
  },
});
```

### Telemetry Naming Convention

Use dot-separated format for `functionId`: `module.function`

| Module | Example functionId |
|--------|-------------------|
| Orders | `orders.classify`, `orders.summarize` |
| Support | `support.generateReply`, `support.categorize` |
| Content | `content.summarize`, `content.translate` |
| Users | `users.analyzePreferences` |

### Auto-recorded Metrics

When telemetry is enabled, these metrics are automatically tracked:

| Metric | Description |
|--------|-------------|
| `ai.model.id` | Model identifier (e.g., gpt-4o-mini) |
| `ai.model.provider` | Provider name (e.g., openai) |
| `ai.usage.prompt_tokens` | Input tokens consumed |
| `ai.usage.completion_tokens` | Output tokens generated |
| `ai.usage.total_tokens` | Total tokens used |
| `ai.response.finish_reason` | Completion reason (stop, length, etc.) |

## 4. Tool Calling

Define tools that the AI model can invoke to perform actions in your system.

```typescript
import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "Create a task for the user...",
  tools: {
    createTask: tool({
      description: "Create a new task in the system",
      parameters: z.object({
        title: z.string(),
        dueDate: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]),
      }),
      execute: async ({ title, dueDate, priority }) => {
        const task = await db.insert(tasks).values({
          title,
          dueDate: dueDate ? new Date(dueDate) : null,
          priority,
        }).returning();
        return { success: true, taskId: task[0].id };
      },
    }),
    searchOrders: tool({
      description: "Search for orders by criteria",
      parameters: z.object({
        query: z.string(),
        status: z.enum(["pending", "completed", "cancelled"]).optional(),
        limit: z.number().default(10),
      }),
      execute: async ({ query, status, limit }) => {
        const orders = await db.query.orders.findMany({
          where: and(
            like(orders.title, `%${query}%`),
            status ? eq(orders.status, status) : undefined
          ),
          limit,
        });
        return { orders };
      },
    }),
  },
});

// Access tool results
if (result.toolCalls) {
  for (const toolCall of result.toolCalls) {
    console.log(`Tool: ${toolCall.toolName}`, toolCall.result);
  }
}
```

## 5. Error Handling

Always implement graceful error handling for AI operations.

```typescript
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { logger } from "@your-app/logs";

async function classifyOrder(orderData: OrderData) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: classificationSchema,
      prompt: buildClassificationPrompt(orderData),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "orders.classify",
      },
    });
    return { success: true, data: object };
  } catch (error) {
    logger.error("AI generation failed", {
      error,
      orderId: orderData.id,
      prompt: buildClassificationPrompt(orderData).slice(0, 100)
    });

    // Return graceful fallback
    return {
      success: false,
      reason: "AI processing failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Common Error Types

| Error | Cause | Resolution |
|-------|-------|------------|
| Rate limit exceeded | Too many requests | Implement exponential backoff |
| Context length exceeded | Prompt too long | Truncate or summarize input |
| Invalid API key | Missing/wrong credentials | Check environment variables |
| Schema validation failed | AI output doesn't match schema | Adjust schema or prompt |

## 6. Prompt Engineering Best Practices

### Use XML Structure for Complex Prompts

XML tags help the AI model better understand the structure of your request.

```typescript
const prompt = `
<context>
${contextData}
</context>

<task>
Analyze the above context and extract key information.
</task>

<output_format>
Return a JSON object with the following fields:
- summary: A brief summary
- keyPoints: Array of key points
- sentiment: positive, negative, or neutral
</output_format>
`;
```

### System Prompts

Define consistent behavior with system prompts.

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await generateText({
  model: openai("gpt-4o"),
  system: `You are a professional assistant.
Always respond in a structured format.
Be concise and accurate.
Never make up information - if unsure, say so.`,
  messages: userMessages,
});
```

### Multi-step Prompts

For complex tasks, break down into multiple AI calls.

```typescript
// Step 1: Extract entities
const { object: entities } = await generateObject({
  model: openai("gpt-4o-mini"),
  schema: entitiesSchema,
  prompt: `Extract entities from: ${document}`,
});

// Step 2: Classify based on entities
const { object: classification } = await generateObject({
  model: openai("gpt-4o-mini"),
  schema: classificationSchema,
  prompt: `
<entities>
${JSON.stringify(entities, null, 2)}
</entities>

<task>
Based on these entities, classify the document category.
</task>
`,
});
```

## 7. Provider-Specific Configuration

### OpenAI

```typescript
import { openai } from "@ai-sdk/openai";

const model = openai("gpt-4o-mini", {
  // Optional: custom configuration
});
```

### Google Gemini

```typescript
import { google } from "@ai-sdk/google";

const model = google("gemini-1.5-flash");
```

### Anthropic

```typescript
import { anthropic } from "@ai-sdk/anthropic";

const model = anthropic("claude-3-5-sonnet-20241022");
```

## 8. Best Practices Summary

| Rule | Description |
|------|-------------|
| Always enable telemetry | Track token usage and performance for cost monitoring |
| Use generateObject for structured output | Leverage Zod schemas for type safety and validation |
| Use XML prompts for complex tasks | Better structure improves AI understanding |
| Handle errors gracefully | Return fallback responses, never crash |
| Log AI failures | Include context (truncated prompt, IDs) for debugging |
| Use appropriate model sizes | Use mini models for simple tasks, larger for complex |
| Implement rate limiting | Protect against API quota exhaustion |
| Cache responses when appropriate | Reduce costs for repeated queries |

## 9. Environment Variables

Required environment variables for AI providers:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```
