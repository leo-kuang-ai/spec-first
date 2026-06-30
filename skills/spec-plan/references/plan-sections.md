# Plan Sections

This reference describes what a durable spec-first implementation plan contains. It does not prescribe page styling. Markdown rendering lives in `markdown-rendering.md`; optional HTML sidecar guidance lives in `html-rendering.md`.

Current posture: Markdown remains the canonical plan artifact. `plan-template.md` is still the concrete markdown skeleton that `spec-plan`, `spec-work`, `spec-write-tasks`, and `spec-doc-review` can consume. Do not replace or delete it until every downstream consumer has focused tests for the replacement.

## Outcome

A strong plan enables three audiences to act:

- The implementing agent or human starts from a grounded baseline: goals, non-goals, requirements, decisions, unit boundaries, and verification expectations are explicit.
- The reviewer can identify load-bearing choices and changed boundaries in one pass.
- A future reader can trace why the work exists, what evidence shaped it, and where follow-up context lives.

Sections earn their place by helping one of those audiences. Omit padding.

## Hard Floor

When a plan document is warranted, it includes:

- **Summary** - 1-3 lines describing what the plan proposes.
- **Problem Frame** - why the work exists and what current situation it changes.
- **Requirements** - stable R-IDs or equivalent success criteria that downstream review can check.
- **Key Technical Decisions** - decisions that constrain implementation, with rationale.
- **Implementation Units** - stable U-IDs, goals, files, test scenarios, verification, dependencies, and relevant requirements.
- **Direct Evidence Readiness / Direct Evidence** - what was actually read or verified, plus limitations.
- **Sources & References** - only useful breadcrumbs, not process exhaust.

## Include When Material

Include these only when they carry real information:

- **Decision Brief** - a front-loaded Standard/Deep plan reading aid immediately after `## Summary`. Use it when a human first pass needs the recommended approach, load-bearing decisions, validation focus, largest risks, or scope boundaries before the dense evidence and unit detail. It summarizes and points to lower sections; it does not replace `## Summary`, `## Key Technical Decisions`, `## Risks & Dependencies`, Direct Evidence, or Implementation Units. Lightweight plans may omit it when the 1-3 line Summary is enough.
- **Assumptions** - unconfirmed inferred bets, especially in headless or non-interactive planning.
- **Scope Boundaries** - contested exclusions, deferred follow-up work, or tempting non-goals.
- **Open Questions** - unresolved planning-owned or implementation-owned unknowns.
- **High-Level Technical Design** - diagrams, pseudo-code, or data-flow sketches when prose alone leaves the approach ambiguous. Frame as directional guidance, not implementation code.
- **System-Wide Impact** - cross-cutting data, auth, lifecycle, API, rollout, or integration consequences. For Standard/Deep plans that materially touch more than one client, backend, API/schema/event contract, data lifecycle, operational concern, or rollout path, enrich this section with a conditional surface-coverage lens: enumerate only the surfaces that actually exist in the target repo/product and were materially considered; mark each as `in-scope`, `out-of-scope: <reason>`, or `deferred: <owner/trigger>`. Representative examples include App, H5, PC web, Admin, backend, data/API, events/jobs, observability, and testing, but this is not a closed list. Omit irrelevant surfaces entirely; do not carry empty rows or a `not-applicable` state.
- **Risks & Dependencies** - meaningful risks, material dependencies, and mitigation or acceptance.
- **Documentation / Operational Notes** - docs, monitoring, rollout, or runbook impacts.
- **Output Structure** - greenfield directory or package shape when layout itself is a decision.
- **Alternative Approaches Considered** - only for real architectural, sequencing, boundary, or rollout alternatives.

## Agent Agency

The section catalog is a floor, not a ceiling. Preserve the canonical markdown artifact and the hard-floor contract, but let the plan content drive local structure when the catalog does not carry the shape cleanly.

The planning agent may:

