# Backend / Mid-platform Service Surface Template

> Used in combination with `00-generic.md`. Here only defines observable product states, business contracts, consistency, compatibility, failure outcomes, and operational readiness—without specifying interface fields, database schema, middleware, or service decomposition.
>
> All human-related questions are only directed to the currently executing conversation user. Industry rules are enhanced via corresponding overlay only after explicit matching occurs.

## Backend property confirmation

| Dimension | content |
| --- | --- |
| Business capability | |
| main actor / consumer | User / Admin / Other Services / External Systems |
| Main business objects | |
| Invocation pattern | Synchronous / Asynchronous / Batch Processing / Event-driven (describing product timing) |
| Compatibility Scope | Old client / Old caller / Old data / Third-party |
| Does it involve funds, privacy, or irreversible data | |

## State semantics

| Status | Product meaning | Entry conditions | Executable actions | Available state | User / consumer visible results |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Define the product semantics for final state, reversibility, cancellation/revocation, expiration, failure, duplicate events, and unknown states, without describing the internal state machine implementation.

## Business atomicity and consistency boundary

| Business operations | A result that must succeed together | Partially successful result | Product status after failure | Retry expectation |
| --- | --- | --- | --- | --- |
| | | | | |

For product-level idempotency involving repeated requests, concurrent updates, or asynchronous messages: repeated execution must not produce duplicate business outcomes, and the user/consumer must be able to identify the final state.

## Producer/Consumer contract expectations

| Producer | Consumer | Business event / Request | Success result | Failure result | Timeliness | Compatibility Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

The PRD defines the product meaning and essential information for fields, but does not specify the actual field names, types, protocols, or version implementations.

## Errors and degradation semantics

| Scenario | What does the consumer receive? | What does the user see | Can it be retried | Degradation result | Does manual processing be required? |
| --- | --- | --- | --- | --- | --- |
| Downstream unavailable | | | | | |
| Timeout | | | | | |
| Repeated request | | | | | |
| State conflict | | | | | |
| Partial success | | | | | |

## Batch processing, reconciliation, and compensation

When handling batch processing or asynchronous consistency, specify: processing window, data scope, completion criteria, re-execution, failure list, manual intervention, and consumer-visible status after compensation.

## Configuration and Take Effect

| Configuration capabilities | Product meaning | Default behavior | Scope of effect | Effectiveness period | Not configured / Invalid value result |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Define only product behavior, without specifying the configuration center, key, or read implementation.

## Historical versions and existing data

| Object | Previous behavior / Data | New behavior | Whether to migrate | Result when not migrated | Result after rollback |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Security, Auditing, and Data Boundaries

List of product constraints for authorization, sensitive data, export, auditing, retention, and deletion. When involving professional or regulatory rules, cite the project source or industry overlay, and retain unconfirmed items.

## Availability and Operations Readiness

| Dimension | Product Requirements / Observable Scope |
| --- | --- |
| Key Usage Window | |
| Acceptable delay | |
| Impact on downgraded users | |
| Business actions after alarm | |
| Rollback / backfill impact | |
| Supports manual handling | |

## Backend supplementary acceptance

- Legal state transitions, illegal transitions, duplicate events, and concurrent updates.
- Downstream failure, timeout, partial success, and retry.
- Old caller, old data, and rollback path.
- Batch processing re-execution, failure logs, and compensation results.
- Product-level idempotency and observable final state.

## Backend pending issues for closure candidacy

Here it only prompts candidate gaps and does not generate a second set of OQ schema. Issues affecting product state, error outcomes, compatibility, source-of-truth, default behavior, or consumer-visible contracts should be moved to the output contract's canonical `Outstanding Questions`; caching, databases, messaging systems, and code splitting should be moved to `spec-plan`.
