---
title: "Notification Preference Delivery - Plan"
type: feature
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-consumer-replay-fixture
execution: code
---

# Notification Preference Delivery - Plan

## Goal Capsule

| Dimension | Decision |
| --- | --- |
| Objective | Honor each user's notification preference while preserving reliable delivery evidence. |
| Recommended approach | Compose the existing event intake and notification dispatch capabilities through bounded thin glue. |
| Authority hierarchy | Existing notification preference state and event intake contracts are authoritative. |
| Decision focus | Keep orchestration separate from notification policy and subscription state. |
| Verification focus | Preference enforcement, retry dedupe, terminal failure, and evidence integrity. |
| Largest risk or boundary | A retry must not create duplicate delivery or bypass a preference change. |

## Product Contract

### Summary

The system must consume the existing event intake, resolve the current notification preference, avoid duplicate delivery, and retain delivery evidence without creating a second preference truth.

### Actors

- A1. Notification recipient: owns the notification preference that controls eligible channels.
- A2. Support operator: inspects delivery evidence without changing subscription state.

### Requirements

- R1. Resolve the current notification preference before dispatch and fail closed when the preference cannot be read.
- R2. Prevent duplicate delivery when the existing event intake retries the same event.
- R3. Record delivery evidence that links the event, chosen channel, outcome, and terminal failure without becoming subscription state.

### Key Flows

- F1. Eligible delivery: existing event intake receives an event, current preference permits a channel, one delivery occurs, and delivery evidence records the result.
- F2. Retry or preference change: the same event is retried or the preference changes before dispatch; the system deduplicates or suppresses delivery and records the decision.

### Acceptance Examples

- AE1. Given an event whose current notification preference allows email, one email is sent and one delivery evidence record is queryable.
- AE2. Given a retried event or a preference changed to disabled before dispatch, no duplicate delivery occurs and the evidence explains the suppression.

## Planning Contract

### Key Technical Decisions

- KTD1. Choose `compose / thin-glue`: reuse the existing event intake and notification dispatch owners, connected by a notification-delivery orchestrator. Thin glue owns only contract translation, sequencing/orchestration, failure/degradation routing, and observability/evidence aggregation. It must not own notification policy, subscription state, or a parallel durable event pipeline.
- KTD2. Use the existing event identifier as the idempotency key and record terminal suppression or failure in the existing delivery evidence owner.

### Sequencing

1. Extend the existing delivery evidence representation only where R3 needs a missing outcome.
2. Compose the existing capabilities through the thin orchestrator.
3. Verify F1 and F2 before enabling the path.

## Implementation Units

### U1. Compose notification delivery

**Goal:** Implement the bounded orchestration seam without duplicating domain truth.

**Requirements:** R1, R2, R3

**Dependencies:** None

**Approach:** Reuse preference lookup, event intake, notification dispatch, and delivery evidence owners; add only the sequencing and failure routing described by KTD1.

**Verification:** Exercise AE1 and AE2 through the real event-to-dispatch chain.

## Verification Contract

- Verify R1 by changing the notification preference immediately before dispatch and observing fail-closed suppression.
- Verify R2 by replaying the same event identifier and observing one delivery.
- Verify R3 by checking success, suppression, and terminal failure delivery evidence.

## Definition of Done

- [ ] AE1 and AE2 pass through the composed production path.
- [ ] The orchestrator contains no notification policy or subscription state.
- [ ] Duplicate delivery and terminal failure behavior are covered by tests.
