---
name: spec-skill-audit
description: Audit agent skills for trigger precision, scope boundaries, input/output contracts, workflow quality, progressive disclosure, eval readiness, safety, maintainability, and runtime governance. In spec-first repositories, also audit source skills, dual-host governance, generated runtime drift, and alignment with spec-first workflow principles. Do not use for installing third-party skills, creating new skills, or general code review.
argument-hint: "[target skill path or audit options]"
---

# Skill Audit

Audit agent skills as engineering protocols, not just prompt files.

## Invocation Boundary

This workflow is a source-quality auditor for skill assets. It reviews deterministic facts first, then asks the LLM to judge the semantic implications with evidence.

Do not invoke it through Agent/Task/subagent primitives. Use the current host's skill-audit entrypoint when the user wants a public workflow run.

## Purpose

Use this workflow to make skill debt visible before it turns into workflow debt.

It reviews:

- source `SKILL.md` files
- skill directory structure
- trigger clarity
- scope boundaries
- input and output contracts
- workflow steps
- scripts, references, examples, assets, and eval organization
- failure modes
- eval readiness
- instruction and script safety
- runtime governance

In a spec-first repository, it also checks:

- `skills/` as the source of truth
- dual-host governance entries
- Claude/Codex delivery expectations
- generated runtime drift
- alignment with the spec-first principle: scripts prepare deterministic facts, LLMs make semantic judgments

## When To Use

Use this workflow when the user asks to:

- audit spec-first source skills
- review `SKILL.md` quality
- check skill trigger precision
- check skill boundary overlap
- identify missing input or output contracts
- identify missing failure modes
- check source/runtime consistency
- review generated runtime drift
- prepare a skill improvement plan
- produce patch-preview suggestions for skill quality improvements

## When Not To Use

Do not use this workflow to:

- install third-party skills
- mine external GitHub skills for methodology
- directly modify `.claude/`, `.codex/`, or `.agents/skills/`
- automatically rewrite source skills without explicit confirmation
- execute implementation tasks unrelated to skill quality
- replace code review
- act as a general CLI command

External methodology research belongs in a separate future workflow such as `spec-skill-mining`.

## Inputs

Default input:

- current spec-first repository root

Optional input:

- one local skill directory under `skills/`
- `--patch-preview` when the user explicitly asks for patch-preview artifacts
- `--runtime` to include generated runtime drift checks when runtime directories are present

This workflow does not accept remote repositories, package names, or marketplace identifiers.

## Outputs

Default outputs are local audit artifacts under:

```text
.spec-first/audits/skill-audit/latest/
```

The full self-audit run may write:

- `skill-source-inventory.json`
- `expert-scorecard.json`
- `skill-audit-report.json`
- `trigger-routing-report.json`
- `boundary-overlap-matrix.json`
- `security-risk-report.json`
- `eval-readiness-report.json`
- `promise-implementation-report.json`
- `governance-drift-report.json`
- `runtime-drift-report.json`
- `executor-context.json`
- `skill-audit-summary.md`
- `skill-improvement-plan.md`

When the user explicitly asks for patch preview, it may also write:

- `patch-preview/summary.md`
- `patch-preview/*.patch.md`

`.spec-first/audits/` is a gitignored execution artifact directory. It is not source truth and can be deleted or regenerated.

## Workflow

1. Confirm the target is local. Default to the current repository's `skills/`.
2. Run deterministic fact collection:

   ```bash
   node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo .
   ```

3. If the user asked for runtime checks, include runtime drift:

   ```bash
   node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo . --runtime
   ```

4. If the user explicitly asked for patch preview, include preview artifacts:

   ```bash
   node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo . --patch-preview
   ```

5. If the user targets one source skill, pass the target explicitly:

   ```bash
   node skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo . --target skills/<skill-name>
   ```

6. Optionally prepare ECC governance pilot facts when the current checkout provides the source script:

   ```bash
   node scripts/prepare-ecc-workflow-pilot-brief.js --workflow spec-skill-audit --context-path skills/ --risk-signal harness_governance
   ```

   This brief is advisory only. `router_candidate_facts.candidate_agents` and `expert_candidate_guidance` are candidate facts, not selected auditors; standards context defines allowed use, confidence ceilings, required disclosures, fallback guidance, and forbidden claims, not final audit verdicts. `spec-skill-audit` does not use graph or optional-pack components in this pilot; those components may be skipped as unsupported without degrading the audit. Do not run external connectors, call graph providers, modify repo-profile, or write `.claude/`, `.codex/`, `.agents/skills/`, or other runtime assets from this step. If the script is absent, fails, or returns degraded component status, continue with the existing audit process and disclose the limitation as `ECC governance pilot facts unavailable` or `ECC governance pilot facts degraded: <reason>`.
7. Read `skill-audit-summary.md`, `skill-improvement-plan.md`, and the JSON reports relevant to the user's question.
8. Review the deterministic findings using `references/expert-audit-rubric.md`.
9. Treat scorecards as signals, not gates.
10. For each P0/P1 finding you surface to the user, include signal, file/section evidence, counter-evidence status, decision, reason, recommendation, and confidence.
11. Do not modify source files unless the user separately asks to apply a specific fix.

## Governance

This workflow is read-only by default with respect to reviewed source and runtime assets.

It may write audit reports under:

- `.spec-first/audits/skill-audit/`

It must not modify these paths without explicit user confirmation:

- `skills/`
- `agents/`
- `templates/`
- `src/cli/contracts/`
- `.claude/`
- `.codex/`
- `.agents/skills/`

Generated runtime assets must be repaired by rerunning `spec-first init --claude` or `spec-first init --codex`, not by hand-editing generated copies.

## Failure Modes

If no source skills are found:

- report `NO_SKILLS_FOUND`
- show searched paths
- suggest the expected `skills/<name>/SKILL.md` layout

If the target is not the spec-first repo root or one local skill directory under `skills/`:

- stop for this version
- explain that generic local skill collection audit is intentionally deferred

If governance validation fails:

- continue source inventory and structure checks
- report the governance validation error as audit evidence
- do not rewrite the governance file

If runtime directories are missing:

- mark runtime status as `not_initialized`
- do not fail the audit
- recommend rerunning the appropriate init command only when runtime delivery is required

If runtime drift is detected:

- report drift
- recommend rerunning init
- do not patch generated runtime copies

## References

Use these files only when needed:

- `references/expert-audit-rubric.md`
- `references/report-format.md`
- `references/security-threat-model.md`
- `references/source-vs-runtime-contract.md`
