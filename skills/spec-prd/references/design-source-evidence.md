# Design-Source Evidence

Load this reference only when a front-end/UI PRD input includes a design source such as a Figma URL, screenshot, exported design context, page description, or interaction-state material.

This is a trigger-only reference. It is not part of ordinary PRD authoring, not a setup baseline, not a persistent artifact, and not a PRD/Figma/source consistency audit.

## Trigger Boundary

Use this branch when both are true:

- the requested increment affects App, H5/PC, Admin, visual interaction, layout, copy, form state, navigation, accessibility, or another UI-facing surface
- the input includes a design source: Figma URL, screenshot, local exported context, OCR, page-state notes, prototype notes, or owner-provided design description

Do not load this branch for backend-only, CLI-only, workflow-only, or implementation-plan inputs unless UI behavior or acceptance depends on design facts.

## Evidence Flow

Follow this run-local chain:

```text
URL parse -> tool discovery -> auth/access probe -> node-level context fetch or degraded reason
  -> design-WHAT extraction -> code/owner reconciliation -> PRD write targets / Planning Recheck
```

- `URL parse`: identify design host, file key, node id, branch key, page/screen hint, or local `figma-context:<path>` without assuming any one host format.
- `tool discovery`: check whether the current host exposes an appropriate Figma/design tool or whether a local exported context was provided.
- `auth/access probe`: determine whether the current user/session can access the design source. Do not infer access from maintainer-local machines or prior sessions.
- `node-level context fetch or degraded reason`: fetch scoped context when available; otherwise record why not: missing tool, no auth, no access, unsupported host, headless no-fetch, bad URL, stale export, or user omitted design material.
- `design-WHAT extraction`: extract only PRD facts: entry, screen/state, copy, empty/loading/error, permissions, i18n, accessibility, confirmation, cancellation, and acceptance-relevant behavior.
- `code/owner reconciliation`: compare design-source claims with current source/docs when relevant, and ask owner only for target behavior decisions that source cannot answer.
- `PRD write targets / Planning Recheck`: write confirmed or accepted design facts into `Interaction Requirements`, `Use Cases`, `Acceptance Examples`, `Evidence And Assumptions`, or `Planning Recheck`.

Before reporting design coverage, build `design_source_inventory` first. The inventory is the denominator for coverage and must include explicit input refs, Figma-discoverable nodes from the file/page/frame when accessible, and design-dependent states referenced by requirements such as secondary pages, detail pages, module failure states, loading states, empty states, and error states. Each item records `source_or_node`, `read_status`, PRD write target, evidence level, unread reason, and readiness consequence. Then list `design_sources_read`, `design_sources_unread`, and `design_source_coverage`; a read-only list is not full coverage if unread design-dependent nodes were omitted.

## Advisory Posture

Design-source facts are advisory until confirmed:

- fetched Figma/design context is `source-candidate` / `provider_untrusted`
- screenshots and OCR are source-candidate unless owner confirms them
- exported design context is only as fresh as its export timestamp/source note
- code/source contradictions must be surfaced rather than silently normalized
- unconfirmed design WHAT goes to `Planning Recheck`, `Evidence And Assumptions`, `Outstanding Questions`, or a source-backed owner question
- unread design nodes that can change UI structure, state, interaction, acceptance, or scope must block `ready-for-planning` until read, owner-confirmed, or explicitly downgraded with a readiness consequence

Do not present design evidence as confirmed project scope merely because a tool can read it.

## Figma And Tool Boundary

Figma is optional per run, per user, per host, and per OS:

- do not assume Figma MCP/plugin, Figma Desktop, browser login, team access, local shell, Node package manager, or a specific host tool name exists
- do not install MCP/plugins from `spec-prd`
- do not claim `$spec-mcp-setup` or `/spec:mcp-setup` installs Figma unless setup contracts explicitly add that optional capability
- do not write OS-specific installation commands into this reference or generated PRDs
- do not store maintainer-local identity probe output, account names, team ids, auth state, or successful tool probes in long-lived contracts or eval fixtures

When design tools are unavailable, degrade loudly and continue with screenshot, exported context, local `figma-context:<path>`, reference-claim, or owner description. Degraded design evidence is not silently planning-ready: unread inventory items default to blocking readiness until owner explicitly accepts the degraded risk, and the PRD records `design_sources_unread`, degraded reason, readiness consequence, and any remaining Planning Recheck / Outstanding Questions residue.

## External Evidence Interface

Callers consume only this interface:

```text
design_source:
  source_ref:
  evidence_tag: source-candidate | provider_untrusted | user-stated | assumption
  extraction_status: fetched | degraded | not-run
  degraded_reason:
  design_source_inventory:
  design_sources_read:
  design_sources_unread:
  design_source_coverage:
  extracted_design_what:
  affected_PRD_write_targets:
  reconciliation_needed:
```

This interface is run-local prose guidance, not a schema or artifact. It tells `$spec-prd` what to carry into Product Expert Lens and PRD sections.

## Internal Probe Trace

Keep internal probe detail local to the run:

- parsed URL/file/node details
- tool name discovered in the current host
- auth/access probe result
- fetch error or degraded reason
- excerpt/screenshot/export provenance

Do not require downstream references to understand provider-specific probe detail. Do not lock provider algorithms in tests.

## Headless Or Report-Only Runs

When the run cannot fetch remote design context because it is headless, report-only, offline, unauthenticated, or missing a tool:

- do not block PRD authoring
- record `degraded_reason`
- use user-provided screenshots, local exports, or text descriptions as source-candidate material
- put unresolved design claims into `Planning Recheck` or `Outstanding Questions`
- state that design-source capability was not semantically verified in closeout when it matters
- if unread design-source inventory items affect page structure, state, interaction, acceptance, or scope, do not mark the PRD `ready-for-planning`
- owner-accepted degradation is the only ready-for-planning release valve; record the owner decision and keep unread design residue visible

## Route-Out Boundary

`spec-prd` extracts PRD facts from design sources. It does not audit implementation consistency across PRD, Figma, and source. When the user asks for consistency, drift, visual implementation accuracy, or app-vs-design verification, route to `spec-app-consistency-audit`.
