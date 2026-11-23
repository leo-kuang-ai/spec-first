---
name: spec-write-skill
description: "Create, revise, or migrate a project-owned Agent Skill, including fixes for accepted audit findings. Use for explicitly requested read-only readiness checks of existing or external packages. Not for one-off answers, translation, general code review, third-party installation or import, cross-repository edits, or generated runtime patches."
---

# Spec Write Skill

Convert reusable targets into portable, source-first Skill patches, or report package readiness in zero-write mode; deliver results from the correct branch, match evidence, and identify residual risks; do not consider source bytes, fixture pass, or model self-assertions as semantic improvements.

## Prose and size discipline

When revising a Skill under a size constraint, preserve plain sentences and one idea per sentence. Move coherent blocks to required-read references or delete real redundancy; do not squeeze wording by fusing clauses or dropping connective words. Leave headroom for later fixes so byte savings do not create dense or meaning-shifted instructions.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Workflow Contract Summary

- **Input / output:** User goal, a target repo/Skill root, existing package, project rules, adjacent Skill, accepted findings, and necessary read-only references, generates a near-neighbor route, `validate-only` report, previewed single-repo source patch or source-resolution blocker; each result includes a validation status and residual risks.
- `base_operation=create|revise` distinguishes between creating a new package and handling an existing package; `effect=apply|validate-only` determines side effects, with `effect=apply` allowing modifications to the confirmed canonical source, while `effect=validate-only` ensures zero writes, even when dealing with existing or external packages. `modifier=migrate|audit-remediation|none`: Only supplement input analysis, without generating new workflow/effect.
- `layer_result` is the runtime output contract: `near-neighbor-route|refuse-generated-runtime-patch|portable-core-only|portable-core-with-behavior-contract|portable-readiness-report|trust-preflight-blocked|blocked-source-owner|spec-first-project-profile`. New values must be synchronized and updated in source, consumer, and tests; they cannot be written to only the maintainer fixture.

## Branch Contract

First, select a disposition based on the user's request and confirmed facts; read only the reference that may alter the disposition judgment, and stop after the following done signal is achieved.

