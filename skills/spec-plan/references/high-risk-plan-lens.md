# High-Risk Plan Lens

Read this reference when the request, Product Contract, or current source indicates high-impact production behavior. It is a semantic readiness lens: scripts may verify paths, anchors, and fixture shape, but the LLM judges whether the decisions are applicable and sufficient.

## Trigger Matrix

| Trigger | Plan-time decisions that must be explicit |
| --- | --- |
| Money, ledger, billing, refund, settlement, irreversible write | invariant, idempotency boundary, audit trail, failure handling, compensation or rollback |
| Authentication, authorization, permissions, audit, sensitive data | actor, permission rule, enforcement point, denial behavior, audit/privacy boundary |
| Privacy or personal-data flow through logs, analytics, clients, exports, caches, telemetry, or third parties | data categories, collection/transfer path, minimization or masking, retention, owner-visible verification |
| High QPS, large data, long-running work, bulk export | expected scale, limiting strategy, latency/throughput posture, resource bound, observable signal |
| Cross-service RPC, webhook, queue, MQ, retry | contract, idempotency/dedupe, retry policy, ordering assumption, final failure/manual recovery |
| Scheduled or recurring background job | idempotency, overlap protection, schedule/catch-up behavior, monitoring/alerting, final failure/manual recovery |
| State machine, cancellation, compensation, partial completion, dead state | allowed transitions, terminal states, compensation, stuck/dead-state recovery |
| DDL, migration, backfill, reindex, cache consistency, irreversible data change | sequence, compatibility window, backup/rollback, backfill posture, verification query or check |
| Data/ML schema or derived-data consistency | source of truth, schema evolution, recompute/backfill, online/offline consistency, compatibility window, verification metric |
| Rollout, feature flag, external integration, customer-visible operational risk | rollout gate, success/failure signal, owner, rollback trigger, support/runbook impact |
| CI, build, deploy, or release control whose output or fidelity affects production | production build context, stand-in fidelity and gaps, artifact/config parity, failure signal, production proof |

## Required Landing

Each applicable decision must land in the Product Contract, Planning Contract/KTD, Implementation Unit, System-Wide Impact, Risks, Verification Contract, Definition of Done, or an explicit Open Question/Deferred item. Vague phrases such as “handle errors”, “add monitoring”, or “consider rollback” do not close the lens.

If information is missing:

- ask the current user when the answer changes product behavior, authorization, irreversible risk, or success criteria;
- record a planning assumption only when the risk is bounded and the assumption is visible;
- defer only with an owner, unblock condition, or verification target;
- keep `artifact_readiness` below `implementation-ready` while a launch-blocking risk question remains.

## Production Readiness Decisions

Apply this branch when the change affects shipped runtime behavior, a production build/deploy path, an external rollout, or an operational control. A docs-only correction or non-production config-only edit stays lightweight unless direct evidence shows that it changes one of those surfaces.

- Start with the on-call questions: what failure must be detected, who responds, what decision they need to make, and which recovery action is available. Choose metrics, traces, and logs only after those questions are explicit.
- For every selected signal, state its purpose, owner, correlation propagation, cardinality and privacy boundary, and telemetry proof. Proof covers emission plus the query, dashboard, or alert path that demonstrates the signal is usable; “add monitoring” is not enough.
- A CI or staging stand-in names how its build context, artifact, feature flags, environment, dependencies, and execution path match production. Any known fidelity gap requires separate production-path proof instead of treating a green stand-in as field evidence.
- A feature flag names its safe default, owner, cohort, success and failure signals, rollback trigger, and removal condition. A flag name alone is not a rollout or rollback plan.
- A staged rollout names entry and exit criteria, observation window, operational owner, support impact, rollback action, and runbook. Alerts must identify an actionable threshold or condition, an owner, and the response the runbook enables.

## Review Checks

- High-risk KTDs state what the choice buys, what it sacrifices, and why a rejected alternative lost.
- Cross-layer failure paths name cleanup, retry, compensation, or idempotency behavior.
- Privacy review follows data beyond database fields into logs, analytics, clients, exports, caches, and third parties.
- Migration and rollout sections name compatibility/rollback windows and owner-visible proof.
- Verification matches the claim: unit tests alone do not prove integration, migration, rollout, or operational safety.

## Specialist Reuse

Use the smallest applicable skill-local prompt asset during authorized deepening:

- API/design boundaries → `architecture-strategist`
- auth, permission, privacy, exploit surface → `security-sentinel`
- persistent data, migration, consistency → `data-integrity-guardian`
- capacity, latency, throughput → `performance-oracle`
- rollout, rollback, launch verification → `deployment-verification-agent`
- agent/tool/context/approval parity → `agent-native-planning-strategist`

Do not create a high-risk-specific workflow or specialist by default. Do not add a fixed enterprise appendix to every plan. Lightweight work that does not hit a trigger stays lightweight.
