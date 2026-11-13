---
title: "From POST /entries to state visible through GET /entries"
date: 2026-10-30
input_shape: concept
subject: "MiniLedger request handling, in-memory ownership, ordering, and failure boundaries"
---

A `POST /entries` changes shared state only when its request body finishes arriving and the `end` callback successfully parses it. That callback appends one entry to the module-level `entries` array, then ends the response with `ok`. A later `GET /entries` serializes that same array.

This explanation comes from static inspection of the supplied fixture. The application was not executed or tested. References identify the inspected local files; no Git revision was verified.

## Follow the trigger through the state change

```mermaid
sequenceDiagram
    participant P as POST client
    participant H as HTTP request handler
    participant E as Shared entries array
    participant G as GET client

    P->>H: POST /entries
    Note over H: Allocate request-local body string
    P->>H: data event(s)
    Note over H: Append each chunk to body
    P->>H: end event
    H->>H: JSON.parse(body or "{}")
    alt Parsing and destructuring succeed
        H->>E: Append id, amount, note, ts
        H-->>P: End response with "ok"
        G->>H: GET /entries
        H->>E: Read current contents
        H-->>G: application/json serialization
    else Parsing or destructuring throws
        Note over H: No append; no "ok"; no local error handler
    end
```

The diagram shows a GET after the append. A GET can also arrive while a POST body is still being collected; in that case, it sees only entries already appended.

The complete sequence is:

1. The HTTP handler selects the POST branch only when both `req.method === 'POST'` and `req.url === '/entries'`.
2. It creates a fresh `body` string for that request and registers `data` and `end` listeners.
3. Each `data` event extends that request’s body. Receiving a chunk does not change `entries`.
4. The `end` callback parses the accumulated body and extracts `amount` and `note`.
5. It appends an object containing an ID based on the current array length, those two values, and a timestamp from `Date.now()`.
6. Only after the append does it call `res.end('ok')`.

The `return` after listener registration prevents this POST from falling through to the GET and 404 branches. It does not wait for the body or perform the insertion itself.

Source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:5–15`.

## Ownership explains why GET sees the result

The array belongs to the loaded server module; each POST’s body belongs to that request’s closure. Every request handler accesses the same array in this server instance.

| Value | Owner and lifetime | Observable consequence |
|---|---|---|
| `entries` | Module-level mutable array | Successful appends are visible to subsequent GET handling in the same instance. |
| `body` | One POST’s callback closure | Concurrent POST requests accumulate their bodies separately. |
| `id` | Assigned during insertion as `entries.length + 1` | IDs reflect insertion order, not necessarily request arrival order. |
| `amount`, `note` | Extracted from parsed input | The server performs no explicit field or type validation. |
| `ts` | Assigned during insertion with `Date.now()` | It records server-side insertion time, not when the client began sending. |
| GET response text | Produced by `JSON.stringify(entries)` | It represents the array at serialization time, not a live subscription. |

Sources: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:3–18`.

The key mutation is small and synchronous:

```javascript
const { amount, note } = JSON.parse(body || '{}');
entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
res.end('ok');
```

There is no asynchronous pause between parsing, appending, and ending the response. Within this callback, another request callback does not interleave those statements. Across POST requests, however, the code establishes no queue based on arrival time: whichever successful `end` callback runs first appends first.

For example, if a server instance starts with no entries and receives:

```json
{"amount":12.5,"note":"Lunch"}
```

the insertion produces an object with `id: 1`, `amount: 12.5`, `note: "Lunch"`, and a generated timestamp. A GET handled afterward returns a JSON array containing it. This is a source-derived example, not an observed run.

The GET branch explicitly sets `content-type` to `application/json`. The POST branch returns the text `ok`; it does not return the created object or explicitly set a success status or content type. Other method/URL combinations receive an explicit 404 and `not found`. The exact URL comparison also means `/entries?limit=10` does not match `/entries`.

Source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:6–22`.

## Malformed JSON fails before mutation

Malformed, nonempty JSON causes `JSON.parse` to throw before `entries.push` executes. This request therefore appends nothing through this path, and its `res.end('ok')` is not reached.

There is no surrounding `try/catch`, explicit 400 response, or recovery handler in the supplied server. The exception escapes the callback. The fixture does not establish a graceful response or continued service after that exception; process-level handling and supervision outside these files are unknown.

Several nearby cases behave differently:

| Body | Consequence from this code |
|---|---|
| Malformed nonempty JSON | Parsing throws before insertion. |
| Empty body | `body || '{}'` supplies `{}`; an entry is appended with undefined `amount` and `note`. |
| Whitespace-only body | The string is truthy, so the `{}` fallback is not used; parsing fails. |
| `null` | JSON parsing succeeds, but destructuring `amount` and `note` from `null` throws before insertion. |
| `{}` | Insertion succeeds without required-field validation. When GET serializes the object, undefined fields are omitted. |

This distinguishes syntactically valid JSON from an acceptable expense. The implementation checks neither a numeric amount nor a required note.

Source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:7–12,16–18`.

## Cancellation and recovery have a narrow evidence boundary

The visible mutation boundary is the append, not the client receiving `ok`.

- **Before the `end` callback runs:** body collection has not inserted anything. If an interrupted request never reaches that callback, this code never performs its insertion.
- **After insertion:** the array has changed before the response is ended. No rollback removes the entry if the client disconnects or fails to receive the response.
- **Retry after an uncertain response:** a retry that successfully completes appends another entry. There is no idempotency key or duplicate detection in this path.
- **Fresh process start:** the module initializes a new empty array. There is no supplied persistence or replay mechanism to restore earlier entries.

The server registers no explicit `aborted`, `close`, or request `error` handlers and no cancellation flag. These files therefore do not prove which events a particular disconnection will produce, how a client will observe it, or whether the process survives every failure. They also contain no restart supervisor or recovery policy.

Sources: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:1–25`; `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/package.json:1–6`.

## What the evidence says about rationale

The README describes MiniLedger as a “tiny personal expense-tracking demo app,” explicitly documents in-memory storage, and names POST as adding an expense and GET as listing entries. That supports explaining the shared array as the demo’s documented storage mechanism.

Source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/README.md:3–6`.

The sequence also has clear mechanical consequences: waiting for `end` lets the parser consume the accumulated body; appending before responding means the success path changes state before sending its acknowledgment. Those are explanations of what the implementation achieves. The supplied files do not document the author’s original reasons for choosing these details, omitting validation, or omitting recovery.

One README statement needs caution: it says adding an entry requires “five fields typed by hand.” The server reads only `amount` and `note`, generates `id` and `ts`, and supplies no UI evidence. That statement cannot establish this endpoint’s actual input requirements.

Sources: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/README.md:8`; `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:10–11`.

## Check yourself

1. POST A starts first, but POST B’s complete body is processed first. Which gets the next ID?
2. A client loses its connection without receiving `ok`. Can it safely conclude that no entry was added?
3. Does an empty body fail in the same way as malformed JSON?

---

**Answers**

1. B gets the next ID if its parsing and destructuring succeed. IDs are assigned at insertion time; arrival order does not reserve them.
2. No. The append precedes the response, so a missing acknowledgment does not establish a missing mutation. Retrying can add a duplicate.
3. No. An empty body falls back to `{}` and is inserted without `amount` or `note`. Malformed nonempty JSON throws before insertion, with no local error handling.
