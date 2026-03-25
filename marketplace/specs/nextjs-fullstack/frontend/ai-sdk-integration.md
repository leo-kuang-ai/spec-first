# AI SDK Frontend Integration

## 1. Overview

This guide covers frontend integration with the Vercel AI SDK using `@ai-sdk/react`. Key topics include:

- Using `@ai-sdk/react` for React integration
- Streaming chat with the `useChat` hook
- Tool call handling with proper format detection

## 2. Basic Chat with useChat

The `useChat` hook provides a simple interface for chat functionality:

```typescript
"use client";

import { useChat } from "@ai-sdk/react";

export function ChatPanel() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={status === "streaming"}
        />
        <button type="submit" disabled={status === "streaming"}>
          Send
        </button>
      </form>
    </div>
  );
}
```

## 3. Custom Transport with oRPC

When using oRPC instead of standard fetch:

```typescript
import { useChat } from "@ai-sdk/react";
import { eventIteratorToStream } from "@orpc/client";
import { orpcClient } from "@/lib/orpc-client";

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await orpcClient.chat.send(
            {
              sessionId,
              messages: options.messages,
            },
            { signal: options.abortSignal }
          )
        );
      },
      reconnectToStream() {
        throw new Error("Reconnect not supported");
      },
    },
  });

  // ... rest of component
}
```

## 4. Tool Calls Handling

**CRITICAL**: Tool calls have TWO different formats that must both be handled:

### Format 1: Real-time Streaming

During streaming, tool results appear as:

```typescript
{
  type: "tool-createTask",  // tool-{toolName}
  toolCallId: "call_abc123",
  state: "output-available",
  input: { title: "...", priority: "high" },
  output: { success: true, taskId: "task_xyz" }  // Direct object
}
```

### Format 2: History Restore

When loading from history/database:

```typescript
{
  type: "tool-result",
  toolName: "createTask",
  toolCallId: "call_abc123",
  output: {
    type: "json",
    value: { success: true, taskId: "task_xyz" }  // Nested in value
  }
}
```

### Unified Handling Pattern

```typescript
import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useRef } from "react";

export function AssistantPanel({ sessionId }: { sessionId: string }) {
  const [createdItems, setCreatedItems] = useState<Map<string, CreatedItem>>(new Map());
  const toolCallsRef = useRef<Map<string, string>>(new Map());

  const { messages, status } = useChat({
    id: sessionId,
    transport: { /* ... */ },

    // Handle real-time tool results
    onData: (dataPart) => {
      const payload = typeof dataPart === "object" && "json" in dataPart
        ? (dataPart as { json: unknown }).json
        : dataPart;

      if (typeof payload === "object" && payload !== null && "type" in payload) {
        const { type, data } = payload as { type: string; data: any };

        if (type === "tool-output-available" || type === "tool-result") {
          const { toolCallId, output } = data;
          const toolName = toolCallsRef.current.get(toolCallId);

          if (toolName === "createTask" && output?.success) {
            setCreatedItems((prev) => {
              if (prev.has(toolCallId)) return prev;
              return new Map(prev).set(toolCallId, {
                id: output.taskId,
                title: output.title,
              });
            });
          }
        }
      }
    },
  });

  // Handle history restore
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role !== "assistant") return;

      const parts = (message as any).parts || [];
      parts.forEach((part: any) => {
        // Match both formats
        const isRealTime = part.type === "tool-createTask" && part.state === "output-available";
        const isRestored = part.type === "tool-result" && part.toolName === "createTask";

        if ((isRealTime || isRestored) && part.output) {
          const key = part.toolCallId || message.id;

          // Extract output (handle nested structure)
          const rawOutput = part.output;
          const output = rawOutput?.type === "json" && rawOutput?.value
            ? rawOutput.value
            : rawOutput;

          if (output?.success) {
            setCreatedItems((prev) => {
              if (prev.has(key)) return prev;
              return new Map(prev).set(key, {
                id: output.taskId,
                title: output.title,
              });
            });
          }
        }
      });
    });
  }, [messages, status]);

  return (
    <div>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Display created items */}
      {Array.from(createdItems.values()).map((item) => (
        <CreatedItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## 5. Tool Call State Lifecycle

During streaming, tool parts go through these states:

| State | Description |
|-------|-------------|
| `input-streaming` | Tool input is being generated |
| `input-available` | Complete input ready |
| `output-available` | Tool executed, result available |
| `output-error` | Tool execution failed |

## 6. Displaying Thought Process

Show users what the AI is "thinking":

```typescript
const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);

// In onData handler
if (type === "tool-input-start" || type === "tool-call") {
  const { toolCallId, toolName, input } = data;
  toolCallsRef.current.set(toolCallId, toolName);

  setThoughtSteps((prev) => [
    ...prev,
    { id: toolCallId, toolName, status: "pending", input },
  ]);
}

if (type === "tool-output-available") {
  setThoughtSteps((prev) =>
    prev.map((step) =>
      step.id === toolCallId
        ? { ...step, status: "done", result: output }
        : step
    )
  );
}
```

## 7. Best Practices Summary

| Rule | Description |
|------|-------------|
| Handle both tool formats | Real-time and history restore |
| Use toolCallId as key | Correlate calls across formats |
| Use useRef for toolName mapping | Avoid React state timing issues |
| onData for real-time UI | useEffect for history restore |
| Show thought process | Better UX for tool-heavy flows |
