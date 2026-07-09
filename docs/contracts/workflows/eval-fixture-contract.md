# Eval Fixture Contract

This contract defines the source-owned structure for workflow eval fixtures. It is a light structural contract, not a semantic judge.

## Canonical Shape

New workflow fixture files should use `spec-first.workflow-eval-fixtures.v1`:

```json
{
  "schema_version": "spec-first.workflow-eval-fixtures.v1",
  "skill": "spec-plan",
  "description": "Examples-as-context for trigger and boundary coverage.",
  "source_refs": ["skills/spec-plan/SKILL.md"],
  "source_ref_authority": "source",
  "cases": [
    {
      "id": "clear-planning-request",
      "input": "Plan the implementation for a settled requirements document.",
      "coverage_tags": ["trigger"],
      "expected_outcome": "Use the planning workflow and do not implement code."
    }
  ]
}
```

Top-level `source_refs`, `source_ref_authority`, and `coverage_tags` are inherited by every case. Case-level values extend those defaults. Local fields may live under `extensions`, and legacy fixture files may keep their existing local fields while the source-owned normalizer adapts them.

## Required Case Fields

Every normalized case must have:

- `id`: stable within the skill.
- `input`: the user intent, fixture input, or compact input shape.
- `coverage_tags[]`: declared structural coverage, such as `trigger`, `boundary`, `failure`, `expected`, `routing`, `source-runtime-boundary`, or `dispatch-boundary`.
- `source_refs[]`: repo-relative source evidence for why the case belongs in the fixture.
- `source_ref_authority`: `source`, `historical`, or `advisory`; default is `source`.

`expected_outcome` is tag-dependent:

- `trigger` and `expected` cases require non-empty `expected_outcome`.
- `boundary` cases may omit `expected_outcome` only when they provide `boundary_note` or `forbidden_signals[]`.
- `failure` is an optional readiness bucket in this slice, but failure cases should still carry enough local expected fields for their owning workflow tests.

This contract assumes single-shot expected-match cases. It does not model multi-trial sampling.

## Source Ref Authority

`source_ref_authority: "source"` means the referenced path is current source-of-truth. It must not point into generated runtime mirrors or historical artifacts:

- `.claude/**`
- `.codex/**`
- `.agents/skills/**`
- `docs/plans/**`
- `docs/validation/**`

External URLs are not valid `source_refs[]`; keep external facts in local docs, notes, or `extensions` and anchor release-readiness evidence to repo-relative source paths.

Use `historical` or `advisory` when a case intentionally cites plans, validation records, or other non-source artifacts. These cases still need a current source anchor when they are used as release-readiness evidence.

## Consumers

The previous source-owned adapter lived under a retired audit workflow. After that workflow's retirement, no current source-owned normalizer is exposed; remaining eval fixture checks are local to their owning workflow tests.

`coverage_tags` are declared structural coverage. They do not prove semantic quality. Fresh-source eval, human sampling, or LLM review owns the semantic question of whether a case is meaningful.
