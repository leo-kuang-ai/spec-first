---
title: "From POST body to GET-visible state in MiniLedger"
date: 2026-10-30
input_shape: concept
subject: "The supplied MiniLedger server's POST /entries → in-memory state → GET /entries lifecycle"
---

# From POST body to GET-visible state

A `POST /entries` makes an entry visible by appending to a shared,
in-memory array **after the request body ends and JSON parsing succeeds**.
A later `GET /entries` serializes that same array. The mutation happens
before the server calls `res.end('ok')`; receiving the acknowledgment is
not what makes the entry visible.

**Evidence boundary:** This explanation comes from reading the supplied
fixture. No application or tests were run. References identify the local
fixture bytes inspected, not a verified Git revision or deployed server.

All source references below are relative to this fixture root:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/`

## The lifecycle and its owners

```mermaid
sequenceDiagram
    participant P as POST client
    participant H as Request handler
    participant B as Per-request body
    participant E as Shared entries array
    participant G as GET client

    P->>H: POST /entries
    H->>B: Initialize body = ""
    loop Each request data event
        H->>B: Append chunk
    end
    Note over B,E: No entry has been appended yet
    P->>H: Request end event
    H->>B: Read body; JSON.parse(body or "{}")
    alt Parsing and field extraction succeed
        H->>E: Push id, amount, note, ts
        Note over H,E: State becomes visible here
        H-->>P: res.end("ok")
        G->>H: GET /entries
        H->>E: JSON.stringify(entries)
        H-->>G: JSON array; application/json
    else Parsing or field extraction throws
        Note over H,E: No push; no "ok"; no local error handler
    end
