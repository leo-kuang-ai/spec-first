---
title: "Notification Preference Delivery - Requirements"
type: feature
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: spec-plan-consumer-replay-fixture
execution: code
---

# Notification Preference Delivery - Requirements

## Goal Capsule

| Dimension | Decision |
| --- | --- |
| Objective | Honor each user's notification preference while preserving reliable delivery evidence. |
| Authority hierarchy | Existing notification preference state and event intake contracts are authoritative. |
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
