## Scenario Fingerprint Routing

When `.spec-first/workspace/scenario-fingerprint.json` or `.spec-first/workspace/scenario-fingerprint-setup.json` is already present, treat it as advisory deterministic context for guide mode and entry routing. Prefer the bootstrap layer (`developer-scenario-fingerprint.v1`) over the setup layer (`developer-scenario-fingerprint-setup.v1`). If only the setup layer exists, use it with the limitation that bootstrap-only fields are unavailable. Do not run setup, clean, external-tool commands, or runtime regeneration just to create a fingerprint from this entry governor.

Scenario fingerprints are not gates, approvals, or source scope authority. Read their independent dimensions and scenario class as routing evidence for the current user intent; do not collapse them into a single risk score. The route output still remains one entrypoint, one reason, and one next action.

Use this compatibility rule before the priority checks:

- If the fingerprint is missing and setup artifacts exist, add one advisory line that rerunning `spec-mcp-setup` will refresh the workspace scenario fingerprint, then continue normal routing by user intent.
- If the fingerprint is missing and no setup artifacts exist, recommend `spec-mcp-setup` for setup/readiness or "what next?" requests. For clearly lightweight work, route by intent and mention missing scenario evidence only when it affects trust in setup/MCP facts.

Apply these scenario-aware checks in priority order, then fall back to the ordinary Routing Rules:

1. `state_class=foreign-residual-workspace` or non-empty `foreign_residual_indicators[]`: route to the current repair owner before downstream work. Recommend `spec-first clean --workspace-orphans` as the preview-first inspection step, then `spec-first clean --workspace-orphans --confirm` only when the user explicitly wants to delete the quarantined parent artifacts; pair cleanup with `spec-first init` or `spec-mcp-setup` when setup facts or generated runtime guidance must be refreshed.
2. `state_class=first-time-git-repo`: recommend `spec-mcp-setup` when the user is asking for setup/readiness or wants durable setup facts before downstream work.
3. `complexity_dimensions.git_alignment_broken=true` and the user is asking for impact analysis, review, refactor, or cross-module reasoning: disclose the coverage blind spot and prefer bounded direct reads; do not claim full workspace coverage.
4. `complexity_dimensions.worktree_dirty_source_affecting=true` and the user is asking for commit, PR, review, or impact: mention the bounded dirty path sample when present and ask the selected downstream workflow to disclose dirty evidence.
5. None of the above: route normally by the user's immediate intent.

If `freshness.stale_setup_layer=true`, add one advisory line recommending rerunning `spec-mcp-setup`; do not block ordinary routing solely for stale setup-layer evidence.
