# spec-write-tasks Eval Fixture Contract

本目录包含维护者使用的确定性夹具和可由 skill-up 加载的模型评测配置，不是用户 runtime 依赖。`.skill` 打包器跳过根目录 `evals/`；从 source 仓库执行验证。

- `eval.yaml` 与 `skillup/cases/*.yaml`：现有 skill-up 模型评测入口，当前 4 个 case。先在 `skills/spec-write-tasks/` 运行 `skill-up validate evals/eval.yaml`；配置通过只证明可加载。实际 engine 运行需要单独记录版本、命令、逐 case 证据和结果。
- 下述 JSON/JSONL 与 `scripts/spec-write-tasks/run-output-evals.js`：维护仓库合同、覆盖和已有输出的确定性断言。它们不自动执行或证明模型行为。
- 两类资产互补；新增或变更 case 时分别检查其 consumer，不将一个 runner 的通过写成另一个 runner 的通过。

## Contract

- `trigger-cases.json`, `boundary-cases.json`, `failure-cases.json`, and `expected-behavior-cases.json` provide reviewable examples only; they do not replace LLM semantic judgment.
- `yao-trigger-cases.json`, `semantic_config.json`, and `output/cases.jsonl` provide Yao-compatible smoke fixtures for trigger/output eval tooling. They are compatibility evidence only; 确定性合同以本目录 JSON 和 repo runner 为准，模型评测以 eval.yaml 及其逐 case 证据为准。
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
