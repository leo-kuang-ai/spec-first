# Skill Authoring Quality Rubric

Use this lens when a finding is about how a skill is written, migrated, or refactored. It mirrors the vocabulary used by `spec-write-skill`, but audit output remains evidence-based review, not automatic rewriting.

## P1 Candidates

Treat as P1 when evidence shows a likely behavior or ownership bug:

- description does not name concrete trigger intent, so a near-neighbor workflow is likely to mis-trigger
- entry surface and body disagree, such as a standalone skill presenting itself as a public command-backed workflow
- the skill authoring flow lacks a qualification step and may turn one-off, explain-only, document-export, or future-outline requests into unnecessary skills
- the skill takes over upstream planning, downstream implementation, runtime repair, or another workflow's owner boundary
- write, shell, runtime, delegation, or handoff steps have no checkable completion criterion
- source/runtime boundary text tells users to edit generated mirrors as the normal fix

## P2 Candidates

Treat as P2 when evidence shows maintainability or variance risk:

- `SKILL.md` carries long examples, full rubrics, provider details, or conditional material that should be disclosed through `references/`
- repeated trigger synonyms, duplicated rules, or stale historical layers create multiple truth sources
- references are not pointed to from `SKILL.md`, or pointers do not say when to read them
- evals, examples, or package-local validation are absent for a high-risk authoring/change workflow
- quality tier or gate selection is vague, causing scaffold work to receive heavy governance or governed work to lack owner/review/rollback evidence
- leading words are weak no-ops rather than project vocabulary that changes behavior

## Not Findings By Themselves

- A lightweight read-only skill does not need heavyweight checkpoints.
- A standalone skill is allowed to be user-facing without a `spec-*` workflow alias.
- A scorecard or keyword hit is only a signal; confirm source evidence and counter-evidence before surfacing.
- Progressive disclosure drift is an optimization/risk signal unless it causes wrong routing, unsafe writes, or unusable instructions.

## Evidence Shape

Use `signal -> evidence -> counter-evidence -> decision`:

- cite the exact `SKILL.md` section, reference pointer, governance record, runtime catalog fact, or eval fixture
- state whether the concern affects trigger precision, boundary ownership, completion criteria, information hierarchy, packaging, or source/runtime governance
- recommend a concrete source-owned fix, but do not claim the audit workflow has authorization to apply it
