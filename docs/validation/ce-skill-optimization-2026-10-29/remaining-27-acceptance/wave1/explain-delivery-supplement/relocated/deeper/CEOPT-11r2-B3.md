---
title: "From POST /entries to visible ledger state"
date: 2026-10-30
input_shape: concept
subject: "MiniLedger request handling, shared state, and failure boundaries"
---

# From `POST /entries` to visible ledger state

A POST changes the ledger only when its request body reaches the
`end` handler, parses successfully, and reaches `entries.push`.
A GET serializes the shared array as it exists when the GET handler
runs. Receiving the POST response is a separate event from changing
the array.

This explanation comes from static inspection of the supplied fixture.
The application was not executed or tested. Source pointers refer to
the inspected local files; no commit identity was established.

## The request-to-state path

```mermaid
sequenceDiagram
    participant P as POST client
    participant H as HTTP request handler
    participant B as POST-local body
    participant E as Shared entries array
    participant G as GET client

    P->>H: POST /entries
    H->>B: Initialize empty string
    Note over H,B: Register data/end listeners, then return
    P->>H: data chunks
    H->>B: Append each chunk
    Note over G,E: A GET before the push sees the earlier array
    P->>H: Request end
    H->>B: JSON.parse(body or "{}")
    alt Parsing and destructuring succeed
        H->>E: Push generated id, amount, note, timestamp
        H-->>P: res.end("ok")
        Note over H,P: Response call does not prove client receipt
        G->>H: GET /entries
        H->>E: JSON.stringify(entries)
        H-->>G: JSON array, application/json
    else Parsing or destructuring throws
        Note over H,E: Push and "ok" are not reached; no local catch
    end
```

The POST branch requires both `req.method === 'POST'` and
`req.url === '/entries'`. It creates a body string, registers two
listeners, and returns from the outer handler. That return prevents
fallthrough to the other routes; it does **not** end the response.
The later `end` callback does that.
See source [1], lines 5–14.

Each `data` event appends to this POST’s body string. Neither receiving
the headers nor receiving a body chunk adds an entry. The mutation
trigger is the `end` callback, after parsing and destructuring succeed.
See [1], lines 7–11.

The decisive ordering is explicit:

```javascript
const { amount, note } = JSON.parse(body || '{}');
entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
res.end('ok');
```

These consecutive statements parse the input, mutate the array, then
end the response. There is no asynchronous wait between them.
A GET handled before the push sees the earlier state; one handled
after it sees the newly appended entry, provided the process and array
remain available. POST arrival order alone does not determine entry
order: each POST waits for its own body to finish.
See [1], lines 9–18.

## Who owns each piece of state?

| State or action | Owner in this implementation | Observable consequence |
|---|---|---|
| Accumulated body string | One POST request’s closure | Incomplete bodies are not ledger entries. |
| `amount` and `note` | Extracted from the parsed body | Their values are accepted without business validation. |
| `id` | Server, using `entries.length + 1` | IDs follow append order in the current array. |
| `ts` | Server, using `Date.now()` | Timestamp is generated at insertion, not copied from the client. |
| Ledger array | Module-level `entries` binding | Requests handled by this server share the same in-memory collection. |
| GET representation | GET handler | It serializes the current array and sets `application/json`. |

The array is declared outside the request callback, so it survives across
requests within this module instance. Each POST’s body string is declared
inside its own request branch. This placement is what separates shared
ledger state from request-local buffering.
See [1], lines 3–8 and 16–18.

For example, with an initially empty array, the body
`{"amount":12,"note":"lunch"}` produces an entry with ID `1`, those two
values, and a server-generated timestamp. A subsequent GET returns a
JSON array containing that entry. The POST itself returns the text `ok`,
not the created entry. This is a source-derived example, not a captured
runtime response.

Both routes use exact URL equality. A URL such as
`/entries?limit=10` does not match either route and reaches the explicit
`404` / `not found` fallback.
See [1], lines 6, 16, and 21–22.

## Malformed JSON and missing validation

Malformed, nonempty JSON throws at `JSON.parse`. Because that statement
precedes `entries.push`, this request does not append an entry or reach
`res.end('ok')`. There is no `try/catch` or explicit error response in
the supplied handler. It would therefore be incorrect to describe this
as a controlled `400` response.
See [1], lines 9–13.

The parsing fallback handles only an empty body:

