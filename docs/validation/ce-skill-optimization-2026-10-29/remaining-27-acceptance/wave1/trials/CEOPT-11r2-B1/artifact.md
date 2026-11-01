---
title: "How POST /entries becomes visible through GET /entries"
date: 2026-10-30
input_shape: concept
subject: "MiniLedger request lifecycle, shared state, and failure boundaries"
---

# How an entry becomes visible

A successful `POST /entries` appends one object to a shared in-memory
array. `GET /entries` serializes that same array. The mutation happens
after the POST request emits `end`, and **before** the server calls
`res.end('ok')`. Visibility therefore depends on the append, not on
whether the client receives the acknowledgement.

This explanation comes from static inspection of the supplied fixture.
The application was not executed or tested. References identify the
inspected local files; no commit identity was established.

## Source map

All references below refer to these repository-relative files:

- **[S] Server:** `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js:1–25`
- **[R] README:** `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/README.md:1–8`
- **[P] Package:** `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/package.json:1–6`

The README describes a Node.js/CommonJS expense-tracking demo, and the
package names `src/server.js` as its main file ([R]:3; [P]:5).

## The trigger and ownership boundaries

The server listens on port `3000`. It selects the POST branch only when
both `req.method === 'POST'` and `req.url === '/entries'`. This is an exact
URL comparison: `/entries?limit=10` does not match. Requests that match
neither supported branch receive status `404` and body `not found`
([S]:5–6, 16, 21–25).

Two different lifetimes matter:

| State | Owner and lifetime | Role |
|---|---|---|
| `body` | One POST handler invocation; retained by its event callbacks | Collects that request's incoming chunks |
| `entries` | Module scope, shared by this server's request handlers | Holds entries that subsequent GET handlers serialize |
| `req`, `res` | One HTTP request and response | Supply input events and carry the response |

The local buffer is created inside the POST branch; the array is created
outside the server callback ([S]:3, 5–9). GET has no separate database,
cache, or synchronization step.

```mermaid
sequenceDiagram
    participant C as POST client
    participant H as POST handler
    participant E as Shared entries array
    participant G as GET handler
    participant R as GET client

    C->>H: POST /entries
    Note over H: Create request-local body buffer
    C->>H: data events
    Note over H: Append each chunk to body
    C->>H: end event
    H->>H: Parse body and extract amount, note
    alt Parsing and extraction succeed
        H->>E: Push object with generated id and ts
        H-->>C: Call res.end("ok")
        R->>G: GET /entries
        G->>E: Read shared array
        G-->>R: JSON.stringify(entries)
    else Parsing or extraction throws
        Note over H: No local catch; push and "ok" are skipped
    end
```

## Ordering determines what a GET sees

The initial POST handler installs event listeners and returns. Receiving
the headers or a `data` event does not itself create an entry. Creation
occurs inside the later `end` callback ([S]:7–14).

The decisive code is short:

```javascript
const { amount, note } = JSON.parse(body || '{}');
entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
res.end('ok');
```

The append precedes the acknowledgement ([S]:10–12).

For a body such as `{"amount":12.5,"note":"Lunch"}`, the handler takes the
two supplied values, generates `id` from the current array length, and
generates `ts` with `Date.now()`. A subsequent GET sets
`content-type: application/json` and returns a JSON representation of
the array ([S]:10–11, 16–18).

Three consequences follow from this order:

1. **A GET handled while the POST body is still arriving can return the
   previous array.** Nothing has been appended yet.
2. **A GET handled after the append includes the new entry.** It does
   not wait for acknowledgement delivery to the POST client.
3. **Concurrent POSTs are ordered by their mutation callbacks, not
   necessarily by request arrival.** A request that starts first may
   finish receiving its body later. Within a successful callback, parsing,
   pushing, and calling `res.end` are synchronous statements with no
   asynchronous yield between them.

Each GET returns a serialized snapshot at its own handling time; it is
not a subscription to later changes ([S]:18).

## Malformed JSON and missing validation

Malformed, nonempty JSON throws at `JSON.parse`. The callback contains no
`try/catch`, so it does not append an entry or send `ok` on that path.
There is also no application-defined `400` response, error body, or
recovery handler in the supplied server ([S]:9–13).

An empty body is a different case: `body || '{}'` substitutes an empty
object, so the callback can append an entry whose `amount` and `note`
are `undefined`. JSON serialization omits those undefined-valued object
properties, leaving the generated `id` and `ts` visible in GET output
([S]:10–11, 18).

Syntactically valid JSON is not sufficient validation either. For
example, `null` parses but cannot be destructured as written, while an
object with incorrectly typed values is not rejected by any explicit
check. The code validates neither required fields nor their types.

An exception escaping this callback is not a controlled request error.
The fixture provides no evidence of an outer exception handler or
supervisor. Continued service or automatic restart must not be assumed;
neither was observed in this inspection.

## Cancellation and recovery stop at the evidence boundary

There are no request-abort, request-error, response-close, rollback,
persistence, or retry handlers in the supplied code ([S]:1–25).

- **Before `end`:** the only append is inside the `end` callback. If an
  interrupted request never reaches that callback, this code does not
  append its buffered partial body. The fixture alone does not establish
  the event sequence for every disconnect.
- **After the append:** there is no code that removes the entry if the
  response fails or the client disconnects. A missing acknowledgement
  therefore does not prove that the write failed.
- **On retry:** every successfully processed POST appends again. There
  is no idempotency key or duplicate detection, so retrying an ambiguous
  request can create a second entry.
- **On a fresh process start:** `entries` begins as `[]`. No load or
  replay mechanism restores earlier entries, and IDs begin again from
  the new array's length ([S]:3, 11).

The generated ID is consequently local to this array's lifetime, not
evidence of durable or globally unique identity.

## What explains the design—and what remains unknown

The README explicitly identifies the application as a tiny demo and
documents in-memory storage and the `{id, amount, note, ts}` entry shape
([R]:3–6). That supports the teaching model of one shared array.

Using the same array for both endpoints mechanically avoids a separate
read-model update. Treating simplicity as the author's motivation would,
however, be an inference: the supplied files contain no decision record
explaining why persistence, validation, cancellation handling, or
idempotency were omitted.

The README also says adding an entry requires “five fields typed by
hand” ([R]:8). The inspected server does not enforce that statement: it
extracts two fields and generates two more ([S]:10–11). No client is
supplied to reconcile the discrepancy, so the server is the evidence for
this request lifecycle.

## Check yourself

1. A POST has received half its body when a GET runs. Must that GET
   include the pending entry?
2. The POST client receives no `ok` and retries. Can the array contain
   two entries for the same intended expense?
3. Does malformed JSON produce the same behavior as an empty body?

---

**Answers**

1. No. The append is inside the `end` callback; receiving chunks alone
   changes only the request-local buffer.
2. Yes. The first append may have succeeded before acknowledgement
   delivery failed. A retry has no deduplication protection.
3. No. Malformed JSON throws before the append. An empty body substitutes
   `{}` and can create an entry without defined `amount` or `note`.
