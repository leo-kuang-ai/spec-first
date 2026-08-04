# Model Tiers

Read this when dispatching a sub-agent (the Phase 1.1 grounding scout, the Phase 2.6 claim verifier, or the opt-in Slack researcher). Sub-agent dispatch is tiered by task shape, never hardcoded to a model name:

- **Extraction tier** — the grounding scout: retrieval and quoting work. Request the cheapest capable tier only when `worker_model_override: supported`. "Capable" is part of the spec — escalate to the generation tier when the repo is large or the stack obscure.
- **Generation tier** — the claim verifier: evidence-driven mechanical verification. Request the balanced mid-tier only when `worker_model_override: supported`. If the override is unsupported or unknown, omit it and inherit rather than guessing.
- **Ceiling tier** — the dialogue itself. Questions, approaches, synthesis, and the requirements-only unified plan run in the main conversation on the orchestrator's model; nothing is dispatched for them.

**Degradation rule.** When `worker_model_override` is unsupported or unknown, dispatch the scout and verifier on the inherited model and keep their read budgets and output caps — cost control then comes from structure, not tiering. When `worker_dispatch_capability` is missing or unknown, do the topic scan inline at Phase 1.1 — still writing the grounding dossier to the scratch path, because downstream consumers (the Phase 2.6 verifier, the spec-plan handoff) receive that path — and verify claims inline before the Phase 3 write, with the same budgets.