| Body | Source-derived outcome |
|---|---|
| `{"amount":12,"note":"lunch"}` | Appends both supplied values with a generated ID and timestamp. |
| Empty body | Parses `{}` and appends an entry whose `amount` and `note` are `undefined`. |
| Whitespace only | Remains a nonempty string; parsing throws. |
| `{"amount":` | Parsing throws before mutation. |
| `null` | Parsing succeeds, but destructuring `null` throws before mutation. |

For the empty-body case, JSON serialization omits the object properties
whose values are `undefined`, so GET exposes the generated `id` and `ts`
without `amount` or `note`. The source has no required-field check, amount
type check, or rejection of extra fields. Valid JSON is not equivalent to
a valid expense.
See [1], lines 10–11 and 18.

An uncaught exception can terminate a normally launched Node process.
The fixture establishes the missing local error handling, but it does
not establish a deployed process supervisor, external exception policy,
or the exact network symptom a client would observe.

## Cancellation and recovery: the evidence boundary

**A client disconnect is not an implemented rollback mechanism.**
The server registers `data` and `end` listeners, but no request-abort,
request-error, or response-close handling. It contains no cancellation
flag or operation that removes a just-added entry.
See [1], lines 5–23.

The useful boundaries are:

- **Before the `end` callback runs:** no entry has been added through this
  request’s code path. If an interrupted upload never reaches that
  callback, it cannot reach the push. The fixture does not demonstrate
  the exact event sequence for each transport failure.
- **After the push:** the array has changed even if the client never
  receives `ok`. No supplied code rolls the change back on response
  failure or disconnect.
- **Retry after an uncertain response:** another successfully processed
  POST appends another entry. There is no idempotency key or deduplication
  check, so retrying may duplicate an expense.
- **Process restart:** a fresh module initialization creates `[]`.
  There is no persistence or reload path in the supplied server.
  Previously stored entries are not recovered by this code, and IDs
  start over with the new array.

The distinction matters operationally: “the client did not receive
success” does not prove “the server did not change state.” A GET can
show the current collection if the server remains available, but the
protocol supplies no request-specific receipt that resolves every
uncertain retry. These are limits of the implementation, not evidence
of a tested cancellation or recovery guarantee.

## What rationale is actually evidenced?

The README describes MiniLedger as a “tiny personal expense-tracking
demo app” using Node.js and CommonJS, and explicitly says data is kept
in memory. The package metadata points to `src/server.js` as its main
file. Those facts support understanding this as a small demonstration.
See [2], lines 3–6, and [3], lines 2–5.

Using one array and two direct route branches makes the state flow easy
to follow; that is an observation about the design. The supplied files
do **not** document why the author chose append-time IDs, omitted
validation, or omitted persistence and cancellation handling. Demo scope
is compatible with those choices, but it does not establish the author’s
original reasons.

The README also says adding an entry requires five manually typed
fields. The supplied server only extracts `amount` and `note`, generates
`id` and `ts`, and does not require either input field. Without a supplied
UI, the five-field claim cannot be reconciled or treated as the HTTP
contract. See [2], line 8, and [1], lines 10–11.

## Source references

All pointers are repository-relative. Plain pointers are used because
the final document destination is caller-managed.

1. `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:1–25`  
   Inspected implementation: shared state at line 3; POST at lines 6–14;
   GET at lines 16–19; fallback at lines 21–22; listener at line 25.
2. `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/README.md:1–8`  
   Demo description, in-memory data statement, and stated rough edges.
3. `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/package.json:1–6`  
   Package identity and main-file declaration.

## Check yourself

1. A POST has delivered half its body when a GET is handled. Does that
   GET include the pending expense?
2. A client sends malformed JSON and receives no successful response.
   Can this implementation promise a `400` while preserving server
   availability?
3. A client misses the POST response and retries. Why might there now
   be two entries?

---

**Answers**

1. No. Body buffering does not mutate the ledger. The append happens
   only after the POST’s `end` callback successfully parses and
   destructures its body.
2. No. The failing request does not reach the push, but there is no
   local exception handler or controlled `400` response. Keeping the
   process alive is not guaranteed by the supplied code.
3. The original POST may already have appended before its response
   was lost. The retry performs another append; the server has no
   mechanism to recognize it as the same operation.


## Parent delivery navigation

This appendix was added by the parent during a separate delivery experiment. The original explanation above is preserved unchanged. These links are relative to this delivered file.

- [docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/README.md](../../../fixtures/explain/README.md)
- [docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/package.json](../../../fixtures/explain/package.json)
- [docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js](../../../fixtures/explain/src/server.js)