- Merge Problem Frame into Summary for compact plans when no decision context is lost.
- Add subheadings inside Requirements, Key Technical Decisions, or Implementation Units when grouping by capability, component, phase, or risk makes the plan easier to execute and review.
- Introduce a material section that is not listed above when it names content that would otherwise be forced into the wrong place.
- Place diagrams, tables, or examples in the section where they make the implementation boundary clearer, while keeping the same markdown source truth.

Do not use this agency to skip canonical markdown, omit hard-floor sections from a warranted implementation plan, hide unresolved scope as prose style, or change the downstream artifact contract.

## Prose Economy

Include-when-material decides which sections appear; prose economy decides how the kept sections read. A section can be material and still fail by turning into padded text where contradictions hide and implementation units blur together.

Hold every kept section to these rules:

- One idea per sentence. If a sentence carries several branches, split it or move the unresolved fork to Open Questions.
- State the action in the verb. Prefer "Demote optional sync" over "the demotion of optional sync is the intended change".
- Keep requirements and implementation units scoped to one intent plus any load-bearing qualifier.
- Resolve in place; do not stratify. When a review or later decision supersedes text, rewrite or remove the live text instead of stacking a "resolution" layer on top.
- Precision is not padding: keep paths, IDs, schema names, thresholds, and exact conditions verbatim.

The quick check before handing off: can an implementer find the live decision, scope boundary, and verification expectation in each section in one pass? If not, cut connective prose, split overloaded items, or move deferred material out of implementation units.

## Metadata Fields

Plan metadata is part of the artifact contract. In canonical markdown it appears in YAML frontmatter. Optional HTML sidecars may render equivalent values visibly, but the markdown source remains canonical until HTML consumer parity is explicitly tested.

Required metadata:

- `title` - visible plan title.
- `type` - conventional-commit-style intent such as `feat`, `fix`, `refactor`, `docs`, `test`, or `chore`.
- `status` - `active` on creation; `spec-work` may later update the markdown source to `completed`, `partially-shipped`, or another existing lifecycle value.
- `date` - creation date in `YYYY-MM-DD`.
- `spec_id` - local spec-chain identity for software plans.

Optional but stable metadata:

- `origin` - repo-relative upstream requirements path.
- `origin_grade` - source category from Phase 0.2 candidate discovery: `prd`, `brainstorm`, or `legacy`. It is advisory classification, not a readiness gate.
- `origin_verification_status` - consumer receipt verification posture for PRD-grade origins: `verified`, `unverified`, `degraded`, or `not-applicable`.
- `origin_verification_reason_codes` - receipt verifier `reason_codes`, or explicit degraded reasons such as `input_side_recheck_degraded` or `verifier_unavailable`.
- `deepened` - date when confidence-first deepening substantively strengthened the plan.
- `implements_schemas` - repo-relative schema paths actually implemented by the plan.

Never rename existing metadata fields or repurpose their semantics.

## ID And Content Rules

- Stable IDs do not get renumbered to clean up gaps.
- Use plain visible prefixes such as `R1.`, `U1.`, `AE1.`, and `KTD1.`.
- All paths in the plan body are repo-relative. Never use absolute paths such as `/Users/name/Code/project/src/file.ts`; use `src/file.ts` instead so plans remain portable across machines, worktrees, and teammates.
- When a plan targets a different repo than the document's home, state the target repo once at the top of the plan, for example `**Target repo:** my-other-project`, and use paths relative to that repo throughout the body.
- Plans do not carry execution progress checkboxes; progress is derived from git and spec-work evidence.
- Engineering process metadata belongs in closeout, commits, or run artifacts, not the plan body.

## Rendering Boundary

Section content and rendering are separate decisions:

- `plan-sections.md` defines what the plan contains.
- `markdown-rendering.md` defines how the canonical markdown plan is presented.
- `html-rendering.md` defines optional HTML sidecar rules only. It is not an exclusive output mode, not a second source of truth, and not a replacement for markdown consumers.

If an HTML sidecar is produced in a future run, the markdown plan must still be written first, and the sidecar must link back to the canonical markdown path or otherwise visibly name it.