```

The diagram shows one successful ordering. A GET can also run while a POST
is still collecting its body; that GET will not include the pending entry.

| Owner | State or responsibility | Lifetime / boundary |
|---|---|---|
| Module | `entries = []` | Shared by requests handled by this server instance; memory only |
| Individual POST | `body` and its event callbacks | Separate buffer for each matching request |
| POST `end` callback | Parsing, field extraction, append, acknowledgment | Synchronous sequence once this callback runs |
| GET handler | Serialize current array and end response | Produces a response snapshot; does not mutate the array |

These ownership boundaries follow directly from the placement of
`entries` outside the request callback and `body` inside the POST branch
([`src/server.js`, lines 3–18](src/server.js#L3)).

## The trigger is body completion, not request arrival

The server registers an HTTP request callback and listens on port `3000`.
Only the exact combination of method `POST` and URL `/entries` selects the
write branch ([`src/server.js`, lines 5–6 and 25](src/server.js#L5)).

That branch first installs listeners:

```javascript
let body = '';
req.on('data', (c) => { body += c; });
req.on('end', () => {
  const { amount, note } = JSON.parse(body || '{}');
  entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
  res.end('ok');
});
return;
```

The `data` listener accumulates chunks. It does not parse them or update
`entries`. The `end` listener performs the actual write sequence
([`src/server.js`, lines 7–14](src/server.js#L7)).

The final `return` leaves the request callback after listener registration.
It prevents this POST from falling through to the `404` branch; it does
not cancel the listeners or send the response.

Inside the `end` callback, ordering matters:

1. Parse the collected body, substituting `'{}'` only when `body` is empty.
2. Extract `amount` and `note`.
3. Construct and append an entry. Its ID is the current array length plus
   one, and its timestamp is sampled with `Date.now()` during construction.
4. Call `res.end('ok')`.

There is no asynchronous pause between parsing, appending, and calling
`res.end`. With this implementation, another request callback does not
interleave between those statements. Two POSTs are appended in the order
their successful `end` callbacks execute—not necessarily the order their
requests first arrived.

## GET observes the append, not the acknowledgment

The read endpoint uses the same array:

```javascript
res.setHeader('content-type', 'application/json');
res.end(JSON.stringify(entries));
```

Source: [`src/server.js`, lines 16–19](src/server.js#L16).

For example, assume the server starts with an empty array and accepts:

```json
{"amount":12.5,"note":"Lunch"}
```

After the append, a GET serializes an array containing that entry, with
`id: 1` and the timestamp generated during the POST callback. The POST
response itself is only the text `ok`; it does not return the entry or ID.

A GET handled before the append sees the old array. A GET handled after
the append includes the new entry. Once `JSON.stringify(entries)` has
produced the response string, later writes do not update that already
constructed response.

No success status is explicitly assigned in either branch, so normal
responses use Node's default `200` status. The GET explicitly sets
`content-type: application/json`; the POST does not set a content type or
a `201` status. These are source-derived expectations, not observations
from a running application.

Routing is exact: `/entries?x=1` and `/entries/` do not equal `/entries`.
Requests that miss both branches receive `404` and `not found`
([`src/server.js`, lines 6, 16, and 21–22](src/server.js#L21)).

## Malformed JSON stops before mutation

A malformed nonempty body such as `{"amount":` causes `JSON.parse` to
throw. The push and `res.end('ok')` are later statements, so neither is
reached for that request.

There is no local `try/catch`, error response, or error listener in this
server. The fixture therefore does **not** establish a controlled `400`
response or continued service after malformed JSON
([`src/server.js`, lines 5–23](src/server.js#L5)).

Under ordinary Node execution with no surrounding uncaught-exception
handler, this uncaught exception can terminate the process. The supplied
files show no such recovery handler. They do not establish what a
supervisor, wrapper, or client would do, so a particular client-visible
failure or automatic restart cannot be promised.

Parsing also is not validation:

| Body | Source-derived consequence |
|---|---|
| Empty body | Falls back to `{}`; appends an entry with undefined `amount` and `note` |
| Whitespace only | Remains nonempty; parsing throws |
| `{}` | Parses; appends with undefined `amount` and `note` |
| `null` | Parses, but destructuring throws before append |
| `{"amount":"twelve"}` | Appends a string amount; there is no type validation |

Undefined object properties are omitted by JSON serialization. Thus an
entry created from `{}` has `amount` and `note` properties in memory, but
its GET representation contains only `id` and `ts`. This follows from the
unvalidated extraction and subsequent `JSON.stringify`
([`src/server.js`, lines 10–11 and 18](src/server.js#L10)).

## Cancellation and recovery have narrow guarantees

**Before the `end` callback executes:** the request has not changed the
array. If an interrupted upload never reaches that callback, it cannot
append through this code path. However, there are no explicit
`aborted`, `close`, or `error` handlers; the fixture does not establish
a graceful cancellation response or stream-error recovery.

**After the append:** there is no rollback. A client disconnecting or
failing to receive `ok` does not cause this code to remove the entry.
Calling `res.end` is not proof that the client received the response.

This creates an ambiguous retry case: if a write succeeded but its
acknowledgment was lost, retrying the same body can append another entry.
There is no idempotency key or duplicate check in the POST branch
([`src/server.js`, lines 7–13](src/server.js#L7)).

**After process loss:** a fresh evaluation starts with `entries = []`.
The README explicitly describes in-memory storage, and the source
contains no persistence, restoration, or replay path
([`README.md`, line 6](README.md#L6);
[`src/server.js`, line 3](src/server.js#L3)).
A restarted instance therefore cannot recover the old array from these
files. IDs begin again from the new array length; they are not durable
identifiers across restarts.

These limits distinguish three different events: accepting a write into
memory, attempting an acknowledgment, and durably retaining data. This
server implements the first two; the fixture provides no durable storage.

## What the evidence says about rationale

The README calls MiniLedger a “tiny personal expense-tracking demo app”
and identifies the two endpoints and in-memory entry shape
([`README.md`, lines 3–6](README.md#L3)). That is documented product context.

The code also supports a mechanical explanation: waiting for `end`
allows parsing the accumulated body, and keeping the array outside the
request callback allows separate requests to share state. These explain
how the implementation works.

It is reasonable to infer that this small implementation suits a demo.
It would be speculation to claim the author deliberately selected it for
performance, consciously rejected a database, or considered cancellation
and recovery unnecessary. No decision record or explanatory code comment
in the supplied fixture establishes those original reasons.

The README's statement that adding an entry requires “five fields typed
by hand” is not an API validation rule. The handler extracts only `amount`
and `note` and generates `id` and `ts` itself. No supplied UI source
explains that discrepancy ([`README.md`, line 8](README.md#L8);
[`src/server.js`, lines 10–11](src/server.js#L10)).

## Check yourself

Before reading the answers, reason through these cases:

1. POST A starts first but uploads slowly. POST B finishes its body first.
   Which receives the earlier ID?
2. A client loses its connection after the server appends an entry but
   before the client receives `ok`. Is retrying guaranteed to be safe?
3. Does an empty body behave like malformed JSON?

---

**Answers**

1. B receives the earlier ID if B's successful `end` callback executes
   first. Arrival order does not reserve an ID; the append uses the array
   length at that moment.
2. No. The existing entry is not rolled back, and a retry can create a
   duplicate. A missing acknowledgment does not prove the write failed.
3. No. An empty body becomes `'{}'` and is accepted without field
   validation. Malformed nonempty JSON throws before mutation; no local
   handler converts that exception into a controlled response.
