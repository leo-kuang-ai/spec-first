# Model Tiers

Read this when dispatching a sub-agent (a source-persona fetch subagent or a media-analyzer subagent). Sub-agent dispatch is tiered by task shape, never hardcoded to a model name:

- **Extraction tier** — the source-persona fetch workers: retrieval and quoting work (pulling items and their media paths out of a source connector). Request the cheapest capable tier only when `worker_model_override: supported`. "Capable" is part of the spec — escalate to the generation tier when the source is large or the connector obscure.
- **Generation tier** — the media-analyzer workers: evidence-driven mechanical work that turns downloaded frames and transcripts into a bug-report-shaped finding. Request the balanced mid-tier only when `worker_model_override: supported`. If the override is unsupported or unknown, omit it and inherit rather than guessing.
- **Ceiling tier** — the orchestrator's judgment. The decision round and plan reconciliation run in the main conversation on the orchestrator's model; nothing is dispatched for them.

**Degradation rule.** When `worker_model_override` is unsupported or unknown, dispatch the source-persona fetch and media-analyzer workers (Phase 2b, 2e) on the inherited model and keep their read budgets and output caps — cost control then comes from structure, not tiering. When `worker_dispatch_capability` is missing or unknown, run the source fetch and media analysis inline in the orchestrator — still downloading media to the scratch path and writing each analysis finding to its scratch artifact, because the wrap-up summary and plan reconciliation read those paths — with the same budgets.
