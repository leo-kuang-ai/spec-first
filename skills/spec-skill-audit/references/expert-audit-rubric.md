# Expert Audit Rubric

Use deterministic reports as evidence, not as final judgment.

## Core Principle

Scripts enforce mechanically decidable invariants and prepare facts. The LLM decides whether those facts imply a real quality issue above that floor.

## Skill Authoring Quality Rule

When judging how a skill is written or migrated, also apply `references/skill-authoring-quality.md`: check description-as-trigger, entry surface fit, information hierarchy, completion criteria, granularity, pruning, leading words, and failure modes. These are semantic review signals, not deterministic gates or automatic rewrite orders.

## P0

Treat as P0 when evidence shows:

- missing `SKILL.md`
- missing governance entry for a bundled source skill
- duplicate public workflow command name
- internal-only asset exposed as a public entry
- instruction to bypass governance or system/developer rules
- secret access or exfiltration
- direct generated runtime modification as a default behavior
- remote script execution without explicit confirmation

Every P0 must include file evidence, reason, recommendation, and confidence.

## P1

Treat as P1 when evidence shows:

- routing description is too broad and likely to mis-trigger
- boundary overlaps another workflow in a way that changes ownership
- input or output contract is unclear for downstream consumers
- workflow has no failure behavior for common missing inputs
- runtime delivery conflicts with governance
- security boundary is missing for write or shell behavior

## P2

Treat as P2 when evidence shows:

- examples or evals are missing
- progressive disclosure is weak but not dangerous
- references are stale or broken
- scoring or reporting is present but lacks human review guidance
- a review-style agent declares what it is hunting for but lacks a corresponding `What you don't flag` guard section or the guard does not cover its highest false-positive-risk dimensions; use `reviewer-guard-coverage-report.json` as section-presence evidence, then check counter-evidence before deciding. Agents whose role is explicitly adversarial or challenge-only may be N/A rather than findings.
- authoring quality issues from `references/skill-authoring-quality.md` create maintainability or variance risk but do not change ownership, routing, safety, or runtime behavior.

## Scorecard Rule

Scores are signals, not gates. A low score tells reviewers where to look; it does not automatically block release.

## Evidence Rule

For P0/P1 findings, surface only findings with concrete evidence. If the evidence is just a keyword candidate, label it as a candidate and lower confidence.

## Decision Evidence Rule

Treat deterministic script output as a signal chain:

```text
signal -> evidence -> counter-evidence -> decision
```

- Signal starts the investigation. It does not prove the issue.
- Evidence must cite concrete source files, runtime facts, governance records, or script output.
- Counter-evidence checks whether an apparent issue is intentional, N/A, mitigated, contradicted, or scope-limited.
- Decision is the LLM judgment: `accepted`, `tentative`, `unresolved`, or `rejected`.

Strong P0/P1 findings require `complete` evidence and checked counter-evidence. If counter-evidence is not checked, keep the finding `tentative`.

## Workflow Completeness Rule

Do not require every skill to use checkpoints. Instead, judge the workflow shape against the skill's actual risk:

- Batch processing, source writes, runtime writes, report aggregation, and parallel review need explicit done signals or verification steps.
- Lightweight read-only skills may mark checkpoint-style discipline as N/A.
- Missing failure behavior matters most when the workflow accepts paths, writes artifacts, shells out, or delegates work.

Completeness findings are review signals unless they create wrong routing, wrong execution, or unsafe writes.
