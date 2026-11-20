# spec-write-tasks Eval Fixture Contract

This directory contains deterministic fixtures and model evaluation configuration files loadable by skill-up, and is not a user runtime dependency. The `.skill` packager skips the root directory `evals/`; validation is performed from the source repository.

- `eval.yaml` and `skillup/cases/*.yaml`: Existing skill-up model evaluation entry points, currently 4 cases. First run `skill-up validate evals/eval.yaml` in `skills/spec-write-tasks/`; passing configuration only verifies loadability. Actual engine execution requires separate recording of versions, commands, and per-case evidence and results.
- The following JSON/JSONL and `scripts/spec-write-tasks/run-output-evals.js`: maintain repository contracts, coverage, and deterministic assertions for existing outputs. They do not automatically execute or prove model behavior.
- Two types of assets are complementary; when a new or modified case is added, separately verify its consumer, and do not treat the pass of one runner as equivalent to the pass of another runner.

## Contract

- `trigger-cases.json`, `boundary-cases.json`, `failure-cases.json`, and `expected-behavior-cases.json` provide reviewable examples only; they do not replace LLM semantic judgment.
- `yao-trigger-cases.json`, `semantic_config.json`, and `output/cases.jsonl` provide Yao-compatible smoke fixtures for trigger/output eval tooling. They are compatibility evidence only; deterministic contracts are defined by the JSON files in this directory and the repo runner, and model evaluation is governed by eval.yaml and its per-case evidence.
- `output-quality-cases.json` records file-backed output-quality review cases for judging whether a skill-guided task pack is better than a generic task split. It is not a provider-backed model eval; `deterministic_assertions` can be executed by the repo-level runner, while `objective_assertions` remain reviewer narrative.
- `expected_decision` must come from the `SKILL.md` Final Decision Envelope: `compile`, `skip`, `return-to-plan`, `draft-only`, or `validate-only`.
- `expected_failure` must come from the `SKILL.md` Failure Modes enumeration.
- Every decision declared in the Final Decision Envelope must have at least one eval case.
- Every failure declared in Failure Modes must have at least one eval case.
- Deterministic tests only check JSON shape, case id uniqueness, decision/failure enum validity, coverage, and runner contract; they do not judge semantic quality.
- Output-quality cases must declare `input_files`, `baseline_risks`, `with_skill_expectations`, `objective_assertions`, and applicable `deterministic_assertions`. Missing real files, provider telemetry, human adjudication, or model execution evidence must be labeled as `missing evidence`; do not claim output quality is fully proven.
- Repo-level scorecards are written to `docs/validation/spec-write-tasks/output_quality_scorecard.{json,md}` and must include owner/review cadence, generated_at, command, source revision, rerun command, targeted recorded-output hash, and rollback boundary. Reports are maintainer evidence, not packaged runtime dependencies.

## Review Boundary

When adding or changing cases, derive the current decision/failure enums from `SKILL.md` first, then update the fixtures. Scripts detect drift; the LLM judges whether each example represents a real trigger, boundary, failure, or expected behavior.
