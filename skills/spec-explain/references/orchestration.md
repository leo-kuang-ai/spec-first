# Orchestration

Read before the first blocking question, dispatch, or run-directory creation. This reference owns interaction and model tiers; the entrypoint owns dispatch authority, scratch creation, and grounding. Phase 4 capability detection, menu sizing, actions, and closeout live in `references/destinations.md`.

## Interaction

Use a question tool whose live schema and current mode support the required interaction. Discover a deferred schema when needed; an unloaded schema alone does not prove absence. Examples include `AskUserQuestion` and `request_user_input`, but the current host's actual tools decide availability. Respect the host's supported option count. If the available tools cannot express a required question, ask one concise question in chat and wait. Never treat silence as an answer or skip a required choice. Routine choices already delegated by the user need no repeated approval.

## Model tiers and fallback

- **Extraction tier:** recap and current-repo grounding scouts gather and quote evidence. Request the cheapest capable tier only when `worker_model_override: supported`; otherwise inherit.
- **Ceiling tier:** composition, check-in reasoning, and corrections remain with the current orchestrator; do not dispatch them.

The entrypoint's Dispatch Authorization Boundary controls whether dispatch is permitted and proven available. Keep the scout's read budget in every fallback. For an authorized launch, treat a concurrency or active-agent limit as backpressure and retry after capacity becomes available. Correct an invalid invocation before classifying a persistent launch failure; then execute the same bounded scan inline and disclose the failure. Never describe inline work as independent coverage.

## Grounding and destinations

Use Phase 2's private scratch block only after intake admits an artifact-producing run. It creates run-local scratch, not durable storage. Match evidence to the resolved input shape; external concepts skip repository grounding and model-only explanations carry the unverified label. Read `CONCEPTS.md` only when canonical vocabulary matters. For recap, pass the resolved window, target repo, and scratch path to the bounded evidence pass before interpreting activity.

Load `references/destinations.md` before presenting a destination menu. Detect live capabilities and size the menu to the current schema; local file and Leave it remain available. An explicit user destination bypasses unnecessary destination selection, but does not grant an unrelated external side effect. Keep the canonical artifact recoverable when a capability is absent or a publication is declined.
