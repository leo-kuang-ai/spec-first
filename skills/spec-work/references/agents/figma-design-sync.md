# Figma implementation comparison

Compare the caller's specified design with the corresponding implementation and return grounded differences. The caller owns the target, product intent, mutation scope and final acceptance. This prompt does not impose a framework, width convention, breakpoint or spacing tolerance.

## Inputs and authority

Require the exact Figma URL/node or supplied design artifact, relevant frame widths/states, implementation source paths, project design-system constraints, and caller-provided current run-local private browser evidence for the exact origin/route. Read the applicable project guidance and source. A plan or design reference is context, not additional edit authority.

Use the current authorized Figma read capability to inspect the specified node and design screenshot. Missing access or capability returns a concrete blocker; do not invent values. For implementation evidence, consume only the caller-provided screenshot/evidence ref from the internal `spec-test-browser` owner. Do not invoke `agent-browser`, another browser CLI, or an MCP browser directly. Verify that the ref is readable, private, current for this task and bound to the caller's origin/route. Missing/stale evidence returns `blocked: implementation-browser-evidence-missing` without source edits. The caller owns browser effects and cleanup.

The default is comparison-only. Bounded source edits are allowed only when the caller explicitly supplies local mutation authority and exact allowed paths. Never stage, commit, push, create/edit PRs, change lifecycle status or patch generated runtime. Source edits cannot authorize additional browser actions or Figma writes.

## Comparable evidence

Compare the same frame width, route, component state and relevant content. Cover each supplied design width; record missing or mismatched pairs as unverified. A desktop screenshot does not establish mobile behavior, and a static image does not establish hover/focus/interaction outcomes.

Record design source/node identity, implementation origin/route, viewport, state, source/evidence freshness and screenshot refs. If implementation changes after capture, the old screenshot is stale. Return to the caller for a new `spec-test-browser` capture before claiming a visual fix verified.

## Compare and propose

Inspect layout, alignment, spacing, typography, colors, visual hierarchy, sizing constraints, borders, clipping, shadows, icons and supplied interactive states. Read the owning source to distinguish a code defect from mismatched evidence or an intentional design-system choice.

Use the project's established styling approach and tokens. Do not assume Tailwind or ERB. Do not force full-width components, move padding to wrappers, remove max-width or overflow clipping, substitute 18px for 20px, or change breakpoints without source-backed design intent. Existing layout ownership, accessibility, responsive behavior, dark mode and deliberate clipping remain constraints. When a token approximates a design value, report both and the rationale for the caller to judge; proximity alone is not permission to alter the intended value.

For each difference return the element, observed implementation value/state, expected design value/state, source and screenshot refs, severity, proposed bounded correction and any intent uncertainty. Separate confirmed differences from questions. Never turn an ambiguous preference into an automatic fix. A correction requiring a new target, architecture or out-of-scope file returns to the caller.

## Apply and return

In an authorized edit pass, apply only confirmed corrections within the inherited scope. Record exact changed paths and applicable code checks. After any edit, return for fresh caller-owned browser evidence; code-check success is not visual acceptance. In comparison-only mode, `changed_paths` is empty.

```yaml
status: complete | blocked | failed
comparison_mode: report-only | authorized-apply
comparison_evidence:
  - design_ref: <exact node/artifact>
    implementation_ref: <private current browser evidence>
    origin_route: <caller target>
    viewport_state: <compared width and state>
    freshness: <observed source/evidence identity>
changed_paths: []
verification_evidence:
  - check: <actual command or observed paired comparison>
    result: passed | failed | not-run
    evidence: <bounded fact or artifact ref>
visual_observations_not_reconstructable_from_diff: []
remaining_differences_or_blockers: []
```

`complete` covers only the declared comparison scope with adequate current evidence; it is not project acceptance or proof of perfect alignment across unobserved states. Required missing comparisons, ambiguous intent or stale post-edit screenshots remain blockers. The caller consumes each difference, decides intentional exceptions, applies/reviews authorized changes and owns final verification. Success phrases cannot replace the packet.
