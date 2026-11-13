---
title: "From POST /entries to shared in-memory state"
date: 2026-10-30
input_shape: concept
subject: "MiniLedger request lifecycle, state ownership, and failure boundaries"
---

A successful `POST /entries` changes the server’s shared `entries` array **after the request body finishes arriving and before the server calls `res.end('ok')`**. A subsequent `GET /entries` serializes that array. Receiving a POST request alone does not add an entry.

This explanation comes from static inspection of the supplied fixture. The application was not executed, and no behavior was tested. This document is returned for parent-mediated saving; the authoring agent did not write a file.

## The request lifecycle

The server uses Node’s `http` module and listens on port `3000`. Its POST branch matches both the exact method and exact URL: `POST /entries`. A URL such as `/entries?view=all` does not match either endpoint and falls through to the explicit `404` response. See [server source, lines 1–6 and 21–25][server].

```mermaid
sequenceDiagram
    participant Client
    participant Handler as HTTP request handler
    participant Body as POST body callbacks
    participant State as Shared entries array

    Client->>Handler: POST /entries
    Handler->>Body: Register data and end listeners
    Note over Handler,Body: Handler returns; listeners remain registered
    Client->>Body: Body chunks
    Body->>Body: Append chunks to request-local body
    Client->>Body: Request body ends
    Body->>Body: Parse JSON and extract amount, note
    alt Parsing and destructuring succeed
        Body->>State: Push id, amount, note, ts
        Body-->>Client: End response with "ok"
        Client->>Handler: GET /entries
        Handler->>State: JSON.stringify(entries)
        Handler-->>Client: JSON response
    else Parsing or destructuring throws
        Note over Body,State: Push and "ok" are skipped; no local recovery handler
    end
```

The POST branch creates a separate `body` string for each request. Each `data` callback appends a chunk. The mutation occurs in the `end` callback:

```javascript
req.on('end', () => {
  const { amount, note } = JSON.parse(body || '{}');
  entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
  res.end('ok');
});
```

This is the actual implementation at [server lines 9–13][server]. Its ordering matters:

1. Parse the accumulated body and extract `amount` and `note`.
2. Compute an ID from the array’s current length and a timestamp from `Date.now()`, then append the entry.
3. End the response with the text `ok`.

There is no asynchronous wait between parsing, appending, and ending the response. Under ordinary Node callback execution, another request callback does not interleave within this synchronous sequence. However, overlapping POST requests can finish receiving their bodies in a different order from their arrival. Their IDs follow append order, not necessarily connection or request-arrival order.

## Who owns what

| State or action | Owner and lifetime | Observable consequence |
|---|---|---|
| `body` | One POST handler invocation; retained by its callbacks | Incoming chunks from different requests are accumulated separately. |
| `entries` | Module-level array shared by this server instance | Successful POST callbacks contribute to the same GET result. |
| `id` | Generated when the entry is appended | IDs start at `1` and increase with array length in this implementation. |
| `ts` | Generated during append using `Date.now()` | It records server-side append time in milliseconds, not client submission time. |
| Response | The request’s `res` object | POST returns `ok`; GET returns JSON; unmatched routes return `404`. |

The array is declared once at [server line 3][server]; request-local accumulation is at [lines 7–8][server]. The README explicitly describes the data as in memory ([README line 6][readme]).

There is no database write, file write, queue, or separate read-model update in this fixture. GET reads the same array directly:

```javascript
res.setHeader('content-type', 'application/json');
res.end(JSON.stringify(entries));
```

See [server lines 16–19][server]. A GET handled before a POST’s append sees the earlier contents; one handled after the append includes the new entry. The response is a serialized snapshot, so an already-produced GET response does not change when later POSTs arrive.

For example, starting from an empty array, a completed POST with:

```json
{"amount":12.5,"note":"Lunch"}
```

produces an entry with `id: 1`, those two supplied values, and a server-generated numeric `ts`. The POST response itself does not return that entry or ID.

## Malformed JSON and missing validation

Malformed, nonempty JSON throws at `JSON.parse`, before the append. That request therefore reaches neither `entries.push` nor `res.end('ok')`. There is no `try/catch`, explicit error response, or recovery path in the supplied server ([lines 9–13][server]).

Under ordinary Node execution, an uncaught exception in this callback can terminate the process. That is a runtime implication, not an observed trial result. The fixture does not establish any external exception handler or process supervisor, and it does not justify promising a clean `400` or `500` response.

An empty body behaves differently: `body || '{}'` substitutes an empty object, allowing an entry with undefined `amount` and `note` to be appended. JSON serialization omits those undefined object properties, so GET exposes its `id` and `ts` without those fields. Whitespace-only input remains nonempty and fails parsing.

Parsing is also not validation. There are no checks for required fields, numeric amounts, or note types. Valid JSON `null` parses successfully but throws when destructured, likewise preventing the append.

## Cancellation and recovery boundaries

**A disconnected client does not imply that no entry was added.** The implementation has no abort, close, or error listeners that roll back state or explicitly cancel work.

If the POST’s `end` callback never runs, this append path is not reached. If it runs successfully, the array is changed before the response is ended. A client can therefore fail to receive confirmation even though the entry was added. The source alone does not establish the precise event sequence for every disconnect or response failure.

There is no idempotency key or duplicate detection. Retrying after an uncertain outcome can append a second entry if the first attempt already appended and the same server instance remains alive.

There is also no persistence or replay mechanism. A fresh process initializes `entries` to `[]`; previous contents and ID progress are lost. Automatic restart, durable recovery, and multi-process sharing are not evidenced by this fixture.

## What explains the design—and what does not

The README calls MiniLedger a “tiny personal expense-tracking demo app,” names the two endpoints, and explicitly states that storage is in memory ([README lines 3–6][readme]). Those statements support explaining this as a small demo with direct shared-state access.

They do not establish why the original author chose callback accumulation, omitted validation, or avoided persistent storage. Simplicity is an observable property here; it is not evidence of the author’s specific reasoning.

The README’s rough-edge note says entry creation requires five fields typed by hand ([line 8][readme]). The supplied server extracts only `amount` and `note` and generates `id` and `ts`. No interface is supplied to reconcile that note, so it cannot define this endpoint’s implemented input requirements.

Source links below are relative to the supplied repository. No Git identity, dirty-state audit, external research, or independent scout review was performed within this bounded read-only scope.

[server]: docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/src/server.js
[readme]: docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/explain/README.md

## Check yourself

1. A POST has delivered half its body when GET is handled. Does GET include the pending entry?
2. A client loses the connection before receiving `ok`. Is retrying guaranteed to create exactly one entry?
3. Do malformed JSON and an empty body follow the same path?

---

**Answers**

1. No. Accumulation has started, but the append occurs only in the POST’s `end` callback after successful parsing and destructuring.
2. No. The first request may already have appended. There is no deduplication or rollback mechanism, so a retry can duplicate it.
3. No. Malformed JSON throws before mutation; an empty body becomes `{}` and can create an entry whose GET representation contains only `id` and `ts`.