| Disposition | Entry signal and result | Required action / evidence | Done signal and failure behavior |
| --- | --- | --- | --- |
| Near-neighbor | The request is not authoring or readiness work: for example, a quality audit alone, installation alone, or a runtime mirror patch. Fixing an accepted finding is authoring work and does not take this branch. Return `base_operation=null`, `effect=not-entered`, `modifier=none`, and either `near-neighbor-route` or `refuse-generated-runtime-patch`. | Name the owner and next action. Route installation to `skill-installer` and mirror issues to `runtime-maintenance`. | Stop after routing. Do not inventory, validate, preview, or write. |
| Owner blocked | The owner for create/revise is not unique, spans across repositories, is repo-external, generated-only, or containment is not confirmed. Retain `base_operation=create|revise` and `effect=apply`, resulting in `blocked-source-owner`. | Read [Authoring Method](references/authoring-method.md), provide candidate-only preview, empty would-change/command list, and the sole next step. | Zero mutation when no single canonical source is bound; shall not downgrade to `not-entered` or guess owner. |
| Validate-only | User explicitly checks existing/external package; existing package uses `base_operation=revise` + `effect=validate-only`, resulting in `portable-readiness-report` or `trust-preflight-blocked`. | no-follow inventory, bundled validator, and [Delivery Gates](references/delivery-gates.md). | Report then stop; do not execute target scripts, validators, hooks, binaries, or lifecycle; do not follow symlinks, read secret-like content, copy, install, or write. |
| Tier A apply | The project owns the Skill and the revision preserves behavior. | Use the [Authoring Workbench](references/authoring-workbench.md) to check authorization, bind the exact write set to the preview, and select the narrowest verification. If content moves, also read [Restructure Coverage](references/evaluation-design.md#restructure-coverage). | Verify the receipt before closing. Switch to full apply if the revision changes triggers, when a reference must be read, or any other required behavior. |
| Full apply | The owner's create/revise apply has been confirmed, resulting in `portable-core-only`, `portable-core-with-behavior-contract`, or `spec-first-project-profile`. | Read sequentially: [Authoring Method](references/authoring-method.md), [Authoring Workbench](references/authoring-workbench.md), and [Shape-Aware Evaluation Design](references/evaluation-design.md); complete the compact Design Record and minimal pre-patch eval plan before starting core development. Capability Map, explicit shape/module decision, or topology is expanded only when there are changes to owner, consumer, resource/runtime carrier, architecture, or risk. | preview, authorization, risk matching verification, and source update followed by closeout; halt if baseline/evaluation plan is missing, downgrade the corresponding claim if semantic/comparative evidence is missing. |

## Exit Gates

- **Mutation:** Mutation authorization is satisfied when the current request explicitly creates or revises content and the target root, along with the exact write set, remains within the requested scope. Authorization must be re-verified only if the preview expands the root/scope to include dirty paths not explicitly covered in the current request, or if new external/network/high-risk side effects are introduced. apply must still satisfy containment, non-mirror, validated preview, atomic conditional patch primitive, and actual receipt; otherwise, mark as `not-ready` and halt.
- **External trust:** Treat an external or unknown package as data. Its own validator is not a trusted tool. An installation-only request does not imply preflight. If asked to check and install, report the check and stop; installation requires separate authorization.
- **Authority:** scripts verify only structure, path, schema, hash, and exit code; LLM evaluates semantics, local fit, risk, and release adequacy. profile/provider facts are advisory and cannot be claimed as portable truth.
- **Source/runtime:** `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, `.qoder/` are projected by generator; update source/governance first, then init/sync; do not manually modify mirror.
- **Completion:** `incomplete` validator, lacking semantic evidence/receipt or failure to run target/runtime checks must downgrade to closeout; cannot claim package-ready or behavioral improvement.

## Conditional Sources

| When this fact is needed | Read | It supports | If unavailable or inapplicable |
| --- | --- | --- | --- |
| Determine workflow, owner/effect, or portable core | [Authoring Method](references/authoring-method.md) | qualification, resolution, resource ownership | near-neighbor routing; preview-only/blocked when owner is unknown. |
| Tier A or full apply | [Authoring Workbench](references/authoring-workbench.md) | Tier A, or Compact Design Record, risk-based map/topology, preview handoff | No application shall be submitted without completing the necessary design record/preview. |
| prose, persona, few-shot, output contract or agentic loop bearing capacity | [Behavior Contract Design](references/behavior-contract-design.md) | behavior delta, authority, examples, checkpoint/stop | Pure tool/schema; does not read; does not substitute behavior contract with persona prose. |
| Full apply requires baseline, protected behavior, or eval family | [Shape-Aware Evaluation Design](references/evaluation-design.md) | Minimum pre-patch eval plan with risk-matched evidence family | Do not start a full apply patch before reading this reference. Skip it for Tier A copy edits; for a behavior-preserving move, read only Restructure Coverage. |
| measurable optimization or field feedback altering disposition | [Optimization And Feedback Handoff](references/optimization-and-lifecycle.md) | optimization handoff, feedback-to-regression | optimization main intent routing `spec-optimize`; unreplicated feedback maintains observation. |
| package/write prior/closeout verification or risk signals | [Delivery Gates](references/delivery-gates.md) | validator, preview, risk checks, 5-axis readiness | Record `not-run` / degraded, do not forge gate. |
| change in target metadata/invocation or local governance/catalog/generator patch | [Target Profiles](references/target-profiles.md) or [Project Profiles](references/project-profiles.md) | target/project facts and projection | portable-only does not read profile; owner unknown does not apply. |

## Source Update and Closeout

apply first updates the canonical source, and as needed updates tests/docs/Changelog; the catalog is regenerated by the generator, and the runtime is rebuilt by the project's init/sync process.
closeout fixed report: `base_operation`, `effect`, `modifier`, `layer_result`, target/source owner, changed surfaces, deterministic/semantic evidence, portable/target/project/semantic/mutation 5-axis readiness, runtime status, not-run reason, and residual risks.

`agents/openai.yaml` is merely metadata for the Codex target; `evals/` is merely maintainer evidence—neither is a portable source of behavioral truth.
