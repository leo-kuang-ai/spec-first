# Enterprise Plan Review

Use this reference as a conditional readiness lens for `Standard` or `Deep` plans that touch high-risk production behavior. It makes plan-time decisions explicit without turning `spec-plan` into an enterprise workflow or a default large template.

Load this reference when the user request, origin document, source evidence, or planned implementation units hit one of the triggers below. Lightweight CRUD and single-file internal changes default to no enterprise appendix unless a trigger is present.

## Trigger Matrix

| Trigger | Signals | Required plan-time decision |
| --- | --- | --- |
| Money / ledger / payment | balances, invoices, refunds, settlement, reconciliation, irreversible financial effects | State the invariant, idempotency boundary, audit trail, failure handling, and rollback or compensation path. |
| Authentication / authorization / permissions / audit / sensitive data | authz checks, role changes, token handling, PII, audit log, security-sensitive state | State the actor, permission rule, enforcement point, audit/privacy boundary, and denial behavior. |
| Privacy / personal-data flow | logs, analytics, third-party transfer, client collection, exports, caches, telemetry, retention, masking, minimization | State the data categories, collection or transfer path, minimization or masking posture, retention boundary, and compliance or owner-visible verification. |
| High QPS / large data / long-running work | hot path, batch processing, pagination, bulk export, expensive query, capacity risk | State expected scale, latency or throughput assumption, limiting strategy, and observability signal. |
| Cross-service RPC / MQ / async event | queue, webhook, outbox, consumer, retry, distributed side effect | State contract, idempotency key, retry policy, poison/final failure path, and ordering or dedupe assumption. |
| State machine / compensation / dead state | lifecycle transition, cancellation, rollback, partial completion, stuck jobs | State allowed transitions, terminal states, compensation path, and dead-state recovery. |
| DDL / data migration / irreversible change / cache consistency | schema change, backfill, reindex, cache invalidation, data shape migration | State migration sequence, backup or rollback posture, backfill strategy, consistency window, and verification query. |
| Data / ML consistency | derived data, offline/online parity, feature pipeline, training/inference compatibility, schema evolution, recompute, drift-sensitive data | State source of truth, compatibility window, backfill or recompute path, online/offline consistency check, and verification metric or query. |
| Background scheduled task | cron, worker schedule, recurring cleanup, delayed execution | State idempotency, overlap protection, monitoring, failure alerting, and catch-up behavior. |
| Rollout / rollback / feature flag | staged launch, risky config, release gate, customer-visible behavior change | State flag or gate, rollout criteria, rollback condition, and owner-visible success/failure signal. |

If a trigger is present but the plan intentionally defers a decision, the plan must put it in `Open Questions` or `Deferred to Implementation` with a concrete owner, unblock condition, or verification target.

## Required Appendix by Trigger

Use appendices only when they make the plan easier to review:

- **Enterprise Risk Appendix** - Use for several high-risk triggers or when the same invariant spans multiple units.
- **API Contract Appendix** - Use for request/response schema, exported type, event, webhook, RPC, or versioning changes.
- **Data Migration & Rollback Appendix** - Use for DDL, backfill, irreversible data changes, cache consistency, or production data transformation.
- **Scheduled Job Appendix** - Use for recurring jobs, delayed workers, cleanup tasks, retries, or catch-up behavior.
- **Requirements Coverage Matrix** - Optional for PRD-grade origins; map origin item -> plan section / U-ID / coverage. `not covered` without an explanation moves to `Open Questions` or blocker.

Do not add these appendices to Lightweight plans that do not hit a trigger.

## Hard Gates

These are plan-time completeness gates. They do not let scripts decide semantic adequacy; scripts may only verify anchors, files, source refs, and fixture shape.

The plan must trigger deepening, move the issue to `Open Questions`, or block handoff when any of these are true:

1. PRD or review-origin functionality is not covered and the omission has no explanation.
2. Money, security, auth, permission, audit, or sensitive-data behavior is named but not designed in enough detail to implement.
3. Data migration, backfill, irreversible write, or cache consistency work lacks backup, rollback, or verification posture.
4. High-risk rollout lacks a feature flag, rollout gate, rollback condition, or owner-visible success/failure signal.
5. Retry, async, scheduled, or cross-service work lacks a final failure path such as poison queue, dead-letter handling, compensation, or explicit manual recovery.

## Review Rubric

High-risk plans must answer these review checks in the relevant plan sections:

- **Explicit trade-off for high-risk KTDs:** The plan states what the chosen design buys, what it sacrifices, and why rejected alternatives are not used.
- **Privacy beyond DB fields:** Personal-data flows through logs, analytics, third parties, clients, exports, caches, and telemetry are named when present, with minimization, retention, masking, or compliance boundaries.
- **Data / ML consistency:** Data or ML-affecting changes state schema evolution, backfill, online/offline consistency, compatibility windows, and verification. ML-specific model, feature, training, or drift concerns remain explicit opt-in follow-up unless current source evidence shows they are in scope.

## Specialist Reuse

Reuse existing specialists during deepening; do not create enterprise-specific agents by default:

- API contracts -> inline API contract checklist in this reference; do not depend on a top-level agent.
- Security, authorization, privacy, exploit surfaces -> `references/agents/security-sentinel.md`
- Persistent data safety and lifecycle -> `references/agents/data-integrity-guardian.md`
- Migration, backfill, production data transformation -> `references/agents/data-migration-reviewer.md`
- Capacity, latency, throughput -> `references/agents/performance-oracle.md`
- Rollout, rollback, launch verification -> `references/agents/deployment-verification-agent.md`

## Non-Goals / Policy Boundary

- Do not create a separate enterprise workflow.
- Do not make enterprise appendices mandatory for all plans.
- Do not add privacy or data/ML specialist agents unless real usage proves the existing specialists are insufficient.
- Do not script semantic closure of money, security, migration, rollout, or retry risk.
- Do not encode organization-specific forbidden technology lists, compliance policies, or internal controls in this generic skill.
- Do not treat generated runtime mirrors as source.

If a repository later provides project-specific policy, consume it as advisory or source input according to its own contract. This reference only reserves the boundary; it does not define the policy path, schema, or CLI integration.
